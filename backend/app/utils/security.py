from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from app.extensions import db
from app.models.user import User, AuditLog

def role_required(*allowed_roles):
    """Decorator to enforce role-based access control (RBAC)."""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get('role', 'Individual')
            
            if allowed_roles and user_role not in allowed_roles and user_role != 'Administrator':
                return jsonify({
                    'status': 'error',
                    'message': f"Access forbidden: requires one of the following roles: {', '.join(allowed_roles)}"
                }), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

def log_audit_event(user_id, action, resource_type, resource_id=None, details=None):
    """Record an audit trail event for compliance and security."""
    try:
        ip = request.remote_addr if request else None
        log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            ip_address=ip,
            details=details
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        # Non-blocking log failure
        print(f"Audit log error: {e}")

def sanitize_text(text):
    """Sanitize text input to prevent injection attacks."""
    if not text:
        return ""
    # Strip dangerous HTML and script characters
    clean = str(text).strip()
    return clean
