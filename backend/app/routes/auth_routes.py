from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, date, timezone
from app.extensions import db
from app.models.user import User, UserProfile
from app.models.transaction import FinancialAccount, Transaction
from app.models.budget import Budget, BudgetCategory
from app.utils.validators import validate_email, validate_password_strength
from app.utils.security import log_audit_event

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
    Populate realistic demo transactions, accounts, and budgets for hackathon presentation.
    All records explicitly tagged with is_demo=True.
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'status': 'error', 'message': 'User not found.'}), 404

    # Create account if missing
    account = FinancialAccount.query.filter_by(user_id=user_id).first()
    if not account:
        account = FinancialAccount(
            user_id=user_id,
            account_name="Primary Savings Account",
            institution_name="HDFC Bank",
            account_mask="XXXX7812",
            current_balance=84250.00
        )
        db.session.add(account)
        db.session.flush()

    # Clear existing demo transactions to avoid repeats
    Transaction.query.filter_by(user_id=user_id, is_demo=True).delete()

    today = date.today()
    y = today.year
    m = today.month

    sample_txs = [
        (date(y, m, max(1, min(1, 28))), "Salary Credit - TechCorp Solutions", "Salary", "CREDIT", 75000.00, 115000.00, False, None),
        (date(y, m, max(1, min(2, 28))), "House Rent Transfer - Landlord", "Rent", "DEBIT", 20000.00, 95000.00, False, None),
        (date(y, m, max(1, min(3, 28))), "Swiggy Online Food Order", "Food", "DEBIT", 640.00, 94360.00, False, None),
        (date(y, m, max(1, min(4, 28))), "Uber Bangalore Ride", "Transportation", "DEBIT", 420.00, 93940.00, False, None),
        (date(y, m, max(1, min(5, 28))), "Amazon India Electronics Purchase", "Shopping", "DEBIT", 3499.00, 90441.00, False, None),
        (date(y, m, max(1, min(7, 28))), "Zomato Dineout Meal", "Food", "DEBIT", 1250.00, 89191.00, False, None),
        (date(y, m, max(1, min(8, 28))), "Bescom Electricity Bill Payment", "Bills", "DEBIT", 1850.00, 87341.00, False, None),
        (date(y, m, max(1, min(10, 28))), "HDFC Home Loan EMI AutoDebit", "EMI", "DEBIT", 18500.00, 68841.00, False, None),
        (date(y, m, max(1, min(12, 28))), "Zerodha SIP Equity Investment", "Investments", "DEBIT", 10000.00, 58841.00, False, None),
        (date(y, m, max(1, min(14, 28))), "Apollo Pharmacy Medicine", "Healthcare", "DEBIT", 890.00, 57951.00, False, None),
        (date(y, m, max(1, min(15, 28))), "Netflix Monthly Subscription", "Entertainment", "DEBIT", 649.00, 57302.00, False, None),
        (date(y, m, max(1, min(16, 28))), "Unusual High Debit - Card Withdrawal International ATM", "Other", "DEBIT", 45000.00, 12302.00, True, "Statistical outlier: 6.8x higher than average debit"),
        (date(y, m, max(1, min(17, 28))), "Swiggy Online Food Order Duplicate", "Food", "DEBIT", 640.00, 11662.00, True, "Potential duplicate transaction detected on same merchant"),
    ]

    for tx_date, desc, cat, tx_type, amt, bal, susp, susp_reason in sample_txs:
        tx = Transaction(
            user_id=user_id,
            account_id=account.id,
            transaction_date=tx_date,
            description=desc,
            normalized_description=desc,
            category=cat,
            transaction_type=tx_type,
            amount=amt,
            balance_after=bal,
            is_suspicious=susp,
            suspicion_reason=susp_reason,
            is_demo=True
        )
        db.session.add(tx)

    # Seed demo budget for current month
    existing_budget = Budget.query.filter_by(user_id=user_id, month=m, year=y).first()
    if not existing_budget:
        b = Budget(
            user_id=user_id,
            month=m,
            year=y,
            total_income=75000.0,
            total_budgeted=54000.0,
            savings_target=21000.0,
            notes=f"Active Demo Budget ({m}/{y})"
        )
        db.session.add(b)
        db.session.flush()

        cats = [
            ("Food", 8000.0),
            ("Rent", 20000.0),
            ("Shopping", 5000.0),
            ("Bills", 3000.0),
            ("EMI", 18500.0)
        ]
        for cname, alloc in cats:
            db.session.add(BudgetCategory(budget_id=b.id, category_name=cname, allocated_amount=alloc))

    db.session.commit()
    log_audit_event(user_id, 'DEMO_DATA_SEEDED', 'User', user_id)

    return jsonify({
        'status': 'success',
        'message': 'Realistic demonstration financial dataset seeded successfully.'
    }), 200
