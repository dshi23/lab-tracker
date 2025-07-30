"""
Routes package for lab tracker backend

This package contains all API route blueprints for the lab tracker application.
Each module defines routes for a specific domain area.
"""

from flask import Blueprint

# Import all route blueprints
from .records import records_bp
from .storage import storage_bp
from .inventory import inventory_bp
from .analytics import analytics_bp
from .import_export import import_export_bp

# List of all blueprints for easy registration
ALL_BLUEPRINTS = [
    records_bp,
    storage_bp, 
    inventory_bp,
    analytics_bp,
    import_export_bp
]

def register_blueprints(app):
    """Register all blueprints with the Flask application"""
    for blueprint in ALL_BLUEPRINTS:
        app.register_blueprint(blueprint)

__all__ = [
    'records_bp',
    'storage_bp',
    'inventory_bp',
    'analytics_bp',
    'import_export_bp',
    'ALL_BLUEPRINTS',
    'register_blueprints'
] 