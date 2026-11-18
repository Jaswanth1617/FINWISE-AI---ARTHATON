from datetime import datetime, timezone
import uuid
from app.extensions import db

class Business(db.Model):
    __tablename__ = 'businesses'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    business_name = db.Column(db.String(150), nullable=False)
    gstin = db.Column(db.String(20), nullable=True) # Indian GST identification number format
    industry = db.Column(db.String(80), nullable=True)
    state = db.Column(db.String(60), nullable=True) # For intra-state vs inter-state GST (CGST+SGST vs IGST)
    address = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    transactions = db.relationship('BusinessTransaction', backref='business', cascade='all, delete-orphan', lazy='dynamic')
    invoices = db.relationship('Invoice', backref='business', cascade='all, delete-orphan', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'business_name': self.business_name,
            'gstin': self.gstin or '',
            'industry': self.industry or '',
            'state': self.state or '',
            'address': self.address or '',
            'created_at': self.created_at.isoformat()
        }


class BusinessTransaction(db.Model):
    __tablename__ = 'business_transactions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = db.Column(db.String(36), db.ForeignKey('businesses.id', ondelete='CASCADE'), nullable=False, index=True)
    transaction_date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(20), nullable=False) # REVENUE, EXPENSE
    category = db.Column(db.String(60), nullable=False) # Raw Material, Payroll, Utilities, Sales, Marketing
    amount = db.Column(db.Numeric(14, 2), nullable=False)
    gst_rate_percent = db.Column(db.Numeric(5, 2), default=18.0)
    gst_amount = db.Column(db.Numeric(14, 2), default=0.0)
    is_interstate = db.Column(db.Boolean, default=False) # CGST+SGST vs IGST
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'transaction_date': self.transaction_date.isoformat() if self.transaction_date else None,
            'description': self.description,
            'type': self.type,
            'category': self.category,
            'amount': float(self.amount),
            'gst_rate_percent': float(self.gst_rate_percent or 0.0),
            'gst_amount': float(self.gst_amount or 0.0),
            'is_interstate': self.is_interstate,
            'created_at': self.created_at.isoformat()
        }


class Invoice(db.Model):
    __tablename__ = 'invoices'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = db.Column(db.String(36), db.ForeignKey('businesses.id', ondelete='CASCADE'), nullable=False, index=True)
    invoice_number = db.Column(db.String(50), nullable=False)
    client_name = db.Column(db.String(120), nullable=False)
    client_gstin = db.Column(db.String(20), nullable=True)
    client_state = db.Column(db.String(60), nullable=True)
    client_email = db.Column(db.String(120), nullable=True)
    
    invoice_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    
    subtotal = db.Column(db.Numeric(14, 2), nullable=False)
    tax_rate = db.Column(db.Numeric(5, 2), default=18.0)
    cgst_amount = db.Column(db.Numeric(14, 2), default=0.0)
    sgst_amount = db.Column(db.Numeric(14, 2), default=0.0)
    igst_amount = db.Column(db.Numeric(14, 2), default=0.0)
    total_amount = db.Column(db.Numeric(14, 2), nullable=False)
    
    items = db.Column(db.JSON, nullable=False) # List of invoice line items
    status = db.Column(db.String(20), default='PENDING') # PENDING, PAID, OVERDUE, CANCELLED
    pdf_path = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'invoice_number': self.invoice_number,
            'client_name': self.client_name,
            'client_gstin': self.client_gstin or '',
            'client_state': self.client_state or '',
            'client_email': self.client_email or '',
            'invoice_date': self.invoice_date.isoformat() if self.invoice_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'subtotal': float(self.subtotal),
            'tax_rate': float(self.tax_rate),
            'cgst_amount': float(self.cgst_amount or 0.0),
            'sgst_amount': float(self.sgst_amount or 0.0),
            'igst_amount': float(self.igst_amount or 0.0),
            'total_amount': float(self.total_amount),
            'items': self.items or [],
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }


class TaxCalculation(db.Model):
    __tablename__ = 'tax_calculations'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    financial_year = db.Column(db.String(10), nullable=False) # e.g. "2024-25"
    assessment_year = db.Column(db.String(10), nullable=False) # e.g. "2025-26"
    gross_annual_income = db.Column(db.Numeric(14, 2), nullable=False)
    
    # Deductions
    deduction_80c = db.Column(db.Numeric(14, 2), default=0.0)
    deduction_80d = db.Column(db.Numeric(14, 2), default=0.0)
    hra_exemption = db.Column(db.Numeric(14, 2), default=0.0)
    standard_deduction = db.Column(db.Numeric(14, 2), default=75000.0)
    other_deductions = db.Column(db.Numeric(14, 2), default=0.0)
    
    # Computed liabilities
    old_regime_tax = db.Column(db.Numeric(14, 2), nullable=False)
    new_regime_tax = db.Column(db.Numeric(14, 2), nullable=False)
    recommended_regime = db.Column(db.String(20), nullable=False) # "New Regime" or "Old Regime"
    tax_savings = db.Column(db.Numeric(14, 2), default=0.0)
    computation_breakdown = db.Column(db.JSON, nullable=True) # Full slab breakdown
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'financial_year': self.financial_year,
            'assessment_year': self.assessment_year,
            'gross_annual_income': float(self.gross_annual_income),
            'deduction_80c': float(self.deduction_80c or 0.0),
            'deduction_80d': float(self.deduction_80d or 0.0),
            'hra_exemption': float(self.hra_exemption or 0.0),
            'standard_deduction': float(self.standard_deduction or 0.0),
            'old_regime_tax': float(self.old_regime_tax),
            'new_regime_tax': float(self.new_regime_tax),
            'recommended_regime': self.recommended_regime,
            'tax_savings': float(self.tax_savings or 0.0),
            'computation_breakdown': self.computation_breakdown or {},
            'created_at': self.created_at.isoformat()
        }
