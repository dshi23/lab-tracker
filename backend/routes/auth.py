from flask import Blueprint, request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from models import db, User, Personnel
from flask_bcrypt import Bcrypt

auth_bp = Blueprint('auth', __name__)

# Create a bcrypt instance for this module
_bcrypt = Bcrypt()

def get_bcrypt():
    """Get bcrypt instance"""
    return _bcrypt

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': '用户名和密码不能为空'}), 400
        
        user = User.query.filter_by(username=username).first()
        
        if user and get_bcrypt().check_password_hash(user.password_hash, password):
            # Check if user is active
            if not user.is_active:
                return jsonify({'error': '您的账户尚未激活，请等待管理员审核'}), 403
            
            # Update last login
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            # Login user
            login_user(user)
            
            # Get personnel info if exists
            personnel_info = None
            if user.personnel:
                personnel_info = user.personnel.to_dict()
            
            return jsonify({
                'message': '登录成功',
                'user': user.to_dict(),
                'personnel': personnel_info
            }), 200
        else:
            return jsonify({'error': '用户名或密码错误'}), 401
            
    except Exception as e:
        return jsonify({'error': f'登录失败: {str(e)}'}), 500

@auth_bp.route('/api/auth/logout', methods=['POST'])
@login_required
def logout():
    """User logout endpoint"""
    try:
        logout_user()
        return jsonify({'message': '登出成功'}), 200
    except Exception as e:
        return jsonify({'error': f'登出失败: {str(e)}'}), 500

@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    """User registration endpoint - simplified"""
    try:
        data = request.get_json()
        username = data.get('username')
        name = data.get('name')
        password = data.get('password')
        
        if not username or not name or not password:
            return jsonify({'error': '用户名、姓名和密码不能为空'}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': '用户名已存在'}), 400
        
        # Create user with default role (pending approval)
        password_hash = get_bcrypt().generate_password_hash(password).decode('utf-8')
        user = User(
            username=username,
            password_hash=password_hash,
            is_active=False  # Default to inactive until approved
        )
        db.session.add(user)
        db.session.flush()  # Get user ID
        
        # Create personnel record with minimal info
        personnel = Personnel(
            user_id=user.id,
            name=name,
            is_active=False
        )
        db.session.add(personnel)
        
        db.session.commit()
        
        return jsonify({
            'message': '注册成功，请等待管理员审核',
            'user': user.to_dict(),
            'personnel': personnel.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'注册失败: {str(e)}'}), 500

@auth_bp.route('/api/auth/profile', methods=['GET'])
@login_required
def get_profile():
    """Get current user profile"""
    try:
        personnel_info = None
        if current_user.personnel:
            personnel_info = current_user.personnel.to_dict()
        
        return jsonify({
            'user': current_user.to_dict(),
            'personnel': personnel_info
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'获取用户信息失败: {str(e)}'}), 500

@auth_bp.route('/api/auth/profile', methods=['PUT'])
@login_required
def update_profile():
    """Update current user profile"""
    try:
        data = request.get_json()
        
        # Update user info (no email field anymore)
        
        # Update personnel info
        if current_user.personnel:
            personnel = current_user.personnel
            if 'name' in data:
                personnel.name = data['name']
        
        db.session.commit()
        
        personnel_info = None
        if current_user.personnel:
            personnel_info = current_user.personnel.to_dict()
        
        return jsonify({
            'message': '个人信息更新成功',
            'user': current_user.to_dict(),
            'personnel': personnel_info
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'更新个人信息失败: {str(e)}'}), 500

@auth_bp.route('/api/auth/change-password', methods=['POST'])
@login_required
def change_password():
    """Change user password"""
    try:
        data = request.get_json()
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        if not current_password or not new_password:
            return jsonify({'error': '当前密码和新密码不能为空'}), 400
        
        # Verify current password
        if not get_bcrypt().check_password_hash(current_user.password_hash, current_password):
            return jsonify({'error': '当前密码错误'}), 400
        
        # Update password
        current_user.password_hash = get_bcrypt().generate_password_hash(new_password).decode('utf-8')
        db.session.commit()
        
        return jsonify({'message': '密码修改成功'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'密码修改失败: {str(e)}'}), 500

@auth_bp.route('/api/auth/check', methods=['GET'])
def check_auth():
    """Check if user is authenticated"""
    if current_user.is_authenticated:
        personnel_info = None
        if current_user.personnel:
            personnel_info = current_user.personnel.to_dict()
        
        return jsonify({
            'authenticated': True,
            'user': current_user.to_dict(),
            'personnel': personnel_info
        }), 200
    else:
        return jsonify({'authenticated': False}), 401

# Admin-only endpoints for user management
@auth_bp.route('/api/auth/users', methods=['GET'])
@login_required
def get_users():
    """Get all users (admin only)"""
    try:
        # Check if current user is admin (first user is considered admin)
        if current_user.id != 1:
            return jsonify({'error': '权限不足'}), 403
        
        users = User.query.all()
        users_data = []
        
        for user in users:
            user_data = user.to_dict()
            if user.personnel:
                user_data['personnel'] = user.personnel.to_dict()
            users_data.append(user_data)
        
        return jsonify(users_data), 200
        
    except Exception as e:
        return jsonify({'error': f'获取用户列表失败: {str(e)}'}), 500

@auth_bp.route('/api/auth/users/<int:user_id>/approve', methods=['POST'])
@login_required
def approve_user(user_id):
    """Approve a user (admin only)"""
    try:
        # Check if current user is admin (first user is considered admin)
        if current_user.id != 1:
            return jsonify({'error': '权限不足'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': '用户不存在'}), 404
        
        # Activate user
        user.is_active = True
        if user.personnel:
            user.personnel.is_active = True
        
        db.session.commit()
        
        return jsonify({'message': '用户审核通过'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'审核失败: {str(e)}'}), 500

@auth_bp.route('/api/auth/users/<int:user_id>/reject', methods=['POST'])
@login_required
def reject_user(user_id):
    """Reject a user (admin only)"""
    try:
        # Check if current user is admin (first user is considered admin)
        if current_user.id != 1:
            return jsonify({'error': '权限不足'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': '用户不存在'}), 404
        
        # Delete user and personnel
        if user.personnel:
            db.session.delete(user.personnel)
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': '用户已拒绝并删除'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'拒绝失败: {str(e)}'}), 500

@auth_bp.route('/api/auth/users/<int:user_id>/status', methods=['PUT'])
@login_required
def update_user_status(user_id):
    """Update user status (admin only)"""
    try:
        # Check if current user is admin (first user is considered admin)
        if current_user.id != 1:
            return jsonify({'error': '权限不足'}), 403
        
        data = request.get_json()
        new_status = data.get('is_active')
        
        if new_status is None:
            return jsonify({'error': '状态不能为空'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': '用户不存在'}), 404
        
        # Update user status
        user.is_active = new_status
        if user.personnel:
            user.personnel.is_active = new_status
        
        db.session.commit()
        
        return jsonify({'message': '用户状态更新成功'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'状态更新失败: {str(e)}'}), 500
