from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
import os
import tempfile
from datetime import datetime
import logging

from models import db, UsageRecord
from services.excel_processor import ExcelProcessor
from config import Config

logger = logging.getLogger(__name__)

import_export_bp = Blueprint('import_export', __name__)

@import_export_bp.route('/api/import/preview', methods=['POST'])
def preview_import():
    """Preview import data without actually importing"""
    try:
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check file extension
        if not ExcelProcessor.allowed_file(file.filename, Config.ALLOWED_EXTENSIONS):
            return jsonify({'error': 'Invalid file type. Please upload Excel or CSV file.'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        temp_dir = tempfile.mkdtemp()
        file_path = os.path.join(temp_dir, filename)
        file.save(file_path)
        
        try:
            # Process the file for preview
            valid_records, errors = ExcelProcessor.import_excel(file_path)
            
            # Return preview data
            return jsonify({
                'valid_records': valid_records[:10],  # Limit to first 10 for preview
                'total_valid': len(valid_records),
                'errors': errors,
                'total_errors': len(errors)
            }), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(file_path):
                os.remove(file_path)
            if os.path.exists(temp_dir):
                os.rmdir(temp_dir)
        
    except Exception as e:
        logger.error(f"Error previewing file: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@import_export_bp.route('/api/import', methods=['POST'])
def import_excel():
    """Import data from Excel/CSV file"""
    try:
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check file extension
        if not ExcelProcessor.allowed_file(file.filename, Config.ALLOWED_EXTENSIONS):
            return jsonify({'error': 'Invalid file type. Please upload Excel or CSV file.'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        temp_dir = tempfile.mkdtemp()
        file_path = os.path.join(temp_dir, filename)
        file.save(file_path)
        
        try:
            # Process the file
            valid_records, errors = ExcelProcessor.import_excel(file_path)
            
            if not valid_records:
                return jsonify({
                    'error': 'No valid records found in file',
                    'details': errors
                }), 400
            
            # Import records to database
            imported_count = 0
            import_errors = []
            
            for record_data in valid_records:
                try:
                    # Create usage record with current Chinese field names
                    record = UsageRecord(
                        类型=record_data.get('类型', ''),
                        产品名=record_data.get('产品名', ''),
                        数量及数量单位=record_data.get('数量及数量单位', ''),
                        存放地=record_data.get('存放地', ''),
                        CAS号=record_data.get('CAS号'),
                        使用人=record_data.get('使用人', ''),
                        使用日期=record_data.get('使用日期'),
                        使用量=record_data.get('使用量', 0),
                        余量=record_data.get('余量', 0),
                        单位=record_data.get('单位', ''),
                        备注=record_data.get('备注', '')
                    )
                    
                    db.session.add(record)
                    imported_count += 1
                    
                except Exception as e:
                    import_errors.append(f"Error importing record: {str(e)}")
            
            # Commit all records
            db.session.commit()
            
            return jsonify({
                'message': f'Successfully imported {imported_count} records',
                'imported_count': imported_count,
                'total_records': len(valid_records),
                'errors': errors + import_errors
            }), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(file_path):
                os.remove(file_path)
            if os.path.exists(temp_dir):
                os.rmdir(temp_dir)
        
    except Exception as e:
        logger.error(f"Error importing file: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@import_export_bp.route('/api/export', methods=['GET'])
def export_excel():
    """Export lab records (usage records) to Excel file.

    NOTE: This exports UsageRecord with Chinese field names consistent with the current model.
    """
    try:
        # Get query parameters for filtering (frontend may pass English keys)
        search = request.args.get('search', '')
        personnel = request.args.get('personnel', '')
        product = request.args.get('product', '')
        start_date = request.args.get('start_date', '')
        end_date = request.args.get('end_date', '')

        # Build query on current model fields
        query = UsageRecord.query

        if search:
            from sqlalchemy import or_
            search_filter = or_(
                UsageRecord.产品名.ilike(f'%{search}%'),
                UsageRecord.使用人.ilike(f'%{search}%'),
                UsageRecord.类型.ilike(f'%{search}%'),
                UsageRecord.存放地.ilike(f'%{search}%'),
                UsageRecord.备注.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)

        if personnel:
            query = query.filter(UsageRecord.使用人.ilike(f'%{personnel}%'))

        if product:
            query = query.filter(UsageRecord.产品名.ilike(f'%{product}%'))

        if start_date:
            from utils.date_parser import DateParser
            parsed_start = DateParser.parse_date(start_date)
            if parsed_start:
                query = query.filter(UsageRecord.使用日期 >= parsed_start)

        if end_date:
            from utils.date_parser import DateParser
            parsed_end = DateParser.parse_date(end_date)
            if parsed_end:
                query = query.filter(UsageRecord.使用日期 <= parsed_end)

        # Get all records ordered by date desc
        records = query.order_by(UsageRecord.使用日期.desc()).all()

        if not records:
            return jsonify({'error': 'No records found to export'}), 404

        # Create temporary file
        temp_dir = tempfile.mkdtemp()
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'lab_records_{timestamp}.xlsx'
        file_path = os.path.join(temp_dir, filename)

        try:
            # Export to Excel using current field mapping
            success = ExcelProcessor.export_excel(records, file_path)

            if not success:
                return jsonify({'error': 'Failed to create Excel file'}), 500

            # Send file
            return send_file(
                file_path,
                as_attachment=True,
                download_name=filename,
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )

        except Exception as e:
            logger.error(f"Error exporting file: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    except Exception as e:
        logger.error(f"Error in export: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@import_export_bp.route('/api/template', methods=['GET'])
def download_template():
    """Download sample Excel template"""
    try:
        # Create temporary file
        temp_dir = tempfile.mkdtemp()
        filename = 'lab_records_template.xlsx'
        file_path = os.path.join(temp_dir, filename)
        
        try:
            # Create template
            success = ExcelProcessor.create_sample_template(file_path)
            
            if not success:
                return jsonify({'error': 'Failed to create template'}), 500
            
            # Send file
            return send_file(
                file_path,
                as_attachment=True,
                download_name=filename,
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            
        except Exception as e:
            logger.error(f"Error creating template: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500
        
    except Exception as e:
        logger.error(f"Error in template download: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@import_export_bp.route('/api/sync', methods=['POST'])
def sync_offline_data():
    """Sync offline data from mobile app"""
    try:
        data = request.get_json()
        
        if not data or 'records' not in data:
            return jsonify({'error': 'No data provided'}), 400
        
        records_data = data['records']
        synced_count = 0
        errors = []
        
        for record_data in records_data:
            try:
                # Check if record already exists (by some unique identifier)
                # For now, we'll create new records
                record = UsageRecord(
                    类型=record_data.get('类型', ''),
                    产品名=record_data.get('产品名', ''),
                    数量及数量单位=record_data.get('数量及数量单位', ''),
                    存放地=record_data.get('存放地', ''),
                    CAS号=record_data.get('CAS号'),
                    使用人=record_data.get('使用人', ''),
                    使用日期=record_data.get('使用日期'),
                    使用量=record_data.get('使用量', 0),
                    余量=record_data.get('余量', 0),
                    单位=record_data.get('单位', ''),
                    备注=record_data.get('备注', '')
                )
                
                db.session.add(record)
                synced_count += 1
                
            except Exception as e:
                errors.append(f"Error syncing record: {str(e)}")
        
        # Commit all records
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully synced {synced_count} records',
            'synced_count': synced_count,
            'errors': errors
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error syncing offline data: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500 