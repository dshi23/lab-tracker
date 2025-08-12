from flask import Blueprint, request, jsonify
from sqlalchemy import func, desc
from datetime import datetime, date, timedelta
import logging

from models import db, UsageRecord

logger = logging.getLogger(__name__)

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/api/analytics/dashboard', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics (storage-integrated only)"""
    try:
        days = request.args.get('days', 30, type=int)
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        # 只统计 storage-integrated 记录
        base_query = UsageRecord.query.filter(UsageRecord.storage_id.isnot(None))

        total_records = base_query.count()
        recent_records = base_query.filter(UsageRecord.使用日期 >= start_date).count()
        unique_personnel = db.session.query(func.count(func.distinct(UsageRecord.使用人))).filter(UsageRecord.storage_id.isnot(None)).scalar()
        unique_products = db.session.query(func.count(func.distinct(UsageRecord.产品名))).filter(UsageRecord.storage_id.isnot(None)).scalar()

        # Most used products
        top_products = db.session.query(
            UsageRecord.产品名,
            func.count(UsageRecord.id).label('usage_count')
        ).filter(
            UsageRecord.storage_id.isnot(None),
            UsageRecord.使用日期 >= start_date
        ).group_by(UsageRecord.产品名).order_by(desc('usage_count')).limit(5).all()

        # Most active personnel
        top_personnel = db.session.query(
            UsageRecord.使用人,
            func.count(UsageRecord.id).label('record_count')
        ).filter(
            UsageRecord.storage_id.isnot(None),
            UsageRecord.使用日期 >= start_date
        ).group_by(UsageRecord.使用人).order_by(desc('record_count')).limit(5).all()

        # Daily usage trend
        daily_usage = db.session.query(
            UsageRecord.使用日期,
            func.count(UsageRecord.id).label('count')
        ).filter(
            UsageRecord.storage_id.isnot(None),
            UsageRecord.使用日期 >= start_date
        ).group_by(UsageRecord.使用日期).order_by(UsageRecord.使用日期).all()

        return jsonify({
            'total_records': total_records,
            'recent_records': recent_records,
            'unique_personnel': unique_personnel,
            'unique_products': unique_products,
            'top_products': [
                {'name': d.产品名, 'count': d.usage_count}
                for d in top_products
            ],
            'top_personnel': [
                {'name': p.使用人, 'count': p.record_count}
                for p in top_personnel
            ],
            'daily_usage': [
                {'date': str(du.使用日期), 'count': du.count}
                for du in daily_usage
            ]
        }), 200
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@analytics_bp.route('/api/analytics/personnel', methods=['GET'])
def get_personnel_stats():
    """Get personnel usage statistics (storage-integrated only)"""
    try:
        days = request.args.get('days', 30, type=int)
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        personnel_stats = db.session.query(
            UsageRecord.使用人,
            func.count(UsageRecord.id).label('total_records'),
            func.count(func.distinct(UsageRecord.产品名)).label('unique_products'),
            func.min(UsageRecord.使用日期).label('first_usage'),
            func.max(UsageRecord.使用日期).label('last_usage')
        ).filter(
            UsageRecord.storage_id.isnot(None),
            UsageRecord.使用日期 >= start_date
        ).group_by(UsageRecord.使用人).order_by(desc('total_records')).all()

        # Personnel activity by month
        monthly_activity = db.session.query(
            UsageRecord.使用人,
            func.strftime('%Y-%m', UsageRecord.使用日期).label('month'),
            func.count(UsageRecord.id).label('count')
        ).filter(
            UsageRecord.storage_id.isnot(None),
            UsageRecord.使用日期 >= start_date
        ).group_by(
            UsageRecord.使用人,
            func.strftime('%Y-%m', UsageRecord.使用日期)
        ).order_by(
            UsageRecord.使用人,
            func.strftime('%Y-%m', UsageRecord.使用日期)
        ).all()

        return jsonify({
            'personnel_stats': [
                {
                    'name': ps.使用人,
                    'total_records': ps.total_records,
                    'unique_products': ps.unique_products,
                    'first_usage': str(ps.first_usage) if ps.first_usage else None,
                    'last_usage': str(ps.last_usage) if ps.last_usage else None
                }
                for ps in personnel_stats
            ],
            'monthly_activity': [
                {
                    'personnel': ma.使用人,
                    'month': str(ma.month),
                    'count': ma.count
                }
                for ma in monthly_activity
            ]
        }), 200
    except Exception as e:
        logger.error(f"Error getting personnel stats: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@analytics_bp.route('/api/analytics/products', methods=['GET'])
def get_product_stats():
    """Get product usage statistics (storage-integrated only)"""
    try:
        days = request.args.get('days', 30, type=int)
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        product_stats = db.session.query(
            UsageRecord.产品名,
            UsageRecord.类型,
            func.count(UsageRecord.id).label('total_usage'),
            func.count(func.distinct(UsageRecord.使用人)).label('unique_users'),
            func.min(UsageRecord.使用日期).label('first_usage'),
            func.max(UsageRecord.使用日期).label('last_usage'),
            func.avg(UsageRecord.使用量).label('avg_usage')
        ).filter(
            UsageRecord.storage_id.isnot(None),
            UsageRecord.使用日期 >= start_date
        ).group_by(UsageRecord.产品名, UsageRecord.类型).order_by(desc('total_usage')).all()

        return jsonify({
            'product_stats': [
                {
                    'name': d.产品名,
                    'type': d.类型,
                    'total_usage': d.total_usage,
                    'unique_users': d.unique_users,
                    'first_usage': str(d.first_usage) if d.first_usage else None,
                    'last_usage': str(d.last_usage) if d.last_usage else None,
                    'avg_usage': float(d.avg_usage) if d.avg_usage else 0
                }
                for d in product_stats
            ]
        }), 200
    except Exception as e:
        logger.error(f"Error getting product stats: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@analytics_bp.route('/api/analytics/trends', methods=['GET'])
def get_usage_trends():
    """Get usage trends over time (storage-integrated only)"""
    try:
        period = request.args.get('period', 'daily')  # daily, weekly, monthly
        days = request.args.get('days', 30, type=int)
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        if period == 'daily':
            trends = db.session.query(
                UsageRecord.使用日期,
                func.count(UsageRecord.id).label('count'),
                func.count(func.distinct(UsageRecord.使用人)).label('active_users'),
                func.count(func.distinct(UsageRecord.产品名)).label('products_used')
            ).filter(
                UsageRecord.storage_id.isnot(None),
                UsageRecord.使用日期 >= start_date
            ).group_by(UsageRecord.使用日期).order_by(UsageRecord.使用日期).all()
            result = [
                {
                    'date': str(t.使用日期),
                    'count': t.count,
                    'active_users': t.active_users,
                    'products_used': t.products_used
                }
                for t in trends
            ]
        elif period == 'weekly':
            trends = db.session.query(
                func.strftime('%Y-%W', UsageRecord.使用日期).label('week'),
                func.count(UsageRecord.id).label('count'),
                func.count(func.distinct(UsageRecord.使用人)).label('active_users'),
                func.count(func.distinct(UsageRecord.产品名)).label('products_used')
            ).filter(
                UsageRecord.storage_id.isnot(None),
                UsageRecord.使用日期 >= start_date
            ).group_by(func.strftime('%Y-%W', UsageRecord.使用日期)).order_by(func.strftime('%Y-%W', UsageRecord.使用日期)).all()
            result = [
                {
                    'week': str(t.week),
                    'count': t.count,
                    'active_users': t.active_users,
                    'products_used': t.products_used
                }
                for t in trends
            ]
        else:  # monthly
            trends = db.session.query(
                func.strftime('%Y-%m', UsageRecord.使用日期).label('month'),
                func.count(UsageRecord.id).label('count'),
                func.count(func.distinct(UsageRecord.使用人)).label('active_users'),
                func.count(func.distinct(UsageRecord.产品名)).label('products_used')
            ).filter(
                UsageRecord.storage_id.isnot(None),
                UsageRecord.使用日期 >= start_date
            ).group_by(func.strftime('%Y-%m', UsageRecord.使用日期)).order_by(func.strftime('%Y-%m', UsageRecord.使用日期)).all()
            result = [
                {
                    'month': str(t.month),
                    'count': t.count,
                    'active_users': t.active_users,
                    'products_used': t.products_used
                }
                for t in trends
            ]
        return jsonify({
            'period': period,
            'trends': result
        }), 200
    except Exception as e:
        logger.error(f"Error getting usage trends: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@analytics_bp.route('/api/analytics/autocomplete', methods=['GET'])
def get_autocomplete_data():
    """Get autocomplete data for search fields (storage-integrated only)"""
    try:
        personnel_names = db.session.query(
            func.distinct(UsageRecord.使用人)
        ).filter(
            UsageRecord.storage_id.isnot(None),
            UsageRecord.使用人.isnot(None),
            UsageRecord.使用人 != ''
        ).order_by(UsageRecord.使用人).all()
        product_names = db.session.query(
            func.distinct(UsageRecord.产品名)
        ).filter(
            UsageRecord.storage_id.isnot(None),
            UsageRecord.产品名.isnot(None),
            UsageRecord.产品名 != ''
        ).order_by(UsageRecord.产品名).all()
        return jsonify({
            'personnel': [p[0] for p in personnel_names],
            'products': [d[0] for d in product_names]
        }), 200
    except Exception as e:
        logger.error(f"Error getting autocomplete data: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500 