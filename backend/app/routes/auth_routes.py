from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, date, timezone
from app.extensions import db
from app.models.user import User, UserProfile
from app.models.transaction import FinancialAccount, Transaction
from app.models.budget import Budget, BudgetCategory
from app.utils.validators import validate_email, validate_password_strength
from app.utils.security import log_audit_event
from app.utils.seeder import seed_hardcoded_user_data

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    role = data.get('role', 'Individual')
    full_name = data.get('full_name', '').strip()

    if not validate_email(email):
        return jsonify({'status': 'error', 'message': 'Invalid email address format.'}), 400

    if not username or len(username) < 3:
        return jsonify({'status': 'error', 'message': 'Username must be at least 3 characters.'}), 400

    is_valid_pw, pw_msg = validate_password_strength(password)
    if not is_valid_pw:
        return jsonify({'status': 'error', 'message': pw_msg}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'status': 'error', 'message': 'An account with this email already exists.'}), 409

    if User.query.filter_by(username=username).first():
        return jsonify({'status': 'error', 'message': 'Username is already taken.'}), 409

    valid_roles = ['Individual', 'Student', 'Small Business Owner', 'Administrator']
    if role not in valid_roles:
        role = 'Individual'

    user = User(email=email, username=username, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    profile = UserProfile(
        user_id=user.id,
        full_name=full_name or username,
        annual_income=float(data.get('annual_income', 0.0))
    )
    db.session.add(profile)
    db.session.commit()

    # Pre-populate complete hardcoded data for the user
    try:
        seed_hardcoded_user_data(user.id)
    except Exception as e:
        print(f"Notice during user seeding: {e}")

    log_audit_event(user.id, 'USER_REGISTERED', 'User', user.id, f"Role: {role}")

    # Generate JWT
    token_claims = {'role': user.role, 'username': user.username}
    access_token = create_access_token(identity=user.id, additional_claims=token_claims)
    refresh_token = create_refresh_token(identity=user.id, additional_claims=token_claims)

    return jsonify({
        'status': 'success',
        'message': 'User registered successfully.',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    login_id = data.get('login', '').strip().lower() # Can be email or username
    password = data.get('password', '')

    if not login_id or not password:
        return jsonify({'status': 'error', 'message': 'Email/username and password are required.'}), 400

    user = User.query.filter((User.email == login_id) | (User.username == login_id)).first()
    if not user or not user.check_password(password):
        return jsonify({'status': 'error', 'message': 'Invalid credentials.'}), 401

    if not user.is_active:
        return jsonify({'status': 'error', 'message': 'Account is deactivated.'}), 403

    token_claims = {'role': user.role, 'username': user.username}
    access_token = create_access_token(identity=user.id, additional_claims=token_claims)
    refresh_token = create_refresh_token(identity=user.id, additional_claims=token_claims)

    log_audit_event(user.id, 'USER_LOGIN', 'User', user.id)

    # Ensure user has complete realistic hardcoded data if empty
    try:
        if Transaction.query.filter_by(user_id=user.id).count() == 0:
            seed_hardcoded_user_data(user.id)
    except Exception as e:
        print(f"Notice during login data priming: {e}")

    return jsonify({
        'status': 'success',
        'message': 'Logged in successfully.',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    user_id = get_jwt_identity()
    log_audit_event(user_id, 'USER_LOGOUT', 'User', user_id)
    return jsonify({'status': 'success', 'message': 'Logged out successfully.'}), 200

@auth_bp.route('/profile', methods=['GET', 'PUT'])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'status': 'error', 'message': 'User not found.'}), 404

    if request.method == 'GET':
        return jsonify({'status': 'success', 'user': user.to_dict()}), 200

    # PUT update profile
    data = request.get_json() or {}
    if not user.profile:
        user.profile = UserProfile(user_id=user.id)

    if 'full_name' in data:
        user.profile.full_name = data['full_name'].strip()
    if 'phone_number' in data:
        user.profile.phone_number = data['phone_number'].strip()
    if 'occupation' in data:
        user.profile.occupation = data['occupation'].strip()
    if 'annual_income' in data:
        user.profile.annual_income = float(data['annual_income'])
    if 'risk_tolerance' in data:
        user.profile.risk_tolerance = data['risk_tolerance']
    if 'currency' in data:
        user.profile.currency = data['currency']

    db.session.commit()
    log_audit_event(user.id, 'PROFILE_UPDATED', 'UserProfile', user.profile.id)

    return jsonify({'status': 'success', 'message': 'Profile updated successfully.', 'user': user.to_dict()}), 200

@auth_bp.route('/seed-demo-data', methods=['POST'])
@jwt_required()
def seed_demo_data():
    """
    Populate realistic demo transactions, accounts, budgets, loans, and investments across all 9 modules.
    All records explicitly tagged with is_demo=True.
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'status': 'error', 'message': 'User not found.'}), 404

    seed_hardcoded_user_data(user_id)
    log_audit_event(user_id, 'DEMO_DATA_SEEDED', 'User', user_id)

    return jsonify({
        'status': 'success',
        'message': 'Comprehensive realistic fintech dataset seeded successfully across all modules.'
    }), 200
