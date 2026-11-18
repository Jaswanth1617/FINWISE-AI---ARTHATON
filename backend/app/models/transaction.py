from datetime import datetime, timezone
import uuid
from app.extensions import db

class FinancialAccount(db.Model):
    __tablename__ = 'financial_accounts'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    account_name = db.Column(db.String(100), nullable=False) # e.g. "HDFC Salary Account"
    account_type = db.Column(db.String(50), default='Savings') # Savings, Current, Credit Card, Investment
    institution_name = db.Column(db.String(100), nullable=True) # e.g. "HDFC Bank"
    account_mask = db.Column(db.String(10), nullable=True) # e.g. "XXXX1234" (no full account numbers stored!)
    currency = db.Column(db.String(10), default='INR')
    current_balance = db.Column(db.Numeric(14, 2), default=0.00)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    transactions = db.relationship('Transaction', backref='account', cascade='all, delete-orphan', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'account_name': self.account_name,
            'account_type': self.account_type,
            'institution_name': self.institution_name,
            'account_mask': self.account_mask,
            'currency': self.currency,
            'current_balance': float(self.current_balance or 0.0),
            'created_at': self.created_at.isoformat()
        }


class UploadedDocument(db.Model):
    __tablename__ = 'uploaded_documents'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(20), nullable=False) # pdf, csv, xlsx
    file_size_bytes = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(30), default='PROCESSING') # PROCESSING, PROCESSED, FAILED
    error_message = db.Column(db.Text, nullable=True)
    records_extracted = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    transactions = db.relationship('Transaction', backref='document', cascade='all, delete-orphan', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_type': self.file_type,
            'file_size_bytes': self.file_size_bytes,
            'status': self.status,
            'error_message': self.error_message,
            'records_extracted': self.records_extracted,
            'created_at': self.created_at.isoformat()
        }


class TransactionCategory(db.Model):
    __tablename__ = 'transaction_categories'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(60), unique=True, nullable=False)
    icon = db.Column(db.String(50), default='Tag')
    color = db.Column(db.String(20), default='#64748B')
    is_system = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'icon': self.icon,
            'color': self.color,
            'is_system': self.is_system
        }


class Transaction(db.Model):
    __tablename__ = 'transactions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    account_id = db.Column(db.String(36), db.ForeignKey('financial_accounts.id', ondelete='SET NULL'), nullable=True, index=True)
    document_id = db.Column(db.String(36), db.ForeignKey('uploaded_documents.id', ondelete='SET NULL'), nullable=True, index=True)
    
    transaction_date = db.Column(db.Date, nullable=False, index=True)
    description = db.Column(db.String(255), nullable=False)
    normalized_description = db.Column(db.String(255), nullable=True)
    
    transaction_type = db.Column(db.String(20), nullable=False) # DEBIT, CREDIT
    amount = db.Column(db.Numeric(14, 2), nullable=False)
    balance_after = db.Column(db.Numeric(14, 2), nullable=True)
    
    category = db.Column(db.String(60), default='Other', index=True) # Food, Shopping, etc.
    is_suspicious = db.Column(db.Boolean, default=False, index=True)
    suspicion_reason = db.Column(db.String(255), nullable=True)
    
    is_duplicate = db.Column(db.Boolean, default=False)
    is_demo = db.Column(db.Boolean, default=False) # Clearly labelled demonstration data
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'account_id': self.account_id,
            'document_id': self.document_id,
            'transaction_date': self.transaction_date.isoformat() if self.transaction_date else None,
            'description': self.description,
            'normalized_description': self.normalized_description or self.description,
            'transaction_type': self.transaction_type,
            'amount': float(self.amount),
            'balance_after': float(self.balance_after) if self.balance_after is not None else None,
            'category': self.category,
            'is_suspicious': self.is_suspicious,
            'suspicion_reason': self.suspicion_reason,
            'is_duplicate': self.is_duplicate,
            'is_demo': self.is_demo,
            'created_at': self.created_at.isoformat()
        }
