from datetime import datetime, timezone
import uuid
from app.extensions import db

class FinancialReport(db.Model):
    __tablename__ = 'financial_reports'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    report_title = db.Column(db.String(150), nullable=False)
    report_type = db.Column(db.String(50), nullable=False) # MONTHLY_FINANCIAL, EXPENSE_ANALYSIS, FRAUD_ANALYSIS, BUDGET_PERFORMANCE, LOAN_REPAYMENT, INVESTMENT_SUMMARY, BUSINESS_CASHFLOW
    file_format = db.Column(db.String(10), default='PDF') # PDF, CSV
    file_path = db.Column(db.String(255), nullable=True)
    file_size_bytes = db.Column(db.Integer, default=0)
    parameters = db.Column(db.JSON, nullable=True) # Filters, date ranges, etc.
    summary_data = db.Column(db.JSON, nullable=True) # Key metrics snapshot
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'report_title': self.report_title,
            'report_type': self.report_type,
            'file_format': self.file_format,
            'file_path': self.file_path,
            'file_size_bytes': self.file_size_bytes,
            'parameters': self.parameters or {},
            'summary_data': self.summary_data or {},
            'created_at': self.created_at.isoformat()
        }


class ChatbotConversation(db.Model):
    __tablename__ = 'chatbot_conversations'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(150), default='Financial Consultation')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    messages = db.relationship('ChatbotMessage', backref='conversation', cascade='all, delete-orphan', order_by='ChatbotMessage.created_at')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'messages': [m.to_dict() for m in self.messages]
        }


class ChatbotMessage(db.Model):
    __tablename__ = 'chatbot_messages'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = db.Column(db.String(36), db.ForeignKey('chatbot_conversations.id', ondelete='CASCADE'), nullable=False, index=True)
    role = db.Column(db.String(20), nullable=False) # user, assistant, system
    content = db.Column(db.Text, nullable=False)
    sources_used = db.Column(db.JSON, nullable=True) # References to user's transactions / accounts queried
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'role': self.role,
            'content': self.content,
            'sources_used': self.sources_used or [],
            'created_at': self.created_at.isoformat()
        }
