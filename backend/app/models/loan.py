from datetime import datetime, timezone
import uuid
from app.extensions import db

class LoanRecord(db.Model):
    __tablename__ = 'loan_records'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    loan_name = db.Column(db.String(100), nullable=False) # Home Loan, Personal Loan, Education Loan
    loan_type = db.Column(db.String(50), nullable=False)
    principal_amount = db.Column(db.Numeric(14, 2), nullable=False)
    annual_interest_rate = db.Column(db.Numeric(5, 2), nullable=False) # e.g. 8.50%
    tenure_months = db.Column(db.Integer, nullable=False) # e.g. 240
    calculated_emi = db.Column(db.Numeric(14, 2), nullable=False)
    total_interest = db.Column(db.Numeric(14, 2), nullable=False)
    total_payment = db.Column(db.Numeric(14, 2), nullable=False)
    start_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    schedules = db.relationship('LoanSchedule', backref='loan', cascade='all, delete-orphan', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'loan_name': self.loan_name,
            'loan_type': self.loan_type,
            'principal_amount': float(self.principal_amount),
            'annual_interest_rate': float(self.annual_interest_rate),
            'tenure_months': self.tenure_months,
            'calculated_emi': float(self.calculated_emi),
            'total_interest': float(self.total_interest),
            'total_payment': float(self.total_payment),
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'created_at': self.created_at.isoformat()
        }


class LoanSchedule(db.Model):
    __tablename__ = 'loan_schedules'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    loan_id = db.Column(db.String(36), db.ForeignKey('loan_records.id', ondelete='CASCADE'), nullable=False, index=True)
    installment_number = db.Column(db.Integer, nullable=False)
    payment_date = db.Column(db.Date, nullable=True)
    beginning_balance = db.Column(db.Numeric(14, 2), nullable=False)
    emi_amount = db.Column(db.Numeric(14, 2), nullable=False)
    principal_component = db.Column(db.Numeric(14, 2), nullable=False)
    interest_component = db.Column(db.Numeric(14, 2), nullable=False)
    ending_balance = db.Column(db.Numeric(14, 2), nullable=False)

    def to_dict(self):
        return {
            'installment_number': self.installment_number,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'beginning_balance': float(self.beginning_balance),
            'emi_amount': float(self.emi_amount),
            'principal_component': float(self.principal_component),
            'interest_component': float(self.interest_component),
            'ending_balance': float(self.ending_balance)
        }
