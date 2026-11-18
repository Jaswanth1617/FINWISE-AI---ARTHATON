from datetime import datetime, timezone
import uuid
from app.extensions import db

class InvestmentPortfolio(db.Model):
    __tablename__ = 'investment_portfolios'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    portfolio_name = db.Column(db.String(100), nullable=False)
    risk_level = db.Column(db.String(30), default='Moderate') # Conservative, Moderate, Aggressive
    total_invested = db.Column(db.Numeric(14, 2), default=0.00)
    current_value = db.Column(db.Numeric(14, 2), default=0.00)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    assets = db.relationship('InvestmentAsset', backref='portfolio', cascade='all, delete-orphan', lazy='joined')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'portfolio_name': self.portfolio_name,
            'risk_level': self.risk_level,
            'total_invested': float(self.total_invested or 0.0),
            'current_value': float(self.current_value or 0.0),
            'notes': self.notes,
            'assets': [a.to_dict() for a in self.assets],
            'created_at': self.created_at.isoformat()
        }


class InvestmentAsset(db.Model):
    __tablename__ = 'investment_assets'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    portfolio_id = db.Column(db.String(36), db.ForeignKey('investment_portfolios.id', ondelete='CASCADE'), nullable=False, index=True)
    asset_name = db.Column(db.String(100), nullable=False) # e.g. "Nifty 50 Index Fund"
    asset_type = db.Column(db.String(40), nullable=False) # Mutual Fund, Index Fund, Equity, Fixed Deposit, Gold, Bonds
    invested_amount = db.Column(db.Numeric(14, 2), nullable=False)
    current_market_value = db.Column(db.Numeric(14, 2), nullable=True)
    allocation_percentage = db.Column(db.Numeric(5, 2), default=0.0)
    expected_cagr = db.Column(db.Numeric(5, 2), default=12.0)
    purchase_date = db.Column(db.Date, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'portfolio_id': self.portfolio_id,
            'asset_name': self.asset_name,
            'asset_type': self.asset_type,
            'invested_amount': float(self.invested_amount),
            'current_market_value': float(self.current_market_value) if self.current_market_value is not None else float(self.invested_amount),
            'allocation_percentage': float(self.allocation_percentage or 0.0),
            'expected_cagr': float(self.expected_cagr or 0.0),
            'purchase_date': self.purchase_date.isoformat() if self.purchase_date else None
        }
