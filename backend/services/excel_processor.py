import pandas as pd
import os
from datetime import datetime, date
from typing import List, Dict, Any, Optional, Tuple
from werkzeug.utils import secure_filename
import logging

from utils.date_parser import DateParser
from models import UsageRecord, Personnel

logger = logging.getLogger(__name__)

class ExcelProcessor:
    """Service class for processing Excel files with storage-integrated usage records"""
    
    # Expected column mappings for current Chinese schema
    COLUMN_MAPPINGS = {
        '类型': ['类型', 'Type', 'type'],
        '产品名': ['产品名', 'Product Name', 'product_name', 'chemical_name', 'chemical'],
        '数量及数量单位': ['数量及数量单位', 'Quantity', 'quantity', 'original_quantity'],
        '存放地': ['存放地', 'Location', 'location', 'place'],
        'CAS号': ['CAS号', 'CAS Number', 'cas_number', 'cas'],
        '使用人': ['使用人', 'Personnel', 'personnel', 'user'],
        '使用日期': ['使用日期', 'Usage Date', 'usage_date', 'date'],
        '使用量': ['使用量', 'Usage Amount', 'usage_amount', 'used'],
        '余量': ['余量', 'Remaining', 'remaining', 'left'],
        '单位': ['单位', 'Unit', 'unit'],
        '备注': ['备注', 'Notes', 'notes', 'comment'],
    }

    @staticmethod
    def normalize_column_names(df: pd.DataFrame) -> pd.DataFrame:
        column_mapping = {}
        for col in df.columns:
            col_str = str(col).strip()
            for standard_name, variations in ExcelProcessor.COLUMN_MAPPINGS.items():
                if col_str in variations:
                    column_mapping[col] = standard_name
                    break
        df = df.rename(columns=column_mapping)
        return df

    @staticmethod
    def clean_data(df: pd.DataFrame) -> pd.DataFrame:
        df = df.dropna(how='all')
        string_columns = ['类型', '产品名', '数量及数量单位', '存放地', 'CAS号', '使用人', '单位', '备注']
        for col in string_columns:
            if col in df.columns:
                df[col] = df[col].fillna('')
        
        # Parse usage date
        if '使用日期' in df.columns:
            df['使用日期'] = df['使用日期'].apply(
                lambda x: DateParser.parse_date(str(x)) if pd.notna(x) else None
            )
        
        # Fill numeric columns
        for col in ['使用量', '余量']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        return df

    @staticmethod
    def validate_record(record: Dict[str, Any]) -> Tuple[bool, List[str]]:
        errors = []
        required_fields = ['类型', '产品名', '存放地', '使用日期', '使用人', '使用量']
        for field in required_fields:
            if not record.get(field):
                errors.append(f"Missing required field: {field}")
        
        if record.get('使用日期') and not isinstance(record['使用日期'], date):
            errors.append("Invalid date format for 使用日期")
        
        if '使用量' in record and (not isinstance(record['使用量'], (int, float)) or record['使用量'] < 0):
            errors.append("Invalid 使用量 value")
        
        if '余量' in record and (not isinstance(record['余量'], (int, float)) or record['余量'] < 0):
            errors.append("Invalid 余量 value")
        
        return len(errors) == 0, errors

    @staticmethod
    def import_excel(file_path: str) -> Tuple[List[Dict[str, Any]], List[str]]:
        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path, encoding='utf-8')
            else:
                df = pd.read_excel(file_path, engine='openpyxl')
            df = ExcelProcessor.normalize_column_names(df)
            df = ExcelProcessor.clean_data(df)
            records = df.to_dict('records')
            valid_records = []
            errors = []
            for i, record in enumerate(records):
                is_valid, record_errors = ExcelProcessor.validate_record(record)
                if is_valid:
                    valid_records.append(record)
                else:
                    errors.append(f"Row {i+2}: {'; '.join(record_errors)}")
            return valid_records, errors
        except Exception as e:
            logger.error(f"Error importing Excel file: {str(e)}")
            return [], [f"Import error: {str(e)}"]

    @staticmethod
    def export_excel(records: List[Any], output_path: str) -> bool:
        try:
            data = []
            for record in records:
                # UsageRecord now uses Chinese field names and storage integration
                data.append({
                    '类型': getattr(record, '类型', ''),
                    '产品名': getattr(record, '产品名', ''),
                    'CAS号': getattr(record, 'CAS号', ''),
                    '存放地': getattr(record, '存放地', ''),
                    '使用日期': DateParser.format_date_for_display(getattr(record, '使用日期', None)),
                    '使用人': getattr(record, '使用人', ''),
                    '使用量': getattr(record, '使用量', None),
                    '余量': getattr(record, '余量', None),
                    '单位': getattr(record, '单位', ''),
                    '备注': getattr(record, '备注', ''),
                })
            df = pd.DataFrame(data)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Usage Records', index=False)
                worksheet = writer.sheets['Usage Records']
                for column in worksheet.columns:
                    max_length = 0
                    column_letter = column[0].column_letter
                    for cell in column:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except Exception:
                            pass
                    adjusted_width = min(max_length + 2, 50)
                    worksheet.column_dimensions[column_letter].width = adjusted_width
            return True
        except Exception as e:
            logger.error(f"Error exporting Excel file: {str(e)}")
            return False

    @staticmethod
    def create_sample_template(output_path: str) -> bool:
        try:
            sample_data = [
                {
                    '类型': '化学品',
                    '产品名': '盐酸',
                    '数量及数量单位': '100ml',
                    '存放地': '化学品柜A',
                    'CAS号': '7647-01-0',
                    '使用人': '张三',
                    '使用日期': '2025-01-15',
                    '使用量': 5,
                    '余量': 95,
                    '单位': 'ml',
                    '备注': '滴定实验'
                },
                {
                    '类型': '化学品',
                    '产品名': '胰蛋白酶',
                    '数量及数量单位': '50ml',
                    '存放地': '4°C冰箱B',
                    'CAS号': '9002-07-7',
                    '使用人': '李四',
                    '使用日期': '2025-01-16',
                    '使用量': 2,
                    '余量': 48,
                    '单位': 'ml',
                    '备注': '细胞消化'
                }
            ]
            df = pd.DataFrame(sample_data)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Sample Data', index=False)
                worksheet = writer.sheets['Sample Data']
                for column in worksheet.columns:
                    max_length = 0
                    column_letter = column[0].column_letter
                    for cell in column:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except:
                            pass
                    adjusted_width = min(max_length + 2, 50)
                    worksheet.column_dimensions[column_letter].width = adjusted_width
            return True
        except Exception as e:
            logger.error(f"Error creating sample template: {str(e)}")
            return False
    
    @staticmethod
    def allowed_file(filename: str, allowed_extensions: set) -> bool:
        """Check if file has allowed extension"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in allowed_extensions 