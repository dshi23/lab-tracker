import pandas as pd
import os
from datetime import datetime, date
from typing import List, Dict, Any, Optional, Tuple
from werkzeug.utils import secure_filename
import logging

from utils.date_parser import DateParser
from utils.volume_converter import VolumeConverter
from models import UsageRecord, Personnel

logger = logging.getLogger(__name__)

class ExcelProcessor:
    """Service class for processing Excel files with storage-integrated usage records"""
    
    # Expected column mappings for new storage-integrated format
    COLUMN_MAPPINGS = {
        'type': ['类型', 'Type'],
        'product_name': ['产品名', 'Product Name', 'product_name', 'chemical_name', 'chemical'],
        'cas_number': ['CAS号', 'CAS Number', 'cas_number', 'cas'],
        'location': ['存放地', 'Location', 'location', 'place'],
        'usage_date': ['使用日期', 'Usage Date', 'usage_date', 'date'],
        'personnel': ['使用人', 'Personnel', 'personnel', 'user'],
        'usage_amount_g': ['使用量_g', 'Usage Amount (g)', 'usage_amount_g', 'used_g', '使用量'],
        'remaining_g': ['余量_g', 'Remaining (g)', 'remaining_g', 'left_g', '余量'],
        'notes': ['备注', 'Notes', 'notes', 'comment'],
    }

    @staticmethod
    def normalize_column_names(df: pd.DataFrame) -> pd.DataFrame:
        column_mapping = {}
        for col in df.columns:
            col_lower = str(col).strip().lower()
            for standard_name, variations in ExcelProcessor.COLUMN_MAPPINGS.items():
                if any(var.lower() in col_lower for var in variations):
                    column_mapping[col] = standard_name
                    break
        df = df.rename(columns=column_mapping)
        return df

    @staticmethod
    def clean_data(df: pd.DataFrame) -> pd.DataFrame:
        df = df.dropna(how='all')
        string_columns = ['type', 'product_name', 'cas_number', 'location', 'personnel', 'notes']
        for col in string_columns:
            if col in df.columns:
                df[col] = df[col].fillna('')
        # Parse usage_date
        if 'usage_date' in df.columns:
            df['usage_date'] = df['usage_date'].apply(
                lambda x: DateParser.parse_date(str(x)) if pd.notna(x) else None
            )
        # Fill numeric columns
        for col in ['usage_amount_g', 'remaining_g']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        return df

    @staticmethod
    def validate_record(record: Dict[str, Any]) -> Tuple[bool, List[str]]:
        errors = []
        required_fields = ['type', 'product_name', 'cas_number', 'location', 'usage_date', 'personnel', 'usage_amount_g']
        for field in required_fields:
            if not record.get(field):
                errors.append(f"Missing required field: {field}")
        if record.get('usage_date') and not isinstance(record['usage_date'], date):
            errors.append("Invalid date format for usage_date")
        if 'usage_amount_g' in record and (not isinstance(record['usage_amount_g'], (int, float)) or record['usage_amount_g'] < 0):
            errors.append("Invalid usage_amount_g value")
        if 'remaining_g' in record and (not isinstance(record['remaining_g'], (int, float)) or record['remaining_g'] < 0):
            errors.append("Invalid remaining_g value")
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
                data.append({
                    '类型': getattr(record, 'type', ''),
                    '产品名': getattr(record, 'product_name', ''),
                    'CAS号': getattr(record, 'cas_number', ''),
                    '存放地': getattr(record, 'location', ''),
                    '使用日期': DateParser.format_date_for_display(getattr(record, 'usage_date', None)),
                    '使用人': getattr(record, 'personnel', ''),
                    '使用量_g': getattr(record, 'usage_amount_g', 0),
                    '余量_g': getattr(record, 'remaining_g', 0),
                    '备注': getattr(record, 'notes', '')
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
                        except:
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
                    'CAS号': '7647-01-0',
                    '存放地': '化学品柜A',
                    '使用日期': '2025-01-15',
                    '使用人': '张三',
                    '使用量_g': 5,
                    '余量_g': 95,
                    '备注': '滴定实验'
                },
                {
                    '类型': '酶',
                    '产品名': '胰蛋白酶',
                    'CAS号': '9002-07-7',
                    '存放地': '冷藏柜B',
                    '使用日期': '2025-01-16',
                    '使用人': '李四',
                    '使用量_g': 2,
                    '余量_g': 48,
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