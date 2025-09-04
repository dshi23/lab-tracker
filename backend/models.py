from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import Index
from flask_login import UserMixin

db = SQLAlchemy()

# User Authentication Model
class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationship to personnel
    personnel = db.relationship('Personnel', backref='user', uselist=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

# Storage Management Model
class Storage(db.Model):
    __tablename__ = 'storage'
    
    id = db.Column(db.Integer, primary_key=True)
    类型 = db.Column(db.String(100), nullable=False, index=True)  # Type (化学品, 试剂, etc.)
    产品名 = db.Column(db.String(200), nullable=False, index=True)  # Product Name
    数量及数量单位 = db.Column(db.String(50), nullable=False)  # Quantity with Unit (e.g., "100g", "50ml")
    存放地 = db.Column(db.String(100), nullable=False)  # Storage Location
    CAS号 = db.Column(db.String(50), nullable=True, index=True)  # CAS Number
    当前库存量 = db.Column(db.Float, nullable=False, default=0.0)  # Current Stock (in grams)
    单位 = db.Column(db.String(10), nullable=False, default='g')  # Unit
    创建时间 = db.Column(db.DateTime, default=datetime.utcnow)
    更新时间 = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to usage records
    usage_records = db.relationship('UsageRecord', backref='storage_item', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            '类型': self.类型,
            '产品名': self.产品名,
            '数量及数量单位': self.数量及数量单位,
            '存放地': self.存放地,
            'CAS号': self.CAS号,
            '当前库存量': self.当前库存量,
            '单位': self.单位,
            '创建时间': self.创建时间.isoformat() if self.创建时间 else None,
            '更新时间': self.更新时间.isoformat() if self.更新时间 else None
        }

# Updated Usage Record Model with Chinese fields and storage link
class UsageRecord(db.Model):
    __tablename__ = 'usage_records'
    
    id = db.Column(db.Integer, primary_key=True)
    storage_id = db.Column(db.Integer, db.ForeignKey('storage.id'), nullable=True)  # Link to storage
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Link to user
    
    # Chinese field names as specified
    类型 = db.Column(db.String(100), nullable=False)  # Type
    产品名 = db.Column(db.String(200), nullable=False)  # Product Name
    数量及数量单位 = db.Column(db.String(50), nullable=False)  # Original Quantity
    存放地 = db.Column(db.String(100), nullable=False)  # Storage Location
    CAS号 = db.Column(db.String(50), nullable=True)  # CAS Number
    使用人 = db.Column(db.String(100), nullable=False, index=True)  # User
    使用日期 = db.Column(db.Date, nullable=False, index=True)  # Usage Date
    使用量 = db.Column(db.Float, nullable=False)  # Amount Used (in storage/unit)
    余量 = db.Column(db.Float, nullable=False)  # Remaining Amount (in storage/unit)
    单位 = db.Column(db.String(10), nullable=True)  # Unit for usage/remaining, matches storage unit
    备注 = db.Column(db.Text, nullable=True)  # Notes
    创建时间 = db.Column(db.DateTime, default=datetime.utcnow)
    更新时间 = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to user
    user = db.relationship('User', backref='usage_records')
    
    def to_dict(self):
        return {
            'id': self.id,
            'storage_id': self.storage_id,
            'user_id': self.user_id,
            '类型': self.类型,
            '产品名': self.产品名,
            '数量及数量单位': self.数量及数量单位,
            '存放地': self.存放地,
            'CAS号': self.CAS号,
            '使用人': self.使用人,
            '使用日期': self.使用日期.isoformat() if self.使用日期 else None,
            '使用量': self.使用量,
            '余量': self.余量,
            '单位': self.单位,
            '备注': self.备注,
            '创建时间': self.创建时间.isoformat() if self.创建时间 else None,
            '更新时间': self.更新时间.isoformat() if self.更新时间 else None,
        }

class Personnel(db.Model):
    __tablename__ = 'personnel'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Link to user
    name = db.Column(db.String(100), nullable=False, unique=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    

# Storage table indexes
Index('idx_storage_类型', Storage.类型)
Index('idx_storage_产品名', Storage.产品名)
Index('idx_storage_CAS号', Storage.CAS号)

# Updated usage records indexes with Chinese fields
Index('idx_usage_records_使用人_使用日期', UsageRecord.使用人, UsageRecord.使用日期)
Index('idx_usage_records_产品名_使用日期', UsageRecord.产品名, UsageRecord.使用日期) 