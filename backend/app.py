"""
Lab Tracker Flask Application

This module contains the application factory for creating Flask app instances
with proper configuration, extensions, and error handling.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
import logging
from datetime import date
from werkzeug.exceptions import HTTPException

# Import application components
from models import db
from routes import register_blueprints
from config import config

def create_app(config_name=None):
    """
    Application factory pattern
    
    Args:
        config_name (str): Configuration name ('development', 'production', 'testing')
        
    Returns:
        Flask: Configured Flask application instance
    """
    # Determine configuration
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    
    # Load configuration
    try:
        app.config.from_object(config[config_name])
        app.logger.info(f"Loaded {config_name} configuration")
    except KeyError:
        app.logger.error(f"Invalid configuration name: {config_name}")
        app.config.from_object(config['default'])
        app.logger.info("Loaded default configuration")
    
    # Initialize extensions
    _init_extensions(app)
    
    # Configure application
    _configure_logging(app)
    _configure_cors(app)
    _configure_rate_limiting(app)
    
    # Register components
    _register_blueprints(app)
    _register_error_handlers(app)
    _register_shell_context(app)
    
    # Add request hooks
    _register_request_hooks(app)
    
    app.logger.info("Application factory completed successfully")
    return app

def _init_extensions(app):
    """Initialize Flask extensions"""
    # Database
    db.init_app(app)
    
    # Database migrations
    migrate = Migrate(app, db, compare_type=True)
    
    app.logger.info("Extensions initialized")

def _configure_logging(app):
    """Configure application logging"""
    if not app.debug and not app.testing:
        # Production logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]',
            handlers=[
                logging.FileHandler('app.log'),
                logging.StreamHandler()
            ]
        )
    else:
        # Development logging
        logging.basicConfig(
            level=logging.DEBUG if app.debug else logging.INFO,
            format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        )
    
    app.logger.info("Logging configured")

def _configure_cors(app):
    """Configure Cross-Origin Resource Sharing"""
    CORS(app, 
         origins=app.config['CORS_ORIGINS'],
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    app.logger.info("CORS configured")

def _configure_rate_limiting(app):
    """Configure rate limiting"""
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"],
        storage_uri=app.config.get('RATELIMIT_STORAGE_URL', 'memory://'),
        strategy='fixed-window'
    )
    
    app.logger.info("Rate limiting configured")

def _register_blueprints(app):
    """Register all application blueprints"""
    register_blueprints(app)
    app.logger.info("Blueprints registered")

def _register_error_handlers(app):
    """Register error handlers for common HTTP errors"""
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'error': 'Bad Request',
            'message': 'The request was malformed or invalid'
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            'error': 'Unauthorized',
            'message': 'Authentication required'
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            'error': 'Forbidden',
            'message': 'Access denied'
        }), 403
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Not Found',
            'message': 'The requested resource was not found'
        }), 404
    
    @app.errorhandler(429)
    def rate_limit_exceeded(error):
        return jsonify({
            'error': 'Rate Limit Exceeded',
            'message': 'Too many requests. Please try again later.'
        }), 429
    
    @app.errorhandler(500)
    def internal_server_error(error):
        db.session.rollback()
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred'
        }), 500
    
    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        return jsonify({
            'error': error.name,
            'message': error.description
        }), error.code
    
    app.logger.info("Error handlers registered")

def _register_shell_context(app):
    """Register shell context for Flask CLI"""
    @app.shell_context_processor
    def make_shell_context():
        from models import Storage, UsageRecord
        return {
            'db': db,
            'Storage': Storage,
            'UsageRecord': UsageRecord
        }
    
    app.logger.info("Shell context registered")

def _register_request_hooks(app):
    """Register request hooks for logging and monitoring"""
    
    @app.before_request
    def log_request_info():
        if app.debug:
            app.logger.debug(f"Request: {request.method} {request.url}")
    
    @app.after_request
    def after_request(response):
        # Add security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        if app.debug:
            app.logger.debug(f"Response: {response.status_code}")
        
        return response
    
    app.logger.info("Request hooks registered")
    # 添加健康检查端点
    _add_health_check(app)

# Health check endpoint
def _add_health_check(app):
    """Add a health check endpoint"""
    @app.route('/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'timestamp': date.today().isoformat(),
            'version': '1.0.0'
        })

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)