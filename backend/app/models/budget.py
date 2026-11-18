from datetime import datetime, timezone
import uuid
from app.extensions import db

class Budget(db.Model):
    __tablename__ = 'budgets'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    month = db.Column(db.Integer, nullable=False) # 1-12
    year = db.Column(db.Integer, nullable=False)
    total_income = db.Column(db.Numeric(14, 2), default=0.00)
    total_budgeted = db.Column(db.Numeric(14, 2), default=0.00)
    savings_target = db.Column(db.Numeric(14, 2), default=0.00)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    categories = db.relationship('BudgetCategory', backref='budget', cascade='all, delete-orphan', lazy='joined')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'month': self.month,
            'year': self.year,
            'total_income': float(self.total_income or 0.0),
            'total_budgeted': float(self.total_budgeted or 0.0),
            'savings_target': float(self.savings_target or 0.0),
            'notes': self.notes,
            'categories': [cat.to_dict() for cat in self.categories],
            'created_at': self.created_at.isoformat()
        }


class BudgetCategory(db.Model):
    __tablename__ = 'budget_categories'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    budget_id = db.Column(db.String(36), db.ForeignKey('budgets.id', ondelete='CASCADE'), nullable=False, index=True)
    category_name = db.Column(db.String(60), nullable=False)
    allocated_amount = db.Column(db.Numeric(14, 2), nullable=False, default=0.00)
    alert_threshold_percent = db.Column(db.Integer, default=80) # Alert user when 80% spent

    def to_dict(self):
        return {
            'id': self.id,
            'budget_id': self.budget_id,
            'category_name': self.category_name,
            'allocated_amount': float(self.allocated_amount),
            'alert_threshold_percent': self.alert_threshold_percent
        }
