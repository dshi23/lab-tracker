import re
from datetime import datetime
from typing import Dict, Any, Tuple, Optional
from models import db, Storage, UsageRecord
from utils.number_utils import NumberUtils


class StorageService:
    """Service class for storage management and inventory tracking"""
    
    @staticmethod
    def create_storage_item(data: Dict[str, Any]) -> Storage:
        """Create new storage item with initial quantity"""
        # Validate data first
        validation_error = StorageService.validate_storage_data(data, is_update=False)
        if validation_error:
            raise ValueError(validation_error)
        
        # Parse quantity string (e.g., "100g", "50ml") 
        quantity, unit = StorageService.parse_quantity(data['数量及数量单位'])
        
        # Preserve original quantity and unit without any conversion
        storage_item = Storage(
            类型=data['类型'],
            产品名=data['产品名'],
            品牌=data.get('品牌'),
            数量及数量单位=data['数量及数量单位'],
            存放地=data['存放地'],
            CAS号=data.get('CAS号'),
            当前库存量=quantity,  # Store exact quantity as provided
            单位=unit             # Store exact unit as provided
        )
        
        db.session.add(storage_item)
        db.session.commit()
        return storage_item
    
    @staticmethod
    def update_storage_item(storage_id: int, data: Dict[str, Any]) -> Storage:
        """Update existing storage item with validation"""
        storage_item = Storage.query.get_or_404(storage_id)
        
        # Update fields only if provided
        updated_fields = []
        
        if '类型' in data:
            storage_item.类型 = data['类型']
            updated_fields.append('类型')
        if '产品名' in data:
            # Check for duplicate product name (excluding current item)
            existing_item = Storage.query.filter(
                Storage.产品名 == data['产品名'], 
                Storage.id != storage_id
            ).first()
            if existing_item:
                raise ValueError('Product with this name already exists')
            storage_item.产品名 = data['产品名']
            updated_fields.append('产品名')
        if '品牌' in data:
            storage_item.品牌 = data['品牌']
            updated_fields.append('品牌')
        if '数量及数量单位' in data:
            quantity, unit = StorageService.parse_quantity(data['数量及数量单位'])
            # Only update current stock if it's not explicitly provided
            if '当前库存量' not in data:
                storage_item.当前库存量 = quantity  # Preserve original quantity
                storage_item.单位 = unit           # Update unit to match
            updated_fields.append('数量及数量单位')
        if '存放地' in data:
            storage_item.存放地 = data['存放地']
            updated_fields.append('存放地')
        if 'CAS号' in data:
            storage_item.CAS号 = data['CAS号']
            updated_fields.append('CAS号')
        if '当前库存量' in data:
            current_qty = NumberUtils.safe_float(data['当前库存量'])
            if not NumberUtils.is_non_negative(current_qty):
                raise ValueError('Current quantity cannot be negative')
            storage_item.当前库存量 = current_qty
            updated_fields.append('当前库存量')
        if '单位' in data:
            storage_item.单位 = data['单位']
            updated_fields.append('单位')
        
        if not updated_fields:
            raise ValueError('No valid fields provided for update')
        
        storage_item.更新时间 = datetime.utcnow()
        db.session.commit()
        return storage_item
    
    @staticmethod
    def validate_storage_data(data: Dict[str, Any], is_update: bool = False) -> Optional[str]:
        """Validate storage data and return error message if invalid"""
        # For updates, we don't require all fields
        if not is_update:
            required_fields = ['类型', '产品名', '数量及数量单位', '存放地']
            for field in required_fields:
                if not data.get(field):
                    return f'Missing required field: {field}'
        
        # Validate quantities if provided
        if '当前库存量' in data:
            current_qty = NumberUtils.safe_float(data['当前库存量'])
            if not NumberUtils.is_non_negative(current_qty):
                return 'Current quantity cannot be negative'
        
        # Validate quantity format if provided
        if '数量及数量单位' in data:
            try:
                quantity, unit = StorageService.parse_quantity(data['数量及数量单位'])
                if quantity <= 0:
                    return 'Total quantity must be positive'
            except ValueError:
                return 'Invalid quantity format. Use format like "100g", "50ml", etc.'
        
        # Validate strings are not empty
        string_fields = ['类型', '产品名', '存放地', '单位']
        for field in string_fields:
            if field in data and not data[field].strip():
                return f'{field} cannot be empty'
        
        return None
    
    @staticmethod
    def record_usage(storage_id: int, usage_data: Dict[str, Any]) -> Tuple[UsageRecord, Storage]:
        """Record usage and update inventory automatically"""
        storage_item = Storage.query.get_or_404(storage_id)
        
        # Validate sufficient stock
        if storage_item.当前库存量 < usage_data['使用量']:
            raise ValueError("Insufficient stock available")
        
        # Calculate remaining amount
        new_remaining = storage_item.当前库存量 - usage_data['使用量']
        
        # Create usage record
        usage_record = UsageRecord(
            storage_id=storage_id,
            类型=storage_item.类型,
            产品名=storage_item.产品名,
            数量及数量单位=storage_item.数量及数量单位,
            存放地=storage_item.存放地,
            CAS号=storage_item.CAS号,
            使用人=usage_data['使用人'],
            使用日期=usage_data['使用日期'],
            使用量=usage_data['使用量'],
            余量=new_remaining,
            单位=storage_item.单位,
            备注=usage_data.get('备注')
        )
        
        # Update storage inventory
        storage_item.当前库存量 = new_remaining
        storage_item.更新时间 = datetime.utcnow()
        
        db.session.add(usage_record)
        db.session.commit()
        
        return usage_record, storage_item
    
    @staticmethod
    def record_usage_with_units(storage_id: int, usage_data: Dict[str, Any]) -> Tuple[UsageRecord, Storage]:
        """Record usage maintaining unit consistency with storage item"""
        import logging
        logger = logging.getLogger(__name__)
        
        storage_item = Storage.query.get_or_404(storage_id)
        logger.info(f"Recording usage for storage {storage_id}: {storage_item.产品名}")
        
        # Get usage amount and unit
        usage_amount = usage_data['使用量']
        usage_unit = usage_data['单位']
        
        # Ensure unit consistency
        if usage_unit != storage_item.单位:
            raise ValueError(f"Unit mismatch: usage unit {usage_unit} != storage unit {storage_item.单位}. Units must match for usage recording.")
        
        # Validate sufficient stock (in storage's unit)
        if storage_item.当前库存量 < usage_amount:
            raise ValueError(f"Insufficient stock available. Current: {storage_item.当前库存量}{storage_item.单位}, Requested: {usage_amount}{storage_item.单位}")
        
        # Calculate remaining amount (in storage's unit)
        new_remaining = NumberUtils.safe_subtract(storage_item.当前库存量, usage_amount)
        
        logger.info(f"Usage calculation: {storage_item.当前库存量} - {usage_amount} = {new_remaining} {storage_item.单位}")
        
        # Create usage record (using storage's unit)
        usage_record = UsageRecord(
            storage_id=storage_id,
            类型=storage_item.类型,
            产品名=storage_item.产品名,
            数量及数量单位=storage_item.数量及数量单位,
            存放地=storage_item.存放地,
            CAS号=storage_item.CAS号,
            使用人=usage_data['使用人'],
            使用日期=usage_data['使用日期'],
            使用量=usage_amount,
            余量=new_remaining,
            单位=storage_item.单位,
            备注=usage_data.get('备注')
        )
        
        # Update storage inventory (in storage's unit)
        storage_item.当前库存量 = new_remaining
        storage_item.更新时间 = datetime.utcnow()
        
        db.session.add(usage_record)
        db.session.commit()
        
        logger.info(f"Successfully recorded usage: {usage_amount} {storage_item.单位}, remaining: {new_remaining} {storage_item.单位}")
        return usage_record, storage_item
    
    @staticmethod
    def update_usage_record(usage_id: int, usage_data: Dict[str, Any]) -> Tuple[UsageRecord, Storage]:
        """Update usage record and adjust inventory"""
        from utils.date_parser import DateParser
        
        usage_record = UsageRecord.query.get_or_404(usage_id)
        storage_item = Storage.query.get_or_404(usage_record.storage_id)
        
        # Calculate difference in usage amount
        old_usage = usage_record.使用量
        new_usage = NumberUtils.safe_float(usage_data.get('使用量', old_usage))
        usage_difference = NumberUtils.safe_subtract(new_usage, old_usage)
        
        # Check if we have enough stock for the change
        if NumberUtils.safe_subtract(storage_item.当前库存量, usage_difference) < 0:
            raise ValueError("Insufficient stock for this update")
        
        # Parse date if provided
        usage_date = usage_data.get('使用日期', usage_record.使用日期)
        if isinstance(usage_date, str):
            parsed_date = DateParser.parse_date(usage_date)
            if parsed_date:
                usage_date = parsed_date
            else:
                raise ValueError("Invalid date format")
        
        # Update usage record
        usage_record.使用人 = usage_data.get('使用人', usage_record.使用人)
        usage_record.使用日期 = usage_date
        usage_record.使用量 = new_usage
        usage_record.单位 = usage_data.get('单位', usage_record.单位)
        usage_record.备注 = usage_data.get('备注', usage_record.备注)
        
        # Update storage inventory
        storage_item.当前库存量 = NumberUtils.safe_subtract(storage_item.当前库存量, usage_difference)
        usage_record.余量 = storage_item.当前库存量
        storage_item.更新时间 = datetime.utcnow()
        usage_record.更新时间 = datetime.utcnow()
        
        db.session.commit()
        return usage_record, storage_item
    
    @staticmethod
    def delete_usage_record(usage_id: int) -> Storage:
        """Delete usage record and restore inventory with atomic operation"""
        import logging
        logger = logging.getLogger(__name__)
        
        # Start transaction
        try:
            logger.info(f"Starting deletion of usage record {usage_id}")
            
            # Get usage record with validation
            usage_record = UsageRecord.query.get(usage_id)
            if not usage_record:
                raise ValueError(f"Usage record with ID {usage_id} not found")
            
            # Validate record is storage-integrated
            if not usage_record.storage_id:
                raise ValueError(f"Usage record {usage_id} is not linked to a storage item")
            
            # Get storage item with validation
            storage_item = Storage.query.get(usage_record.storage_id)
            if not storage_item:
                raise ValueError(f"Storage item {usage_record.storage_id} not found for usage record {usage_id}")
            
            # Log current state for debugging
            logger.info(f"Record details - Product: {usage_record.产品名}, "
                       f"Usage amount: {usage_record.使用量}{storage_item.单位}, "
                       f"Current inventory: {storage_item.当前库存量}g")
            
            # Validate usage amount is reasonable
            if usage_record.使用量 <= 0:
                raise ValueError(f"Invalid usage amount {usage_record.使用量}{storage_item.单位} in record {usage_id}")
            
            # Calculate new inventory level
            original_inventory = storage_item.当前库存量
            restored_inventory = NumberUtils.safe_add(original_inventory, usage_record.使用量)
            
            logger.info(f"Restoring inventory: {original_inventory}{storage_item.单位} + {usage_record.使用量}{storage_item.单位} = {restored_inventory}{storage_item.单位}")
            
            # Restore inventory
            storage_item.当前库存量 = restored_inventory
            storage_item.更新时间 = datetime.utcnow()
            
            # Delete the usage record
            db.session.delete(usage_record)
            
            # Commit transaction
            db.session.commit()
            
            logger.info(f"Successfully deleted usage record {usage_id} and restored inventory to {restored_inventory}g")
            return storage_item
            
        except ValueError:
            # Re-raise validation errors without rollback (no changes made yet)
            raise
        except Exception as e:
            # Roll back on any database error
            db.session.rollback()
            logger.error(f"Database error during usage record deletion {usage_id}: {str(e)}", exc_info=True)
            raise RuntimeError(f"Failed to delete usage record {usage_id}: database operation failed") from e
    
    @staticmethod
    def delete_storage_item(storage_id: int, cascade: bool = False) -> Dict[str, Any]:
        """Delete storage item with optional cascade deletion of associated records"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Get storage item
            storage_item = Storage.query.get(storage_id)
            if not storage_item:
                raise ValueError(f"Storage item with ID {storage_id} not found")
            
            # Get associated usage records
            usage_records = UsageRecord.query.filter_by(storage_id=storage_id).all()
            usage_count = len(usage_records)
            
            logger.info(f"Deleting storage {storage_id}: {storage_item.产品名} with {usage_count} associated records")
            
            # Prepare deletion result
            result = {
                'storage_item': {
                    'id': storage_id,
                    'name': storage_item.产品名,
                    'type': storage_item.类型,
                    'location': storage_item.存放地
                },
                'associated_records': {
                    'count': usage_count,
                    'deleted': 0
                },
                'cascade_deletion': cascade
            }
            
            # If cascade deletion is requested or no records exist
            if cascade or usage_count == 0:
                # Delete associated records first
                deleted_record_ids = []
                for record in usage_records:
                    deleted_record_ids.append(record.id)
                    db.session.delete(record)
                
                # Delete storage item
                db.session.delete(storage_item)
                db.session.commit()
                
                result['associated_records']['deleted'] = usage_count
                result['associated_records']['deleted_record_ids'] = deleted_record_ids
                result['success'] = True
                result['message'] = f"Storage item deleted successfully" + (f" along with {usage_count} associated records" if usage_count > 0 else "")
                
                logger.info(f"Successfully deleted storage {storage_id} and {usage_count} associated records")
                
            else:
                # Cannot delete - return information about blocking records
                record_details = []
                total_usage = 0
                users = set()
                
                for record in usage_records:
                    total_usage += record.使用量_g
                    users.add(record.使用人)
                    record_details.append({
                        'id': record.id,
                        'user': record.使用人,
                        'date': record.使用日期.isoformat(),
                        'amount': record.使用量_g
                    })
                
                result['associated_records'].update({
                    'blocking_deletion': True,
                    'total_usage': total_usage,
                    'unique_users': list(users),
                    'records': record_details[:10]  # Limit to 10 records
                })
                result['success'] = False
                result['message'] = f"Cannot delete storage item with {usage_count} associated usage records"
            
            return result
            
        except ValueError:
            # Re-raise validation errors
            raise
        except Exception as e:
            # Roll back on database error
            db.session.rollback()
            logger.error(f"Database error during storage deletion {storage_id}: {str(e)}", exc_info=True)
            raise RuntimeError(f"Failed to delete storage item {storage_id}: database operation failed") from e
    
    @staticmethod
    def get_storage_deletion_info(storage_id: int) -> Dict[str, Any]:
        """Get detailed information about storage item and its dependencies for deletion planning"""
        storage_item = Storage.query.get(storage_id)
        if not storage_item:
            raise ValueError(f"Storage item with ID {storage_id} not found")
        
        # Get usage records with statistics
        usage_records = UsageRecord.query.filter_by(storage_id=storage_id).all()
        
        if not usage_records:
            return {
                'storage_item': storage_item.to_dict(),
                'can_delete_safely': True,
                'associated_records': {'count': 0},
                'deletion_impact': 'No associated records - safe to delete'
            }
        
        # Calculate statistics
        total_usage = sum(record.使用量_g for record in usage_records)
        users = set(record.使用人 for record in usage_records)
        dates = [record.使用日期 for record in usage_records]
        
        return {
            'storage_item': storage_item.to_dict(),
            'can_delete_safely': False,
            'associated_records': {
                'count': len(usage_records),
                'total_usage': total_usage,
                'unique_users': list(users),
                'user_count': len(users),
                'date_range': {
                    'earliest': min(dates).isoformat(),
                    'latest': max(dates).isoformat()
                },
                'sample_records': [
                    {
                        'id': record.id,
                        'user': record.使用人,
                        'date': record.使用日期.isoformat(),
                        'amount': record.使用量_g
                    }
                    for record in usage_records[:5]
                ]
            },
            'deletion_impact': f'Deleting this storage item will affect {len(usage_records)} usage records from {len(users)} users',
            'deletion_options': [
                {
                    'type': 'cascade',
                    'description': 'Delete storage item and all associated records',
                    'warning': 'This action cannot be undone'
                },
                {
                    'type': 'manual',
                    'description': 'Delete usage records individually first',
                    'steps': ['Review each usage record', 'Delete records manually', 'Delete storage item']
                }
            ]
        }
    
    @staticmethod
    def get_low_stock_items(threshold_percentage: float = 10.0) -> list[Storage]:
        """Get items with low stock"""
        storage_items = Storage.query.all()
        low_stock_items = []
        
        for item in storage_items:
            try:
                original_quantity, unit = StorageService.parse_quantity(item.数量及数量单位)
                
                # Only compare if units match
                if unit == item.单位 and original_quantity > 0:
                    percentage = (item.当前库存量 / original_quantity) * 100
                    if percentage <= threshold_percentage:
                        low_stock_items.append(item)
            except ValueError:
                # Skip items with invalid quantity format
                continue
                
        return low_stock_items
    
    @staticmethod
    def parse_quantity(quantity_str: str) -> Tuple[float, str]:
        """Parse quantity string like '100g', '50ml', '2kg', '10瓶', '5盒'"""
        match = re.match(r'([0-9.]+)\s*([a-zA-Zμ\u4e00-\u9fa5]+)', quantity_str.strip())
        if match:
            quantity = NumberUtils.safe_float(match.group(1))
            unit = match.group(2)
            return quantity, unit
        raise ValueError(f"Invalid quantity format: {quantity_str}")
    


    @staticmethod
    def find_existing_storage_item(data: Dict[str, Any]) -> Optional[Storage]:
        """Find an existing storage item using best-available keys.

        Priority of match:
        1) CAS号 + 存放地 (+ 类型 if provided)
        2) 产品名 + 存放地 (+ 类型 if provided)
        3) 产品名 only
        """
        query = None

        cas_number = data.get('CAS号') or data.get('cas_number')
        name = data.get('产品名') or data.get('name')
        location = data.get('存放地') or data.get('location')
        type_name = data.get('类型') or data.get('type')

        # 1) Try CAS + location (+ type)
        if cas_number and location:
            q = Storage.query.filter(Storage.CAS号 == cas_number, Storage.存放地 == location)
            if type_name:
                q = q.filter(Storage.类型 == type_name)
            query = q.first()
            if query:
                return query

        # 2) Try name + location (+ type)
        if name and location:
            q = Storage.query.filter(Storage.产品名 == name, Storage.存放地 == location)
            if type_name:
                q = q.filter(Storage.类型 == type_name)
            query = q.first()
            if query:
                return query

        # 3) Fallback to name only
        if name:
            return Storage.query.filter(Storage.产品名 == name).first()

        return None

    @staticmethod
    def add_quantity_to_storage_item(storage_item: Storage, amount: float, unit: str) -> Storage:
        """Add quantity to an existing storage item. Units must match."""
        # Ensure amount is positive
        if amount <= 0:
            raise ValueError('Merge amount must be positive')

        # Ensure units match
        if unit != storage_item.单位:
            raise ValueError(f'Unit mismatch: {unit} != {storage_item.单位}. Units must match for quantity addition.')

        storage_item.当前库存量 = NumberUtils.safe_add(storage_item.当前库存量, amount)
        storage_item.更新时间 = datetime.utcnow()
        db.session.commit()
        return storage_item
    
    @staticmethod
    def create_storage_item_with_units(data: Dict[str, Any]) -> Storage:
        """Create new storage item maintaining original units"""
        # Validate data first
        validation_error = StorageService.validate_storage_data(data, is_update=False)
        if validation_error:
            raise ValueError(validation_error)
        
        # Parse quantity string (e.g., "100g", "50ml") 
        quantity, unit = StorageService.parse_quantity(data['数量及数量单位'])
        quantity = NumberUtils.safe_float(quantity)
        
        # Keep original unit instead of converting to grams
        storage_item = Storage(
            类型=data['类型'],
            产品名=data['产品名'],
            品牌=data.get('品牌'),
            数量及数量单位=data['数量及数量单位'],
            存放地=data['存放地'],
            CAS号=data.get('CAS号'),
            当前库存量=quantity,  # Keep in original unit
            单位=unit  # Use original unit
        )
        
        db.session.add(storage_item)
        db.session.commit()
        return storage_item
    
    @staticmethod
    def get_inventory_dashboard_data() -> Dict[str, Any]:
        """Get inventory dashboard statistics"""
        total_items = Storage.query.count()
        low_stock_items = StorageService.get_low_stock_items()
        low_stock_count = len(low_stock_items)
        
        # Get storage locations count
        storage_locations = db.session.query(Storage.存放地).distinct().count()
        
        # Get type distribution
        type_distribution = db.session.query(
            Storage.类型, 
            db.func.count(Storage.id)
        ).group_by(Storage.类型).all()
        
        # Monthly usage from current month
        current_month = datetime.now().replace(day=1)
        monthly_usage = db.session.query(
            db.func.count(UsageRecord.id)
        ).filter(
            UsageRecord.使用日期 >= current_month.date()
        ).scalar() or 0
        
        return {
            'total_items': total_items,
            'low_stock_count': low_stock_count,
            'storage_locations': storage_locations,
            'monthly_usage': monthly_usage,
            'inventory_by_type': [
                {'type': type_name, 'count': count} 
                for type_name, count in type_distribution
            ],
            'low_stock_items': [item.to_dict() for item in low_stock_items]
        }
    
    @staticmethod
    def bulk_update_stock(updates: list[Dict[str, Any]]) -> Dict[str, Any]:
        """Bulk update storage quantities"""
        updated_count = 0
        errors = []
        
        for update in updates:
            try:
                storage_id = update['id']
                new_quantity = update['当前库存量']
                
                storage_item = Storage.query.get(storage_id)
                if not storage_item:
                    errors.append(f"Storage item with ID {storage_id} not found")
                    continue
                
                storage_item.当前库存量 = NumberUtils.safe_float(new_quantity)
                storage_item.更新时间 = datetime.utcnow()
                updated_count += 1
                
            except Exception as e:
                errors.append(f"Error updating item {update.get('id', 'unknown')}: {str(e)}")
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'updated_count': 0,
                'errors': [f"Database error: {str(e)}"]
            }
        
        return {
            'success': True,
            'updated_count': updated_count,
            'errors': errors
        } 