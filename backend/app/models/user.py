from datetime import datetime, timezone
import uuid
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(30), nullable=False, default='Individual')  # Individual, Student, Small Business Owner, Administrator
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    profile = db.relationship('UserProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    accounts = db.relationship('FinancialAccount', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    transactions = db.relationship('Transaction', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    budgets = db.relationship('Budget', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    fraud_analyses = db.relationship('FraudAnalysis', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    loans = db.relationship('LoanRecord', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    portfolios = db.relationship('InvestmentPortfolio', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    tax_calculations = db.relationship('TaxCalculation', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    businesses = db.relationship('Business', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    reports = db.relationship('FinancialReport', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    conversations = db.relationship('ChatbotConversation', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    notifications = db.relationship('Notification', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    audit_logs = db.relationship('AuditLog', backref='user', cascade='all, delete-orphan', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'profile': self.profile.to_dict() if self.profile else None
        }


class UserProfile(db.Model):
    __tablename__ = 'user_profiles'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    full_name = db.Column(db.String(120), nullable=True)
    phone_number = db.Column(db.String(20), nullable=True)
    occupation = db.Column(db.String(80), nullable=True)
    annual_income = db.Column(db.Numeric(14, 2), default=0.00)
    risk_tolerance = db.Column(db.String(30), default='Moderate') # Conservative, Moderate, Aggressive
    currency = db.Column(db.String(10), default='INR')
    avatar_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'full_name': self.full_name or '',
            'phone_number': self.phone_number or '',
            'occupation': self.occupation or '',
            'annual_income': float(self.annual_income or 0.0),
            'risk_tolerance': self.risk_tolerance,
            'currency': self.currency,
            'avatar_url': self.avatar_url
        }


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(40), default='info') # info, warning, danger, success
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat()
        }


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    action = db.Column(db.String(100), nullable=False)
    resource_type = db.Column(db.String(60), nullable=False)
    resource_id = db.Column(db.String(60), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    details = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'created_at': self.created_at.isoformat()
        }
