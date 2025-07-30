#!/usr/bin/env python3
"""
Development Tools for Lab Tracker

This module provides useful development utilities like database reset,
sample data generation, and system health checks.
"""

import os
import sys
import click
from datetime import datetime, date
from pathlib import Path

from app import create_app, db
from models import Storage, UsageRecord

@click.group()
def cli():
    """Lab Tracker Development Tools"""
    pass

@cli.command()
def reset_db():
    """Reset the database and recreate all tables"""
    app = create_app('development')
    
    with app.app_context():
        click.echo("🗑️  Dropping all tables...")
        db.drop_all()
        
        click.echo("📦 Creating all tables...")
        db.create_all()
        
        click.echo("✅ Database reset complete!")

@cli.command()
def create_sample_data():
    """Create sample data for development"""
    app = create_app('development')
    
    with app.app_context():
        # Sample storage items
        storage_items = [
            Storage(
                类型='化学品',
                产品名='Anti-β-actin',
                数量及数量单位='100μl',
                存放地='4°C冰箱A',
                CAS号='123-45-6',
                当前库存量=0.1,
                单位='g'
            ),
            Storage(
                类型='试剂',
                产品名='TBST缓冲液',
                数量及数量单位='500ml',
                存放地='室温试剂柜',
                CAS号='789-12-3',
                当前库存量=500.0,
                单位='g'
            ),
            Storage(
                类型='化学品',
                产品名='DMSO',
                数量及数量单位='100ml',
                存放地='有机试剂柜',
                CAS号='67-68-5',
                当前库存量=100.0,
                单位='g'
            ),
            Storage(
                类型='酶',
                产品名='Trypsin',
                数量及数量单位='10ml',
                存放地='-20°C冰箱',
                CAS号='9002-07-7',
                当前库存量=10.0,
                单位='g'
            ),
            Storage(
                类型='缓冲液',
                产品名='PBS缓冲液',
                数量及数量单位='1L',
                存放地='室温试剂柜',
                CAS号='111-22-3',
                当前库存量=1000.0,
                单位='g'
            )
        ]
        
        # Sample usage records
        usage_records = [
            # UsageRecord(
            #     类型='化学品',
            #     产品名='Anti-β-actin',
            #     数量及数量单位='100μl',
            #     存放地='4°C冰箱A',
            #     CAS号='123-45-6',)
            ]
        
        # Add sample data
        for item in storage_items:
            db.session.add(item)
            
        for record in usage_records:
            db.session.add(record)
            
        db.session.commit()
        
        click.echo(f"✅ Created {len(storage_items)} storage items")
        click.echo(f"✅ Created {len(usage_records)} usage records")

@cli.command()
def health_check():
    """Run a comprehensive health check"""
    app = create_app('development')
    
    with app.app_context():
        click.echo("🔍 Running health check...")
        
        # Check database connection
        try:
            storage_count = Storage.query.count()
            records_count = UsageRecord.query.count()
            click.echo(f"✅ Database: {storage_count} storage items, {records_count} usage records")
        except Exception as e:
            click.echo(f"❌ Database error: {e}")
            return
        
        # Check required directories
        base_dir = Path(__file__).parent
        required_dirs = ['instance', 'uploads']
        
        for dir_name in required_dirs:
            dir_path = base_dir / dir_name
            if dir_path.exists():
                click.echo(f"✅ Directory exists: {dir_path}")
            else:
                click.echo(f"⚠️  Directory missing: {dir_path}")
        
        # Check configuration
        click.echo(f"📊 Environment: {app.config.get('ENV', 'unknown')}")
        click.echo(f"🔧 Debug mode: {app.debug}")
        click.echo(f"💾 Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
        
        click.echo("✅ Health check complete!")

@cli.command()
def list_routes():
    """List all available API routes"""
    app = create_app('development')
    
    with app.app_context():
        click.echo("📋 Available API Routes:")
        click.echo("-" * 50)
        
        for rule in app.url_map.iter_rules():
            methods = ', '.join(sorted(rule.methods - {'OPTIONS', 'HEAD'}))
            click.echo(f"{rule.endpoint:30} {methods:15} {rule.rule}")

@cli.command()
@click.option('--tables', '-t', help='Comma-separated table names to show')
def show_data(tables):
    """Show data from database tables"""
    app = create_app('development')
    
    with app.app_context():
        if not tables:
            # Show summary
            storage_count = Storage.query.count()
            records_count = UsageRecord.query.count()
            
            click.echo("📊 Database Summary:")
            click.echo(f"Storage items: {storage_count}")
            click.echo(f"Usage records: {records_count}")
            
        else:
            table_list = [t.strip() for t in tables.split(',')]
            
            for table in table_list:
                if table.lower() == 'storage':
                    items = Storage.query.limit(5).all()
                    click.echo(f"\n📦 Storage (showing first 5 of {Storage.query.count()}):")
                    for item in items:
                        click.echo(f"  {item.id}: {item.产品名} ({item.类型}) - {item.当前库存量}g")
                        
                elif table.lower() == 'records':
                    records = UsageRecord.query.limit(5).all()
                    click.echo(f"\n📝 Usage Records (showing first 5 of {UsageRecord.query.count()}):")
                    for record in records:
                        click.echo(f"  {record.id}: {record.drug_name} by {record.personnel}")

@cli.command()
def backup_db():
    """Create a backup of the current database"""
    app = create_app('development')
    
    db_path = Path(app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
    
    if not db_path.exists():
        click.echo(f"❌ Database file not found: {db_path}")
        return
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = db_path.with_suffix(f'.backup.{timestamp}')
    
    try:
        import shutil
        shutil.copy2(db_path, backup_path)
        click.echo(f"✅ Database backed up to: {backup_path}")
    except Exception as e:
        click.echo(f"❌ Backup failed: {e}")

if __name__ == '__main__':
    cli() 