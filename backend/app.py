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
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
import os
import logging
from datetime import date
from werkzeug.exceptions import HTTPException

# Import application components
from models import db, User
from routes import register_blueprints
from config import config

# Initialize Flask-Login
login_manager = LoginManager()
bcrypt = Bcrypt()

@login_manager.user_loader
def load_user(user_id):
    """Load user for Flask-Login"""
    return User.query.get(int(user_id))

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
    CORS(app)
    db.init_app(app)
    Migrate(app, db)
    
    # Initialize Flask-Login
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = '请先登录'
    login_manager.login_message_category = 'info'
    
    # Initialize Flask-Bcrypt
    bcrypt.init_app(app)

def _configure_logging(app):
    """Configure logging for the application"""
    log_level = logging.DEBUG if app.config.get('DEBUG', True) else logging.INFO
    logging.basicConfig(level=log_level)
    app.logger.setLevel(log_level)

    # Simple request logging
    @app.before_request
    def log_request_info():
      app.logger.debug(f"Request: {request.method} {request.path}")


def _configure_cors(app):
    """Configure CORS"""
    CORS(app, resources={r"/api/*": {"origins": app.config.get('CORS_ORIGINS', ['*'])}}, supports_credentials=True, methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    app.logger.info("CORS configured")

def _configure_rate_limiting(app):
    """Configure rate limiting"""
    # Parse semicolon-separated default limits from config
    default_limits_str = app.config.get('RATELIMIT_DEFAULT', '2000 per day;500 per hour')
    default_limits = [s.strip() for s in str(default_limits_str).split(';') if s.strip()]

    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=default_limits,
        storage_uri=app.config.get('RATELIMIT_STORAGE_URL', 'memory://'),
        strategy='fixed-window'
    )
    
    app.logger.info(f"Rate limiting configured: {', '.join(default_limits)}")

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
        return {'db': db}

def _register_request_hooks(app):
    """Register request hooks like before_request and after_request"""
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        return response

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)