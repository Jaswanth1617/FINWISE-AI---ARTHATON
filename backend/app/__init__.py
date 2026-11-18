import os
from flask import Flask, jsonify
from app.config import config
from app.extensions import db, migrate, jwt, cors
import app.models as app_models  # Avoid shadowing local variable 'app'

def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    flask_app = Flask(__name__)
    flask_app.config.from_object(config.get(config_name, config['default']))

    # Initialize extensions
    db.init_app(flask_app)
    migrate.init_app(flask_app, db)
    jwt.init_app(flask_app)
    cors.init_app(flask_app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Register blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.dashboard_routes import dashboard_bp
    from app.routes.financial_routes import financial_bp
    from app.routes.fraud_routes import fraud_bp
    from app.routes.budget_routes import budget_bp
    from app.routes.loan_routes import loan_bp
    from app.routes.investment_routes import investment_bp
    from app.routes.tax_routes import tax_bp
    from app.routes.business_routes import business_bp
    from app.routes.news_routes import news_bp
    from app.routes.assistant_routes import assistant_bp
    from app.routes.report_routes import report_bp

    flask_app.register_blueprint(auth_bp)
    flask_app.register_blueprint(dashboard_bp)
    flask_app.register_blueprint(financial_bp)
    flask_app.register_blueprint(fraud_bp)
    flask_app.register_blueprint(budget_bp)
    flask_app.register_blueprint(loan_bp)
    flask_app.register_blueprint(investment_bp)
    flask_app.register_blueprint(tax_bp)
    flask_app.register_blueprint(business_bp)
    flask_app.register_blueprint(news_bp)
    flask_app.register_blueprint(assistant_bp)
    flask_app.register_blueprint(report_bp)

    # Health check route
    @flask_app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'product': 'FINWISE AI',
            'version': '1.0.0',
            'database': 'connected',
            'groq_configured': bool(flask_app.config.get('GROQ_API_KEY'))
        }), 200

    # Global error handlers
    @flask_app.errorhandler(400)
    def bad_request(e):
        return jsonify({'status': 'error', 'message': str(e)}), 400

    @flask_app.errorhandler(404)
    def not_found(e):
        return jsonify({'status': 'error', 'message': 'API endpoint not found.'}), 404

    @flask_app.errorhandler(500)
    def internal_server_error(e):
        return jsonify({'status': 'error', 'message': 'Internal financial processing error.'}), 500

    # Auto-create tables in development mode if not present
    with flask_app.app_context():
        try:
            db.create_all()
        except Exception as e:
            print(f"Database initialization notice: {e}")

    return flask_app
