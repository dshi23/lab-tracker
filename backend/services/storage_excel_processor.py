import pandas as pd
import os
from datetime import datetime
from typing import List, Dict, Any, Tuple
from werkzeug.utils import secure_filename
import logging

from models import Storage
from services.storage_service import StorageService

logger = logging.getLogger(__name__)


class StorageExcelProcessor:
    """Service class for processing storage Excel files"""
    
    # Expected column mappings for Chinese headers
    STORAGE_COLUMN_MAPPINGS = {
        '类型': ['类型', 'Type', 'type', '产品类型', 'Product Type'],
        '产品名': ['产品名', 'Product Name', 'product_name', 'name', '名称'],
        '数量及数量单位': ['数量及数量单位', 'Quantity', 'quantity', '数量', '原始数量'],
        '存放地': ['存放地', 'Storage Location', 'location', '位置', '存储位置'],
        'CAS号': ['CAS号', 'CAS Number', 'cas', 'cas_number', 'CAS']
    }
    
    @staticmethod
    def normalize_column_name(column_name: str, mappings: Dict[str, List[str]]) -> str:
        """Normalize column names to standard field names"""
        column_name = str(column_name).strip()
        
        for standard_name, variations in mappings.items():
            if column_name in variations:
                return standard_name
        
        return column_name
    
    @staticmethod
    def import_storage_excel(file_path: str) -> Dict[str, Any]:
        """Import storage data from Excel file"""
        try:
            # Read Excel file
            df = pd.read_excel(file_path, engine='openpyxl')
            
            # Normalize column names
            normalized_columns = {}
            for col in df.columns:
                normalized_name = StorageExcelProcessor.normalize_column_name(
                    col, StorageExcelProcessor.STORAGE_COLUMN_MAPPINGS
                )
                normalized_columns[col] = normalized_name
            
            df = df.rename(columns=normalized_columns)
            
            # Expected columns
            required_columns = ['类型', '产品名', '数量及数量单位', '存放地']
            optional_columns = ['CAS号']
            
            # Validate required columns
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                return {
                    'success': False,
                    'error': f"Missing required columns: {missing_columns}",
                    'success_count': 0,
                    'error_count': 0,
                    'errors': []
                }
            
            storage_items = []
            errors = []
            success_count = 0
            
            for index, row in df.iterrows():
                try:
                    # Validate and clean data
                    storage_data = {
                        '类型': str(row['类型']).strip(),
                        '产品名': str(row['产品名']).strip(),
                        '数量及数量单位': str(row['数量及数量单位']).strip(),
                        '存放地': str(row['存放地']).strip(),
                    }
                    
                    # Handle optional CAS number
                    if 'CAS号' in df.columns and pd.notna(row['CAS号']):
                        storage_data['CAS号'] = str(row['CAS号']).strip()
                    else:
                        storage_data['CAS号'] = None
                    
                    # Validate required fields are not empty
                    for field, value in storage_data.items():
                        if field != 'CAS号' and (not value or value == 'nan'):
                            raise ValueError(f"Required field '{field}' is empty")
                    
                    # Validate quantity format
                    try:
                        StorageService.parse_quantity(storage_data['数量及数量单位'])
                    except ValueError as e:
                        raise ValueError(f"Invalid quantity format: {e}")
                    
                    # Check for duplicate product names
                    existing_item = Storage.query.filter_by(
                        产品名=storage_data['产品名']
                    ).first()
                    
                    if existing_item:
                        errors.append(f"Row {index + 2}: Product '{storage_data['产品名']}' already exists")
                        continue
                    
                    # Create storage item without unit conversion
                    storage_item = StorageService.create_storage_item_with_units(storage_data)
                    storage_items.append(storage_item)
                    success_count += 1
                    
                except Exception as e:
                    errors.append(f"Row {index + 2}: {str(e)}")
            
            return {
                'success': True,
                'success_count': success_count,
                'error_count': len(errors),
                'errors': errors,
                'storage_items': [item.to_dict() for item in storage_items]
            }
            
        except Exception as e:
            logger.error(f"Error importing storage Excel: {str(e)}")
            return {
                'success': False,
                'error': f"File processing error: {str(e)}",
                'success_count': 0,
                'error_count': 0,
                'errors': []
            }
    
    @staticmethod
    def export_storage_excel(storage_items: List[Storage], file_path: str) -> str:
        """Export storage data to Excel file"""
        try:
            data = []
            for item in storage_items:
                data.append({
                    '类型': item.类型,
                    '产品名': item.产品名,
                    '数量及数量单位': item.数量及数量单位,
                    '存放地': item.存放地,
                    'CAS号': item.CAS号 or '',
                    '当前库存量(g)': round(item.当前库存量, 3),
                    '更新时间': item.更新时间.strftime('%Y-%m-%d %H:%M:%S') if item.更新时间 else ''
                })
            
            df = pd.DataFrame(data)
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            # Export to Excel
            with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Storage Inventory', index=False)
                
                # Auto-adjust column widths
                worksheet = writer.sheets['Storage Inventory']
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
            
            return file_path
            
        except Exception as e:
            logger.error(f"Error exporting storage Excel: {str(e)}")
            raise
    
    @staticmethod
    def create_storage_template(file_path: str) -> str:
        """Create a storage import template Excel file"""
        try:
            template_data = [
                {
                    '类型': '化学品',
                    '产品名': 'Anti-β-actin',
                    '数量及数量单位': '100μl',
                    '存放地': '4°C冰箱A',
                    'CAS号': '123-45-6'
                },
                {
                    '类型': '试剂',
                    '产品名': 'TBST缓冲液',
                    '数量及数量单位': '500ml',
                    '存放地': '室温试剂柜',
                    'CAS号': '789-12-3'
                },
                {
                    '类型': '化学品',
                    '产品名': 'DMSO',
                    '数量及数量单位': '100ml',
                    '存放地': '有机试剂柜',
                    'CAS号': '67-68-5'
                }
            ]
            
            df = pd.DataFrame(template_data)
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Storage Template', index=False)
                
                # Format the worksheet
                worksheet = writer.sheets['Storage Template']
                
                # Auto-adjust column widths
                for column in worksheet.columns:
                    max_length = 0
                    column_letter = column[0].column_letter
                    for cell in column:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except:
                            pass
                    adjusted_width = min(max_length + 2, 30)
                    worksheet.column_dimensions[column_letter].width = adjusted_width
                
                # Add header styling
                from openpyxl.styles import Font, PatternFill
                header_font = Font(bold=True)
                header_fill = PatternFill(start_color='DDDDDD', end_color='DDDDDD', fill_type='solid')
                
                for cell in worksheet[1]:
                    cell.font = header_font
                    cell.fill = header_fill
            
            return file_path
            
        except Exception as e:
            logger.error(f"Error creating storage template: {str(e)}")
            raise
    
    @staticmethod
    def validate_storage_file(file_path: str) -> Dict[str, Any]:
        """Validate storage Excel file before import"""
        try:
            df = pd.read_excel(file_path, engine='openpyxl')
            
            # Normalize column names
            normalized_columns = {}
            for col in df.columns:
                normalized_name = StorageExcelProcessor.normalize_column_name(
                    col, StorageExcelProcessor.STORAGE_COLUMN_MAPPINGS
                )
                normalized_columns[col] = normalized_name
            
            df = df.rename(columns=normalized_columns)
            
            required_columns = ['类型', '产品名', '数量及数量单位', '存放地']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                return {
                    'valid': False,
                    'error': f"Missing required columns: {missing_columns}",
                    'row_count': 0,
                    'preview_data': []
                }
            
            # Preview first 5 rows
            preview_data = []
            for index, row in df.head(5).iterrows():
                preview_data.append({
                    '类型': str(row.get('类型', '')),
                    '产品名': str(row.get('产品名', '')),
                    '数量及数量单位': str(row.get('数量及数量单位', '')),
                    '存放地': str(row.get('存放地', '')),
                    'CAS号': str(row.get('CAS号', '')) if pd.notna(row.get('CAS号')) else ''
                })
            
            return {
                'valid': True,
                'row_count': len(df),
                'preview_data': preview_data,
                'columns': list(df.columns)
            }
            
        except Exception as e:
            return {
                'valid': False,
                'error': f"File validation error: {str(e)}",
                'row_count': 0,
                'preview_data': []
            } 