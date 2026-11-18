from datetime import datetime, timezone
import uuid
from app.extensions import db

class FraudAnalysis(db.Model):
    __tablename__ = 'fraud_analyses'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    analysis_type = db.Column(db.String(30), nullable=False) # MESSAGE, URL, TRANSACTION
    target_input = db.Column(db.Text, nullable=False) # Redacted or safe preview of the text / URL / tx ref
    
    risk_score = db.Column(db.Integer, nullable=False) # 0 to 100
    risk_category = db.Column(db.String(20), nullable=False) # Low, Medium, High, Critical
    
    indicators = db.Column(db.JSON, nullable=True) # List of detected patterns / flags
    deterministic_evidence = db.Column(db.JSON, nullable=True) # Rule-based heuristics detected
    ml_confidence = db.Column(db.Float, nullable=True) # IsolationForest / Classifier confidence score
    ai_explanation = db.Column(db.Text, nullable=True) # Natural language breakdown by Groq / rule fallback
    recommendation = db.Column(db.Text, nullable=True) # Safety actions recommended
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'analysis_type': self.analysis_type,
            'target_input': self.target_input,
            'risk_score': self.risk_score,
            'risk_category': self.risk_category,
            'indicators': self.indicators or [],
            'deterministic_evidence': self.deterministic_evidence or {},
            'ml_confidence': self.ml_confidence,
            'ai_explanation': self.ai_explanation,
            'recommendation': self.recommendation,
            'created_at': self.created_at.isoformat()
        }


class SuspiciousMessage(db.Model):
    __tablename__ = 'suspicious_messages'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    sender_identifier = db.Column(db.String(100), nullable=True) # e.g. "VM-HDFCBK-ALERT"
    message_content = db.Column(db.Text, nullable=False)
    channel = db.Column(db.String(30), default='SMS') # SMS, WhatsApp, Email, UPI
    status = db.Column(db.String(30), default='ANALYZED') # PENDING, ANALYZED, REPORTED
    analysis_id = db.Column(db.String(36), db.ForeignKey('fraud_analyses.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'sender_identifier': self.sender_identifier,
            'message_content': self.message_content,
            'channel': self.channel,
            'status': self.status,
            'analysis_id': self.analysis_id,
            'created_at': self.created_at.isoformat()
        }
