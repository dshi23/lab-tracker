from flask import Blueprint, request, jsonify, send_file
from sqlalchemy import or_, desc, asc
from datetime import datetime, date
import os
import logging

from models import db, Storage, UsageRecord
from services.storage_service import StorageService
from services.storage_excel_processor import StorageExcelProcessor

logger = logging.getLogger(__name__)

storage_bp = Blueprint('storage', __name__)

@storage_bp.route('/api/storage', methods=['GET'])
def get_storage_items():
    """Get paginated storage items with optional filtering"""
    try:
        from utils.query_helpers import apply_search, apply_filters, apply_sort, paginate
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        type_filter = request.args.get('type', '')
        location_filter = request.args.get('location', '')
        sort_by = request.args.get('sort_by', '产品名')
        sort_order = request.args.get('sort_order', 'asc')
        
        # Base query
        query = Storage.query
        
        # Generic helpers replace duplicate logic
        query = apply_search(query, Storage, search, ['产品名', '类型', '存放地', 'CAS号'])
        query = apply_filters(query, Storage, {
            '类型': type_filter,
            '存放地': location_filter
        })
        query = apply_sort(query, Storage, sort_by, sort_order)
        
        # Paginate
        pagination = paginate(query, page, per_page)
        
        return jsonify({
            'items': [item.to_dict() for item in pagination.items],
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting storage items: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@storage_bp.route('/api/storage', methods=['POST'])
def create_storage_item():
    """Create a new storage item with unit consistency"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['类型', '产品名', '数量及数量单位', '存放地']
        
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check for duplicate product name
        existing_item = Storage.query.filter_by(产品名=data['产品名']).first()
        if existing_item:
            return jsonify({'error': 'Product with this name already exists'}), 400
        
        # Create storage item with unit consistency
        storage_item = StorageService.create_storage_item_with_units(data)
        
        logger.info(f"Created storage item {storage_item.id}: {storage_item.产品名} ({storage_item.当前库存量} {storage_item.单位})")
        
        # Build comprehensive standardized response
        response_data = {
            'success': True,
            'message': 'Storage item created successfully',
            'timestamp': datetime.utcnow().isoformat(),
            
            # Complete storage item information
            'item': {
                **storage_item.to_dict(),
                'id': storage_item.id,
                'created': True,
                'creation_timestamp': storage_item.创建时间.isoformat() if storage_item.创建时间 else None
            },
            
            # Unit and inventory information
            'unit_info': {
                'original_unit': storage_item.单位,
                'current_quantity': storage_item.当前库存量,
                'total_quantity': storage_item.当前库存量,  # Initially same as current
                'unit_consistent': True,
                'quantity_format': storage_item.数量及数量单位
            },
            
            # Additional metadata for frontend
            'metadata': {
                'operation': 'storage_creation',
                'storage_id': storage_item.id,
                'endpoint': '/api/storage',
                'api_version': '2.0'
            }
        }
        
        return jsonify(response_data), 201
        
    except ValueError as e:
        # Build standardized validation error response
        error_response = {
            'success': False,
            'error': str(e),
            'error_type': 'validation_error',
            'timestamp': datetime.utcnow().isoformat(),
            'endpoint': '/api/storage',
            'details': {
                'message': 'Storage item validation failed',
                'possible_causes': [
                    'Missing required fields',
                    'Duplicate product name',
                    'Invalid quantity format',
                    'Invalid data types'
                ]
            }
        }
        
        return jsonify(error_response), 400
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating storage item: {str(e)}")
        
        # Build standardized server error response
        error_response = {
            'success': False,
            'error': 'Internal server error',
            'error_type': 'server_error',
            'timestamp': datetime.utcnow().isoformat(),
            'endpoint': '/api/storage',
            'details': {
                'message': 'An internal server error occurred during storage creation',
                'action_taken': 'Database transaction rolled back',
                'retry_recommended': True
            }
        }
        
        return jsonify(error_response), 500

@storage_bp.route('/api/storage/<int:storage_id>', methods=['GET'])
def get_storage_item(storage_id):
    """Get specific storage item"""
    try:
        storage_item = Storage.query.get_or_404(storage_id)
        return jsonify({'item': storage_item.to_dict()}), 200
        
    except Exception as e:
        logger.error(f"Error getting storage item: {str(e)}")
        return jsonify({'error': 'Storage item not found'}), 404

@storage_bp.route('/api/storage/<int:storage_id>', methods=['PUT'])
def update_storage_item(storage_id):
    """Update storage item with support for English field names"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Map English field names to Chinese field names for backward compatibility
        field_mapping = {
            'name': '产品名',
            'type': '类型', 
            'total_quantity': '数量及数量单位',
            'current_quantity': '当前库存量',
            'unit': '单位',
            'location': '存放地',
            'cas_number': 'CAS号'
        }
        
        # Convert English field names to Chinese if provided
        mapped_data = {}
        for english_key, chinese_key in field_mapping.items():
            if english_key in data:
                mapped_data[chinese_key] = data[english_key]
        
        # Also include any Chinese field names that were provided directly
        for key, value in data.items():
            if key in ['类型', '产品名', '数量及数量单位', '存放地', 'CAS号', '当前库存量', '单位']:
                mapped_data[key] = value
        
        # Validate the data
        validation_error = StorageService.validate_storage_data(mapped_data, is_update=True)
        if validation_error:
            return jsonify({'error': validation_error}), 400
        
        # Check if storage exists
        storage_item = Storage.query.get(storage_id)
        if not storage_item:
            return jsonify({'error': 'Storage item not found'}), 404
        
        # Update the storage item
        updated_storage = StorageService.update_storage_item(storage_id, mapped_data)
        
        return jsonify({
            'message': 'Storage item updated successfully',
            'item': updated_storage.to_dict()
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating storage item {storage_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@storage_bp.route('/api/storage/<int:storage_id>', methods=['DELETE'])
def delete_storage_item(storage_id):
    """Delete storage item with comprehensive handling of associated records"""
    try:
        logger.info(f"Attempting to delete storage item {storage_id}")
        
        # Check if storage item exists
        storage_item = Storage.query.get(storage_id)
        if not storage_item:
            logger.warning(f"Storage item {storage_id} not found")
            return jsonify({
                'success': False,
                'error': 'Storage item not found',
                'error_type': 'not_found',
                'timestamp': datetime.utcnow().isoformat(),
                'storage_id': storage_id,
                'endpoint': f'/api/storage/{storage_id}'
            }), 404
        
        logger.info(f"Found storage item: {storage_item.产品名}")
        
        # Check for cascade deletion option
        cascade = request.args.get('cascade', 'false').lower() == 'true'
        force = request.args.get('force', 'false').lower() == 'true'
        
        # Get associated usage records with detailed information
        usage_records = UsageRecord.query.filter_by(storage_id=storage_id).all()
        usage_count = len(usage_records)
        
        logger.info(f"Found {usage_count} associated usage records")
        
        if usage_count > 0:
            # Get summary of associated records
            record_summary = []
            total_usage = 0
            users = set()
            date_range = {'earliest': None, 'latest': None}
            
            for record in usage_records:
                total_usage += record.使用量_g
                users.add(record.使用人)
                
                if date_range['earliest'] is None or record.使用日期 < date_range['earliest']:
                    date_range['earliest'] = record.使用日期
                if date_range['latest'] is None or record.使用日期 > date_range['latest']:
                    date_range['latest'] = record.使用日期
                
                record_summary.append({
                    'id': record.id,
                    'user': record.使用人,
                    'date': record.使用日期.isoformat(),
                    'amount': record.使用量_g,
                    'remaining': record.余量_g
                })
            
            # Build detailed response about associated records
            associated_records_info = {
                'count': usage_count,
                'total_usage': total_usage,
                'unique_users': list(users),
                'user_count': len(users),
                'date_range': {
                    'earliest': date_range['earliest'].isoformat() if date_range['earliest'] else None,
                    'latest': date_range['latest'].isoformat() if date_range['latest'] else None
                },
                'records': record_summary[:5]  # Show first 5 records
            }
            
            # If cascade deletion is requested
            if cascade or force:
                logger.warning(f"Cascade deletion requested for storage {storage_id} with {usage_count} records")
                
                # Delete all associated usage records first
                for record in usage_records:
                    db.session.delete(record)
                
                # Delete the storage item
                db.session.delete(storage_item)
                db.session.commit()
                
                logger.info(f"Successfully deleted storage {storage_id} and {usage_count} associated records")
                
                return jsonify({
                    'success': True,
                    'message': f'Storage item and {usage_count} associated records deleted successfully',
                    'timestamp': datetime.utcnow().isoformat(),
                    'deletion_details': {
                        'storage_item': {
                            'id': storage_id,
                            'name': storage_item.产品名,
                            'deleted': True
                        },
                        'associated_records': {
                            **associated_records_info,
                            'deleted': True
                        },
                        'cascade_deletion': True
                    },
                    'metadata': {
                        'operation': 'cascade_deletion',
                        'storage_id': storage_id,
                        'records_deleted': usage_count,
                        'endpoint': f'/api/storage/{storage_id}',
                        'api_version': '2.0'
                    }
                }), 200
            
            else:
                # Cannot delete - return detailed information about associated records
                logger.info(f"Cannot delete storage {storage_id} - {usage_count} associated records exist")
                
                return jsonify({
                    'success': False,
                    'error': 'Cannot delete storage item with associated usage records',
                    'error_type': 'has_dependencies',
                    'timestamp': datetime.utcnow().isoformat(),
                    'storage_id': storage_id,
                    'endpoint': f'/api/storage/{storage_id}',
                    'details': {
                        'message': f'Storage item has {usage_count} associated usage records',
                        'associated_records': associated_records_info,
                        'deletion_options': [
                            {
                                'option': 'cascade_deletion',
                                'description': 'Delete storage item and all associated records',
                                'url': f'/api/storage/{storage_id}?cascade=true',
                                'warning': 'This action cannot be undone'
                            },
                            {
                                'option': 'manual_cleanup',
                                'description': 'Delete individual usage records first, then delete storage item',
                                'steps': [
                                    'Review and delete usage records individually',
                                    'Retry storage deletion after all records are removed'
                                ]
                            }
                        ]
                    },
                    'suggestions': [
                        'Review associated usage records before deletion',
                        'Use cascade=true parameter for complete deletion',
                        'Consider archiving instead of deleting',
                        'Export data before deletion for backup'
                    ]
                }), 400
        
        else:
            # No associated records - safe to delete
            logger.info(f"No associated records found - proceeding with deletion")
            
            db.session.delete(storage_item)
            db.session.commit()
            
            logger.info(f"Successfully deleted storage item {storage_id}")
            
            return jsonify({
                'success': True,
                'message': 'Storage item deleted successfully',
                'timestamp': datetime.utcnow().isoformat(),
                'deletion_details': {
                    'storage_item': {
                        'id': storage_id,
                        'name': storage_item.产品名,
                        'deleted': True
                    },
                    'associated_records': {
                        'count': 0,
                        'deleted': 0
                    },
                    'cascade_deletion': False
                },
                'metadata': {
                    'operation': 'simple_deletion',
                    'storage_id': storage_id,
                    'endpoint': f'/api/storage/{storage_id}',
                    'api_version': '2.0'
                }
            }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Unexpected error deleting storage item {storage_id}: {str(e)}", exc_info=True)
        
        return jsonify({
            'success': False,
            'error': 'Failed to delete storage item',
            'error_type': 'server_error',
            'timestamp': datetime.utcnow().isoformat(),
            'storage_id': storage_id,
            'endpoint': f'/api/storage/{storage_id}',
            'details': {
                'message': 'An internal server error occurred during deletion',
                'action_taken': 'Database transaction rolled back',
                'retry_recommended': True
            },
            'suggestions': [
                'Try the request again',
                'Check if storage item exists',
                'Contact support if issue persists'
            ]
        }), 500

@storage_bp.route('/api/storage/low-stock', methods=['GET'])
def get_low_stock_items():
    """Get items with low stock"""
    try:
        threshold = request.args.get('threshold', 10.0, type=float)
        low_stock_items = StorageService.get_low_stock_items(threshold)
        
        return jsonify({
            'items': [item.to_dict() for item in low_stock_items],
            'count': len(low_stock_items)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting low stock items: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@storage_bp.route('/api/storage/by-type/<string:storage_type>', methods=['GET'])
def get_storage_by_type(storage_type):
    """Get storage items by type"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = Storage.query.filter(Storage.类型.ilike(f'%{storage_type}%'))
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'items': [item.to_dict() for item in pagination.items],
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting storage by type: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@storage_bp.route('/api/storage/by-location/<string:location>', methods=['GET'])
def get_storage_by_location(location):
    """Get items by storage location"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = Storage.query.filter(Storage.存放地.ilike(f'%{location}%'))
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'items': [item.to_dict() for item in pagination.items],
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting storage by location: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@storage_bp.route('/api/storage/import', methods=['POST'])
def import_storage_excel():
    """Import storage Excel file"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check file extension
        allowed_extensions = {'xlsx', 'xls'}
        if not ('.' in file.filename and 
                file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({'error': 'Invalid file format. Only Excel files allowed.'}), 400
        
        # Save uploaded file temporarily
        filename = f"storage_import_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        file_path = os.path.join('uploads', filename)
        
        os.makedirs('uploads', exist_ok=True)
        file.save(file_path)
        
        try:
            # Import data
            result = StorageExcelProcessor.import_storage_excel(file_path)
            
            return jsonify(result), 200 if result['success'] else 400
            
        finally:
            # Clean up temporary file
            if os.path.exists(file_path):
                os.remove(file_path)
        
    except Exception as e:
        logger.error(f"Error importing storage Excel: {str(e)}")
        return jsonify({'error': 'Import failed'}), 500

@storage_bp.route('/api/storage/export', methods=['GET'])
def export_storage_excel():
    """Export storage data to Excel"""
    try:
        # Get query parameters for filtering
        type_filter = request.args.get('type', '')
        location_filter = request.args.get('location', '')
        
        # Build query
        query = Storage.query
        
        if type_filter:
            query = query.filter(Storage.类型.ilike(f'%{type_filter}%'))
        
        if location_filter:
            query = query.filter(Storage.存放地.ilike(f'%{location_filter}%'))
        
        storage_items = query.all()
        
        # Create export file
        filename = f"storage_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        file_path = os.path.join('uploads', filename)
        
        os.makedirs('uploads', exist_ok=True)
        StorageExcelProcessor.export_storage_excel(storage_items, file_path)
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        logger.error(f"Error exporting storage Excel: {str(e)}")
        return jsonify({'error': 'Export failed'}), 500

@storage_bp.route('/api/storage/template', methods=['GET'])
def download_storage_template():
    """Download storage import template"""
    try:
        filename = f"storage_template.xlsx"
        file_path = os.path.join('uploads', filename)
        
        os.makedirs('uploads', exist_ok=True)
        StorageExcelProcessor.create_storage_template(file_path)
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        logger.error(f"Error creating storage template: {str(e)}")
        return jsonify({'error': 'Template creation failed'}), 500

@storage_bp.route('/api/storage/available', methods=['GET'])
def search_available_storage():
    """Quick search available storage items (current_quantity > 0) with optional query and limit"""
    try:
        q = request.args.get('q', '', type=str)
        limit = request.args.get('limit', 10, type=int)
        include_low_stock = request.args.get('include_low', 'true').lower() == 'true'

        # Base query: items with current stock > 0
        query = Storage.query.filter(Storage.当前库存量 > 0)

        # Optional fuzzy / ilike search across name, location and unit
        if q:
            wildcard = f"%{q}%"
            query = query.filter(
                or_(
                    Storage.产品名.ilike(wildcard),
                    Storage.存放地.ilike(wildcard),
                    Storage.单位.ilike(wildcard)
                )
            )

        # Limit results for quick selector
        items = query.order_by(Storage.产品名.asc()).limit(limit).all()

        def compute_availability(item):
            """Return availability_status based on percentage remaining"""
            try:
                total_qty, unit = StorageService.parse_quantity(item.数量及数量单位)
                # Convert to grams if necessary for comparison with 当前库存量 (stored in grams)
                total_qty_in_grams = StorageService.convert_to_grams(total_qty, unit)
                if total_qty_in_grams == 0:
                    return 'unknown'
                ratio = item.当前库存量 / total_qty_in_grams
            except Exception:
                # Fallback if parsing fails
                ratio = None

            if ratio is None:
                return 'available' if item.当前库存量 > 0 else 'out_of_stock'
            if ratio == 0:
                return 'out_of_stock'
            elif ratio < 0.2:
                return 'low_stock'
            else:
                return 'available'

        results = []
        for item in items:
            availability_status = compute_availability(item)
            # Optionally exclude low stock items if not requested
            if not include_low_stock and availability_status != 'available':
                continue
            results.append({
                'availability_status': availability_status,
                'match_score': 1.0,
                **item.to_dict()
            })

        return jsonify({'results': results, 'total_count': len(results)})
    except Exception as e:
        logger.error(f"Error searching available storage: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@storage_bp.route('/api/storage/bulk-update', methods=['POST'])
def bulk_update_storage():
    """Bulk update storage quantities"""
    try:
        data = request.get_json()
        
        if not data or 'updates' not in data:
            return jsonify({'error': 'No update data provided'}), 400
        
        result = StorageService.bulk_update_stock(data['updates'])
        
        return jsonify(result), 200 if result['success'] else 400
        
    except Exception as e:
        logger.error(f"Error bulk updating storage: {str(e)}")
        return jsonify({'error': 'Bulk update failed'}), 500 

@storage_bp.route('/api/storage/<int:storage_id>/use', methods=['POST'])
def use_storage_item(storage_id):
    """Create usage record for specific storage item with unit consistency"""
    try:
        logger.info(f"Creating usage record for storage item {storage_id}")
        
        data = request.get_json()
        if not data:
            logger.error(f"No data provided for storage {storage_id} usage")
            return jsonify({'error': 'No data provided'}), 400
        
        # Get storage item to ensure unit consistency
        storage_item = Storage.query.get(storage_id)
        if not storage_item:
            logger.warning(f"Storage item {storage_id} not found")
            return jsonify({'error': 'Storage item not found'}), 404
        
        logger.info(f"Found storage item: {storage_item.产品名}, unit: {storage_item.单位}, current quantity: {storage_item.当前库存量}")
        
        # Validate required fields
        personnel = data.get('使用人') or data.get('personnel')
        usage_date = data.get('使用日期') or data.get('usage_date') or data.get('date')
        usage_amount = data.get('使用量') or data.get('usage_amount') or data.get('amount')
        
        if not personnel:
            return jsonify({'error': 'Personnel field is required (使用人 or personnel)'}), 400
        if not usage_date:
            return jsonify({'error': 'Date field is required (使用日期, usage_date, or date)'}), 400
        if not usage_amount:
            return jsonify({'error': 'Usage amount field is required (使用量, usage_amount, or amount)'}), 400
        
        # Parse date
        from utils.date_parser import DateParser
        if isinstance(usage_date, str):
            parsed_date = DateParser.parse_date(usage_date)
            if not parsed_date:
                return jsonify({'error': 'Invalid date format'}), 400
        else:
            parsed_date = usage_date
        
        # Handle usage amount - use storage item's unit
        try:
            usage_amount_value = float(usage_amount)
            if usage_amount_value <= 0:
                return jsonify({'error': 'Usage amount must be greater than 0'}), 400
            
            # Use the storage item's unit for consistency
            storage_unit = storage_item.单位
            logger.info(f"Using storage unit: {storage_unit} for usage amount: {usage_amount_value}")
            
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid usage amount format'}), 400
        
        # Prepare data for storage service (using storage's unit)
        usage_data = {
            '使用人': personnel,
            '使用日期': parsed_date,
            '使用量': usage_amount_value,  # Keep in storage's unit
            '单位': storage_unit,  # Use storage's unit
            '备注': data.get('备注') or data.get('notes', '')
        }
        
        # Create usage record with unit consistency
        usage_record, updated_storage = StorageService.record_usage_with_units(storage_id, usage_data)
        
        logger.info(f"Successfully created usage record {usage_record.id}, updated storage quantity: {updated_storage.当前库存量}")
        
        # Build comprehensive standardized response for frontend
        response_data = {
            'success': True,
            'message': 'Usage record created successfully',
            'timestamp': datetime.utcnow().isoformat(),
            
            # Complete record information
            'record': {
                **usage_record.to_dict(),
                'id': usage_record.id,
                'created': True,
                'creation_timestamp': usage_record.创建时间.isoformat() if usage_record.创建时间 else None
            },
            
            # Updated storage/inventory information
            'storage_item': {
                **updated_storage.to_dict(),
                'inventory_updated': True,
                'previous_quantity': updated_storage.当前库存量 + usage_amount_value,
                'quantity_change': -usage_amount_value,
                'last_updated': updated_storage.更新时间.isoformat() if updated_storage.更新时间 else None
            },
            
            # Unit consistency and calculation details
            'unit_info': {
                'storage_unit': storage_unit,
                'usage_amount': usage_amount_value,
                'usage_unit': storage_unit,
                'remaining_quantity': updated_storage.当前库存量,
                'unit_consistent': True,
                'calculation': f"{updated_storage.当前库存量 + usage_amount_value} - {usage_amount_value} = {updated_storage.当前库存量} {storage_unit}"
            },
            
            # Additional metadata for frontend
            'metadata': {
                'operation': 'usage_record_creation',
                'storage_id': storage_id,
                'record_id': usage_record.id,
                'endpoint': f'/api/storage/{storage_id}/use',
                'api_version': '2.0'
            }
        }
        
        return jsonify(response_data), 201
        
    except ValueError as e:
        logger.error(f"Validation error for storage {storage_id} usage: {str(e)}")
        
        # Build standardized error response
        error_response = {
            'success': False,
            'error': str(e),
            'error_type': 'validation_error',
            'timestamp': datetime.utcnow().isoformat(),
            'storage_id': storage_id,
            'endpoint': f'/api/storage/{storage_id}/use',
            'details': {
                'message': 'Request validation failed',
                'possible_causes': [
                    'Insufficient stock available',
                    'Invalid usage amount',
                    'Invalid date format',
                    'Missing required fields'
                ]
            }
        }
        
        return jsonify(error_response), 400
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating usage record for storage {storage_id}: {str(e)}", exc_info=True)
        
        # Build standardized server error response
        error_response = {
            'success': False,
            'error': 'Failed to create usage record',
            'error_type': 'server_error',
            'timestamp': datetime.utcnow().isoformat(),
            'storage_id': storage_id,
            'endpoint': f'/api/storage/{storage_id}/use',
            'details': {
                'message': 'An internal server error occurred during record creation',
                'action_taken': 'Database transaction rolled back',
                'retry_recommended': True
            }
        }
        
        return jsonify(error_response), 500 

@storage_bp.route('/api/storage/<int:storage_id>/deletion-info', methods=['GET'])
def get_storage_deletion_info(storage_id):
    """Get detailed information about storage deletion impact and dependencies"""
    try:
        logger.info(f"Getting deletion info for storage item {storage_id}")
        
        # Get deletion information from service
        deletion_info = StorageService.get_storage_deletion_info(storage_id)
        
        return jsonify({
            'success': True,
            'message': 'Storage deletion information retrieved successfully',
            'timestamp': datetime.utcnow().isoformat(),
            'storage_id': storage_id,
            **deletion_info,
            'metadata': {
                'operation': 'deletion_info',
                'storage_id': storage_id,
                'endpoint': f'/api/storage/{storage_id}/deletion-info',
                'api_version': '2.0'
            }
        }), 200
        
    except ValueError as e:
        logger.error(f"Storage {storage_id} not found for deletion info: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'error_type': 'not_found',
            'timestamp': datetime.utcnow().isoformat(),
            'storage_id': storage_id,
            'endpoint': f'/api/storage/{storage_id}/deletion-info'
        }), 404
        
    except Exception as e:
        logger.error(f"Error getting deletion info for storage {storage_id}: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve deletion information',
            'error_type': 'server_error',
            'timestamp': datetime.utcnow().isoformat(),
            'storage_id': storage_id,
            'endpoint': f'/api/storage/{storage_id}/deletion-info',
            'details': {
                'message': 'An internal server error occurred',
                'retry_recommended': True
            }
        }), 500 