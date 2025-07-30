#!/usr/bin/env python3
"""
Lab Tracker Application Runner

Simple development server runner that creates the Flask app using the application factory
and handles database initialization.
"""

import os
import sys
import subprocess
from pathlib import Path

from app import create_app, db

def ensure_directories():
    """Ensure required directories exist"""
    base_dir = Path(__file__).parent
    directories = [
        base_dir / 'instance',
        base_dir / 'uploads',
        base_dir / 'logs'
    ]
    
    for directory in directories:
        directory.mkdir(exist_ok=True)
        print(f"✅ Directory ensured: {directory}")


def initialize_database(app):
    """Initialize database tables and run migrations"""
    with app.app_context():
        try:
            print("📦 Creating database tables...")
            db.create_all()
            print("✅ Database tables created successfully")
                
        except Exception as e:
            print(f"❌ Database initialization failed: {e}")
            sys.exit(1)

def main():
    """Main application runner"""
    print("🚀 Starting Lab Tracker Application...")
    print(f"🔧 Environment: {os.environ.get('FLASK_ENV', 'development')}")
    
    # Ensure required directories exist
    ensure_directories()
    
    # Create Flask application
    app = create_app()
    
    # Initialize database
    initialize_database(app)
    
    # Start development server
    print("\n" + "="*50)
    print("🌐 Starting development server...")
    print("📱 Access the application at: http://localhost:5000")
    print("📊 Health check: http://localhost:5000/health")
    print("🛑 Press Ctrl+C to stop the server")
    print("="*50 + "\n")
    
    try:
        app.run(
            debug=True, 
            host='0.0.0.0', 
            port=5000,
            use_reloader=True,
            threaded=True
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main() 