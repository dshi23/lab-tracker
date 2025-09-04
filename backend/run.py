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
from models import User, Personnel
from flask_bcrypt import Bcrypt

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
    """Initialize database tables and create admin user if needed"""
    with app.app_context():
        try:
            print("📦 Creating database tables...")
            db.create_all()
            print("✅ Database tables created successfully")
            
            # Check if admin user exists, create if not
            admin_user = User.query.filter_by(username='admin').first()
            if not admin_user:
                print("👤 Creating admin user...")
                bcrypt = Bcrypt()
                password_hash = bcrypt.generate_password_hash('admin123').decode('utf-8')
                
                # Create admin user
                admin_user = User(
                    username='admin',
                    password_hash=password_hash,
                    is_active=True
                )
                db.session.add(admin_user)
                db.session.flush()  # Get user ID
                
                # Create admin personnel
                admin_personnel = Personnel(
                    user_id=admin_user.id,
                    name='管理员',
                    is_active=True
                )
                db.session.add(admin_personnel)
                db.session.commit()
                
                print("✅ Admin user created successfully!")
                print("   Username: admin")
                print("   Password: admin123")
            else:
                print("ℹ️  Admin user already exists")
                
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

# Create Flask app instance for gunicorn
app = create_app()

# Initialize database for gunicorn
with app.app_context():
    try:
        print("📦 Creating database tables...")
        db.create_all()
        print("✅ Database tables created successfully")
        
        # Check if admin user exists, create if not
        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            print("👤 Creating admin user...")
            bcrypt = Bcrypt()
            password_hash = bcrypt.generate_password_hash('admin123').decode('utf-8')
            
            # Create admin user
            admin_user = User(
                username='admin',
                password_hash=password_hash,
                is_active=True
            )
            db.session.add(admin_user)
            db.session.flush()  # Get user ID
            
            # Create admin personnel
            admin_personnel = Personnel(
                user_id=admin_user.id,
                name='管理员',
                is_active=True
            )
            db.session.add(admin_personnel)
            db.session.commit()
            
            print("✅ Admin user created successfully!")
            print("   Username: admin")
            print("   Password: admin123")
        else:
            print("ℹ️  Admin user already exists")
            
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")

if __name__ == '__main__':
    main() 