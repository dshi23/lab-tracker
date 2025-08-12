from flask import Blueprint, request, jsonify
from sqlalchemy import func, desc, and_
from datetime import datetime, date, timedelta
import logging

from models import db, Storage, UsageRecord
from services.storage_service import StorageService

logger = logging.getLogger(__name__)

inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('/api/inventory/dashboard', methods=['GET'])
def get_inventory_dashboard():
    """Get inventory dashboard statistics"""
    try:
        dashboard_data = StorageService.get_inventory_dashboard_data()
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        logger.error(f"Error getting inventory dashboard: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@inventory_bp.route('/api/inventory/alerts', methods=['GET'])
def get_inventory_alerts():
    """Get low stock and expiry alerts"""
    try:
        threshold = request.args.get('threshold', 10.0, type=float)
        
        # Get low stock items
        low_stock_items = StorageService.get_low_stock_items(threshold)
        
        # Get items with no recent usage (potential expired items)
        days_threshold = request.args.get('days_threshold', 90, type=int)
        cutoff_date = datetime.now().date() - timedelta(days=days_threshold)
        
        # Get storage items that haven't been used recently
        unused_items = db.session.query(Storage).outerjoin(
            UsageRecord, Storage.id == UsageRecord.storage_id
        ).group_by(Storage.id).having(
            func.max(UsageRecord.使用日期) < cutoff_date
        ).all()
        
        alerts = {
            'low_stock': {
                'count': len(low_stock_items),
                'items': [item.to_dict() for item in low_stock_items]
            },
            'unused_items': {
                'count': len(unused_items),
                'items': [item.to_dict() for item in unused_items]
            }
        }
        
        return jsonify(alerts), 200
        
    except Exception as e:
        logger.error(f"Error getting inventory alerts: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@inventory_bp.route('/api/inventory/usage-history/<int:storage_id>', methods=['GET'])
def get_usage_history(storage_id):
    """Get usage history for specific storage item"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Verify storage item exists
        storage_item = Storage.query.get_or_404(storage_id)
        
        # Get usage history
        query = UsageRecord.query.filter_by(storage_id=storage_id).order_by(
            desc(UsageRecord.使用日期), desc(UsageRecord.创建时间)
        )
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Calculate usage statistics
        total_usage = db.session.query(
            func.sum(UsageRecord.使用量)
        ).filter_by(storage_id=storage_id).scalar() or 0
        
        usage_count = UsageRecord.query.filter_by(storage_id=storage_id).count()
        
        # Average usage per record
        avg_usage = total_usage / usage_count if usage_count > 0 else 0
        
        # Most frequent user
        frequent_user = db.session.query(
            UsageRecord.使用人, func.count(UsageRecord.id).label('count')
        ).filter_by(storage_id=storage_id).group_by(
            UsageRecord.使用人
        ).order_by(desc('count')).first()
        
        return jsonify({
            'storage_item': storage_item.to_dict(),
            'usage_records': [record.to_dict() for record in pagination.items],
            'pagination': {
                'total': pagination.total,
                'page': page,
                'per_page': per_page,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            },
            'statistics': {
                'total_usage_g': total_usage,
                'usage_count': usage_count,
                'average_usage_g': round(avg_usage, 3),
                'most_frequent_user': frequent_user[0] if frequent_user else None,
                'current_stock_g': storage_item.当前库存量
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting usage history: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@inventory_bp.route('/api/inventory/turnover', methods=['GET'])
def get_inventory_turnover():
    """Get inventory turnover analysis"""
    try:
        days = request.args.get('days', 30, type=int)
        start_date = datetime.now().date() - timedelta(days=days)
        
        # Get storage items with usage in the period
        turnover_data = []
        
        storage_items = Storage.query.all()
        
        for item in storage_items:
            # Calculate usage in period
            period_usage = db.session.query(
                func.sum(UsageRecord.使用量)
            ).filter(
                and_(
                    UsageRecord.storage_id == item.id,
                    UsageRecord.使用日期 >= start_date
                )
            ).scalar() or 0
            
            # Calculate turnover rate (usage / current stock)
            turnover_rate = 0
            if item.当前库存量 > 0:
                turnover_rate = period_usage / item.当前库存量
            
            # Estimated days until depletion
            avg_daily_usage = period_usage / days if days > 0 else 0
            days_until_depletion = None
            if avg_daily_usage > 0:
                days_until_depletion = item.当前库存量 / avg_daily_usage
            
            turnover_data.append({
                'storage_item': item.to_dict(),
                'period_usage_g': period_usage,
                'turnover_rate': round(turnover_rate, 3),
                'avg_daily_usage_g': round(avg_daily_usage, 3),
                'days_until_depletion': round(days_until_depletion) if days_until_depletion else None
            })
        
        # Sort by turnover rate (highest first)
        turnover_data.sort(key=lambda x: x['turnover_rate'], reverse=True)
        
        return jsonify({
            'period_days': days,
            'start_date': start_date.isoformat(),
            'turnover_analysis': turnover_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting inventory turnover: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@inventory_bp.route('/api/inventory/trends', methods=['GET'])
def get_inventory_trends():
    """Get inventory usage trends"""
    try:
        days = request.args.get('days', 30, type=int)
        period = request.args.get('period', 'daily')  # daily, weekly, monthly
        
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Build date grouping based on period
        if period == 'daily':
            date_format = func.date(UsageRecord.使用日期)
            date_label = 'date'
        elif period == 'weekly':
            date_format = func.strftime('%Y-W%W', UsageRecord.使用日期)
            date_label = 'week'
        else:  # monthly
            date_format = func.strftime('%Y-%m', UsageRecord.使用日期)
            date_label = 'month'
        
        # Get usage trends
        usage_trends = db.session.query(
            date_format.label(date_label),
            func.count(UsageRecord.id).label('usage_count'),
            func.sum(UsageRecord.使用量).label('total_usage'),
            func.count(func.distinct(UsageRecord.使用人)).label('unique_users')
        ).filter(
            UsageRecord.使用日期 >= start_date
        ).group_by(date_format).order_by(date_format).all()
        
        # Get type-wise usage
        type_trends = db.session.query(
            UsageRecord.类型,
            func.count(UsageRecord.id).label('usage_count'),
            func.sum(UsageRecord.使用量).label('total_usage')
        ).filter(
            UsageRecord.使用日期 >= start_date
        ).group_by(UsageRecord.类型).all()
        
        # Get top users
        top_users = db.session.query(
            UsageRecord.使用人,
            func.count(UsageRecord.id).label('usage_count'),
            func.sum(UsageRecord.使用量).label('total_usage')
        ).filter(
            UsageRecord.使用日期 >= start_date
        ).group_by(UsageRecord.使用人).order_by(
            desc('usage_count')
        ).limit(10).all()
        
        # Get top products
        top_products = db.session.query(
            UsageRecord.产品名,
            func.count(UsageRecord.id).label('usage_count'),
            func.sum(UsageRecord.使用量_g).label('total_usage_g')
        ).filter(
            UsageRecord.使用日期 >= start_date
        ).group_by(UsageRecord.产品名).order_by(
            desc('usage_count')
        ).limit(10).all()
        
        return jsonify({
            'period': period,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'usage_trends': [
                {
                    date_label: trend[0],
                    'usage_count': trend[1],
                    'total_usage_g': float(trend[2]) if trend[2] else 0,
                    'unique_users': trend[3]
                }
                for trend in usage_trends
            ],
            'type_trends': [
                {
                    'type': trend[0],
                    'usage_count': trend[1],
                    'total_usage_g': float(trend[2]) if trend[2] else 0
                }
                for trend in type_trends
            ],
            'top_users': [
                {
                    'user': trend[0],
                    'usage_count': trend[1],
                    'total_usage_g': float(trend[2]) if trend[2] else 0
                }
                for trend in top_users
            ],
            'top_products': [
                {
                    'product': trend[0],
                    'usage_count': trend[1],
                    'total_usage_g': float(trend[2]) if trend[2] else 0
                }
                for trend in top_products
            ]
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting inventory trends: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500 