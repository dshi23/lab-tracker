from flask import Blueprint, request, jsonify
from sqlalchemy import or_, asc, desc
from datetime import datetime, date
import logging

from models import db, UsageRecord, Storage
from services.storage_service import StorageService
from utils.date_parser import DateParser

logger = logging.getLogger(__name__)

records_bp = Blueprint('records', __name__)

def get_record_with_storage(record_id: int):
    """Helper function to get record with storage information using efficient joins"""
    try:
        # Use join query for better performance
        result = db.session.query(UsageRecord, Storage).join(
            Storage, UsageRecord.storage_id == Storage.id, isouter=True
        ).filter(
            UsageRecord.id == record_id,
            UsageRecord.storage_id.isnot(None)
        ).first()
        
        if not result:
            return None, None
        
        record, storage_item = result
        return record, storage_item
        
    except Exception as e:
        logger.error(f"Error in join query for record {record_id}: {str(e)}")
        return None, None

@records_bp.route('/api/records', methods=['GET'])
def get_records():
    """Get paginated storage-integrated records with optional filtering"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        personnel = request.args.get('personnel', '')
        product = request.args.get('product', '')
        start_date = request.args.get('start_date', '')
        end_date = request.args.get('end_date', '')
        sort_by = request.args.get('sort_by', '使用日期')
        sort_order = request.args.get('sort_order', 'desc')
        
        from utils.query_helpers import apply_search, apply_filters, apply_sort, paginate
        # Build base query - only storage-integrated records
        query = UsageRecord.query.filter(UsageRecord.storage_id.isnot(None))

        # Generic helpers for search + simple filters
        query = apply_search(query, UsageRecord, search, ['产品名', '使用人', '类型', '存放地', '备注'])
        query = apply_filters(query, UsageRecord, {
            '使用人': personnel,
            '产品名': product
        })
        
        # Date filters
        if start_date:
            parsed_start = DateParser.parse_date(start_date)
            if parsed_start:
                query = query.filter(UsageRecord.使用日期 >= parsed_start)
        
        if end_date:
            parsed_end = DateParser.parse_date(end_date)
            if parsed_end:
                query = query.filter(UsageRecord.使用日期 <= parsed_end)
        
        # Apply sorting via helper (fallback column inside helper is ignored if column missing)
        query = apply_sort(query, UsageRecord, sort_by, sort_order)

        # Pagination via helper
        try:
            paginated = paginate(query, page, per_page)
            
            # Get unique values for filter dropdowns
            personnel_list = db.session.query(UsageRecord.使用人).filter(
                UsageRecord.使用人.isnot(None),
                UsageRecord.使用人 != ''
            ).distinct().all()
            personnel_list = [p[0] for p in personnel_list if p[0]]
            
            products_list = db.session.query(UsageRecord.产品名).filter(
                UsageRecord.产品名.isnot(None),
                UsageRecord.产品名 != ''
            ).distinct().all()
            products_list = [p[0] for p in products_list if p[0]]
            
            return jsonify({
                'records': [record.to_dict() for record in paginated.items],
                'pagination': {
                    'page': paginated.page,
                    'pages': paginated.pages,
                    'per_page': paginated.per_page,
                    'total': paginated.total,
                    'has_next': paginated.has_next,
                    'has_prev': paginated.has_prev
                },
                'filters': {
                    'personnel': sorted(personnel_list),
                    'products': sorted(products_list)
                }
            }), 200
            
        except Exception as e:
            logger.error(f"Error in pagination: {str(e)}")
            return jsonify({'error': 'Pagination error'}), 400
        
    except Exception as e:
        logger.error(f"Error getting records: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@records_bp.route('/api/records', methods=['POST'])
def create_record():
    """DEPRECATED: Use POST /api/storage/<storage_id>/use instead for unit consistency"""
    try:
        logger.warning("Deprecated endpoint /api/records called. Use /api/storage/<storage_id>/use instead")
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided',
                'error_type': 'validation_error',
                'timestamp': datetime.utcnow().isoformat(),
                'endpoint': '/api/records',
                'deprecated': True,
                'recommended_endpoint': '/api/storage/<storage_id>/use'
            }), 400
        
        storage_item_id = data.get('storage_item_id') or data.get('storage_id')
        
        if not storage_item_id:
            return jsonify({
                'success': False,
                'error': 'This endpoint is deprecated. Use POST /api/storage/<storage_id>/use instead.',
                'error_type': 'deprecated_endpoint',
                'timestamp': datetime.utcnow().isoformat(),
                'endpoint': '/api/records',
                'deprecated': True,
                'recommended_endpoint': '/api/storage/<storage_id>/use',
                'migration_info': {
                    'reason': 'The new endpoint ensures unit consistency with storage items',
                    'benefits': [
                        'Automatic unit conversion',
                        'Storage item validation',
                        'Inventory tracking',
                        'Better error handling'
                    ]
                },
                'example_request': {
                    'url': f'/api/storage/{storage_item_id}/use',
                    'method': 'POST',
                    'body': {
                        '使用人': data.get('使用人') or data.get('personnel'),
                        '使用日期': data.get('使用日期') or data.get('config_date'),
                        '使用量': data.get('使用量_g') or data.get('volume_used'),
                        '单位': data.get('单位') or 'g',
                        '备注': data.get('备注') or data.get('notes')
                    }
                }
            }), 410  # 410 Gone - indicates deprecated
        
        # Attempt to proxy the request to the new unified endpoint
        try:
            logger.info(f"Proxying deprecated /api/records request to /api/storage/{storage_item_id}/use")
            
            # Prepare data for the new endpoint
            proxy_data = {
                '使用人': data.get('使用人') or data.get('personnel'),
                '使用日期': data.get('使用日期') or data.get('config_date'),
                '使用量': data.get('使用量_g') or data.get('volume_used'),
                '单位': data.get('单位') or 'g',
                '备注': data.get('备注') or data.get('notes')
            }
            
            # Call the storage service directly
            usage_record, storage_item = StorageService.record_usage_with_units(storage_item_id, proxy_data)
            
            logger.info(f"Successfully proxied deprecated endpoint request to new unified endpoint")
            
            # Return success response with deprecation warning
            return jsonify({
                'success': True,
                'message': 'Record created successfully (via deprecated endpoint)',
                'timestamp': datetime.utcnow().isoformat(),
                'deprecated': True,
                'deprecation_warning': {
                    'message': 'This endpoint is deprecated and will be removed in a future version',
                    'recommended_endpoint': f'/api/storage/{storage_item_id}/use',
                    'migration_guide': 'Update your client code to use the new unified endpoint'
                },
                'record': usage_record.to_dict(),
                'storage_item': storage_item.to_dict(),
                'unit_info': {
                    'storage_unit': storage_item.单位,
                    'usage_amount': usage_record.使用量,
                    'remaining_quantity': storage_item.当前库存量,
                    'calculation': f"{storage_item.当前库存量 + usage_record.使用量} - {usage_record.使用量} = {storage_item.当前库存量}"
                },
                'metadata': {
                    'operation': 'record_creation_proxy',
                    'storage_id': storage_item_id,
                    'record_id': usage_record.id,
                    'endpoint': '/api/records',
                    'api_version': '2.0'
                }
            }), 201
            
        except Exception as proxy_error:
            logger.error(f"Failed to proxy request to new endpoint: {str(proxy_error)}")
            
            # Return deprecation error with detailed migration info
            return jsonify({
                'success': False,
                'error': 'This endpoint is deprecated and the proxy request failed.',
                'error_type': 'deprecated_endpoint',
                'timestamp': datetime.utcnow().isoformat(),
                'endpoint': '/api/records',
                'deprecated': True,
                'recommended_endpoint': f'/api/storage/{storage_item_id}/use',
                'proxy_error': str(proxy_error),
                'migration_info': {
                    'reason': 'The new endpoint ensures unit consistency with storage items',
                    'benefits': [
                        'Automatic unit conversion',
                        'Storage item validation',
                        'Inventory tracking',
                        'Better error handling'
                    ]
                },
                'example_request': {
                    'url': f'/api/storage/{storage_item_id}/use',
                    'method': 'POST',
                    'body': {
                        '使用人': data.get('使用人') or data.get('personnel'),
                        '使用日期': data.get('使用日期') or data.get('config_date'),
                        '使用量': data.get('使用量_g') or data.get('volume_used'),
                        '单位': data.get('单位') or 'g',
                        '备注': data.get('备注') or data.get('notes')
                    }
                }
            }), 410
        
    except Exception as e:
        logger.error(f"Error in deprecated create_record endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'This endpoint is deprecated. Use POST /api/storage/<storage_id>/use instead.',
            'error_type': 'deprecated_endpoint',
            'timestamp': datetime.utcnow().isoformat(),
            'endpoint': '/api/records',
            'deprecated': True,
            'recommended_endpoint': '/api/storage/<storage_id>/use',
            'details': {
                'message': 'An error occurred while processing the deprecated endpoint',
                'original_error': str(e)
            }
        }), 410

@records_bp.route('/api/records/<int:record_id>', methods=['GET'])
def get_record(record_id):
    """Get a specific storage-integrated record by ID with associated storage information"""
    try:
        logger.info(f"Attempting to get record {record_id}")
        
        # Use efficient join query
        record, storage_item = get_record_with_storage(record_id)
        
        if not record:
            logger.warning(f"Record {record_id} not found or not storage-integrated")
            # Try to check if record exists but without storage integration
            non_integrated_record = UsageRecord.query.filter(UsageRecord.id == record_id).first()
            if non_integrated_record:
                logger.info(f"Record {record_id} exists but is not storage-integrated (storage_id: {non_integrated_record.storage_id})")
                return jsonify({
                    'error': 'Record exists but is not linked to a storage item',
                    'record_id': record_id,
                    'is_storage_integrated': False
                }), 400
            else:
                logger.info(f"Record {record_id} does not exist in database")
                return jsonify({
                    'error': 'Record not found',
                    'record_id': record_id,
                    'exists': False
                }), 404
        
        logger.info(f"Found record {record_id}: {record.产品名}, storage_id: {record.storage_id}")
        
        if storage_item:
            logger.info(f"Associated storage found: ID {storage_item.id}, current quantity: {storage_item.当前库存量}g")
        else:
            logger.warning(f"Storage item {record.storage_id} referenced by record {record_id} not found")
        
        # Build comprehensive response
        response_data = {
            'record': record.to_dict(),
            'storage_item': storage_item.to_dict() if storage_item else None,
            'has_storage_info': storage_item is not None
        }
        
        # Add computed fields for convenience
        if storage_item:
            response_data['computed_info'] = {
                'inventory_impact': {
                    'usage_amount': record.使用量,
                    'remaining_after_usage': record.余量,
                    'current_storage_quantity': storage_item.当前库存量,
                    'unit': storage_item.单位
                },
                'data_consistency': {
                    'product_name_match': record.产品名 == storage_item.产品名,
                    'type_match': record.类型 == storage_item.类型,
                    'location_match': record.存放地 == storage_item.存放地,
                    'cas_match': record.CAS号 == storage_item.CAS号
                }
            }
        
        logger.info(f"Successfully retrieved record {record_id} with complete information")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Unexpected error getting record {record_id}: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Internal server error occurred while retrieving record',
            'record_id': record_id,
            'details': 'An unexpected error occurred during record retrieval'
        }), 500

@records_bp.route('/api/records/<int:record_id>', methods=['PUT'])
def update_record(record_id):
    """Update a specific storage-integrated record"""
    try:
        logger.info(f"Attempting to update record {record_id}")
        
        # Check if record exists using correct SQLAlchemy syntax
        record = UsageRecord.query.filter(
            UsageRecord.id == record_id,
            UsageRecord.storage_id.isnot(None)
        ).first()
        
        if not record:
            logger.warning(f"Record {record_id} not found or not storage-integrated for update")
            return jsonify({
                'error': 'Record not found or not storage-integrated',
                'record_id': record_id
            }), 404
        
        data = request.get_json()
        if not data:
            logger.error(f"No data provided for updating record {record_id}")
            return jsonify({'error': 'No data provided'}), 400
        
        logger.info(f"Updating record {record_id} with data: {list(data.keys())}")
        
        # Use storage service to handle updates
        usage_record, storage_item = StorageService.update_usage_record(record_id, data)
        
        logger.info(f"Successfully updated record {record_id}, new usage: {usage_record.使用量}{storage_item.单位}, storage quantity: {storage_item.当前库存量}{storage_item.单位}")
        
        return jsonify({
            'message': 'Record updated successfully',
            'record': usage_record.to_dict(),
            'storage_item': storage_item.to_dict()
        }), 200
        
    except ValueError as e:
        logger.error(f"Validation error updating record {record_id}: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Unexpected error updating record {record_id}: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Internal server error occurred while updating record',
            'record_id': record_id
        }), 500

@records_bp.route('/api/records/<int:record_id>', methods=['DELETE'])
def delete_record(record_id):
    """Delete a specific storage-integrated record with atomic operation"""
    try:
        logger.info(f"Attempting to delete record {record_id}")
        
        # Check if record exists and is storage-integrated (fixed SQLAlchemy syntax)
        record = UsageRecord.query.filter(
            UsageRecord.id == record_id,
            UsageRecord.storage_id.isnot(None)
        ).first()
        
        if not record:
            logger.warning(f"Record {record_id} not found or not storage-integrated")
            return jsonify({'error': 'Record not found or not storage-integrated'}), 404
        
        # Validate that storage item still exists
        if not record.storage_id:
            logger.error(f"Record {record_id} has null storage_id")
            return jsonify({'error': 'Record is not linked to a storage item'}), 400
        
        logger.info(f"Deleting record {record_id} for storage item {record.storage_id}, restoring {record.使用量}{storage_item.单位 if (storage_item:=Storage.query.get(record.storage_id)) else ''}")
        
        # Use storage service to restore inventory and delete record atomically
        storage_item = StorageService.delete_usage_record(record_id)
        
        logger.info(f"Successfully deleted record {record_id}, inventory restored to {storage_item.当前库存量}g")
        
        return jsonify({
            'message': 'Record deleted and inventory restored successfully',
            'record_id': record_id,
            'storage_item': storage_item.to_dict(),
            'inventory_status': {
                'storage_id': storage_item.id,
                'product_name': storage_item.产品名,
                'current_quantity': storage_item.当前库存量,
                'unit': storage_item.单位,
                'updated_at': storage_item.更新时间.isoformat() if storage_item.更新时间 else None
            }
        }), 200
        
    except ValueError as e:
        # Handle validation errors
        logger.error(f"Validation error deleting record {record_id}: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        # Ensure database rollback on any error
        db.session.rollback()
        logger.error(f"Unexpected error deleting record {record_id}: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to delete record. Database has been rolled back.',
            'details': 'An internal server error occurred during record deletion.'
        }), 500

@records_bp.route('/api/records/recent', methods=['GET'])
def get_recent_records():
    """Get recent storage-integrated usage records"""
    try:
        limit = request.args.get('limit', 10, type=int)
        
        records = UsageRecord.query.filter(
            UsageRecord.storage_id.isnot(None)
        ).order_by(
            desc(UsageRecord.使用日期)
        ).limit(limit).all()
        
        return jsonify({
            'records': [record.to_dict() for record in records]
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting recent records: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@records_bp.route('/api/records/search', methods=['GET'])
def search_records():
    """Search storage-integrated records"""
    try:
        query_text = request.args.get('q', '').strip()
        limit = request.args.get('limit', 10, type=int)
        
        if not query_text:
            return jsonify({'records': []}), 200
        
        # Search across Chinese fields
        search_filter = or_(
            UsageRecord.产品名.ilike(f'%{query_text}%'),
            UsageRecord.使用人.ilike(f'%{query_text}%'),
            UsageRecord.类型.ilike(f'%{query_text}%'),
            UsageRecord.存放地.ilike(f'%{query_text}%'),
            UsageRecord.备注.ilike(f'%{query_text}%')
        )
        
        records = UsageRecord.query.filter(
            UsageRecord.storage_id.isnot(None),
            search_filter
        ).order_by(
            desc(UsageRecord.使用日期)
        ).limit(limit).all()
        
        return jsonify({
            'records': [record.to_dict() for record in records]
        }), 200
        
    except Exception as e:
        logger.error(f"Error searching records: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@records_bp.route('/api/records/by-personnel/<personnel_name>', methods=['GET'])
def get_records_by_personnel(personnel_name):
    """Get records by personnel name"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = UsageRecord.query.filter(
            UsageRecord.storage_id.isnot(None),
            UsageRecord.使用人.ilike(f'%{personnel_name}%')
        ).order_by(desc(UsageRecord.使用日期))
        
        paginated = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'records': [record.to_dict() for record in paginated.items],
            'pagination': {
                'page': paginated.page,
                'pages': paginated.pages,
                'per_page': paginated.per_page,
                'total': paginated.total,
                'has_next': paginated.has_next,
                'has_prev': paginated.has_prev
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting records by personnel: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Remove the usage-records endpoint as it's now redundant
# All records are storage-integrated 