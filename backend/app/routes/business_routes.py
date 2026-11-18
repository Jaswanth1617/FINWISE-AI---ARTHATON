import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from app.extensions import db
from app.models.business import Business, BusinessTransaction, Invoice
from app.utils.calculations import calculate_gst
from app.services.report_service import generate_pdf_report

business_bp = Blueprint('business', __name__, url_prefix='/api/business')

@business_bp.route('/profile', methods=['GET', 'POST'])
@jwt_required()
def handle_business_profile():
    user_id = get_jwt_identity()
    biz = Business.query.filter_by(user_id=user_id).first()

    if request.method == 'POST':
        data = request.get_json() or {}
        bname = data.get('business_name', 'My Enterprise')
        gstin = data.get('gstin', '')
        industry = data.get('industry', 'Services')
        state = data.get('state', 'Karnataka')
        addr = data.get('address', '')

        if not biz:
            biz = Business(
                user_id=user_id,
                business_name=bname,
                gstin=gstin,
                industry=industry,
                state=state,
                address=addr
            )
            db.session.add(biz)
        else:
            biz.business_name = bname
            biz.gstin = gstin
            biz.industry = industry
            biz.state = state
            biz.address = addr

        db.session.commit()
        return jsonify({'status': 'success', 'business': biz.to_dict()}), 200

    if not biz:
        # Create default demo business
        biz = Business(
            user_id=user_id,
            business_name="Apex Digital Solutions Pvt Ltd",
            gstin="29ABCDE1234F1Z5",
            industry="IT Services & Consulting",
            state="Karnataka",
            address="Level 4, Embassy Tech Village, Bangalore, Karnataka 560103"
        )
        db.session.add(biz)
        db.session.commit()

    return jsonify({'status': 'success', 'business': biz.to_dict()}), 200

@business_bp.route('/invoices', methods=['GET', 'POST'])
@jwt_required()
def handle_invoices():
    user_id = get_jwt_identity()
    biz = Business.query.filter_by(user_id=user_id).first()
    if not biz:
        return jsonify({'status': 'error', 'message': 'Business profile required.'}), 400

    if request.method == 'POST':
        data = request.get_json() or {}
        client_name = data.get('client_name', 'Client Corp')
        client_state = data.get('client_state', biz.state or 'Karnataka')
        items = data.get('items', [{'description': 'Consulting Services', 'quantity': 1, 'rate': 50000.0}])
        tax_rate = float(data.get('tax_rate', 18.0))

        subtotal = sum(float(item.get('quantity', 1)) * float(item.get('rate', 0.0)) for item in items)
        is_interstate = (client_state.strip().lower() != (biz.state or '').strip().lower())
        gst_calc = calculate_gst(subtotal, tax_rate, is_interstate)

        inv_num = f"INV-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"
        inv_date = date.today()
        due_date = date.today()

        invoice = Invoice(
            business_id=biz.id,
            invoice_number=inv_num,
            client_name=client_name,
            client_gstin=data.get('client_gstin', ''),
            client_state=client_state,
            client_email=data.get('client_email', ''),
            invoice_date=inv_date,
            due_date=due_date,
            subtotal=subtotal,
            tax_rate=tax_rate,
            cgst_amount=gst_calc['cgst'],
            sgst_amount=gst_calc['sgst'],
            igst_amount=gst_calc['igst'],
            total_amount=gst_calc['grand_total'],
            items=items,
            status='PENDING'
        )
        db.session.add(invoice)
        db.session.commit()

        # Generate PDF invoice
        output_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'invoices')
        pdf_filename = f"{inv_num}.pdf"
        
        table_headers = ["Item Description", "Qty", "Unit Rate (₹)", "Amount (₹)"]
        table_rows = []
        for it in items:
            q = float(it.get('quantity', 1))
            r = float(it.get('rate', 0.0))
            table_rows.append([it.get('description', 'Item'), f"{q:.0f}", f"₹{r:,.2f}", f"₹{q*r:,.2f}"])

        summary_metrics = {
            "Subtotal": f"₹{subtotal:,.2f}",
            "GST Rate": f"{tax_rate}% ({'IGST' if is_interstate else 'CGST+SGST'})",
            "Tax Total": f"₹{gst_calc['total_tax']:,.2f}",
            "Grand Total": f"₹{gst_calc['grand_total']:,.2f}"
        }

        pdf_path = generate_pdf_report(
            filename=pdf_filename,
            title=f"TAX INVOICE - {inv_num}",
            subtitle=f"Billed by {biz.business_name} (GSTIN: {biz.gstin or 'N/A'}) to {client_name}",
            summary_metrics=summary_metrics,
            table_headers=table_headers,
            table_data=table_rows,
            output_dir=output_dir
        )

        invoice.pdf_path = pdf_path
        db.session.commit()

        return jsonify({'status': 'success', 'invoice': invoice.to_dict()}), 201

    # GET invoices
    invoices = Invoice.query.filter_by(business_id=biz.id).order_by(Invoice.created_at.desc()).all()
    
    # If empty, create sample invoice for demo
    if not invoices:
        demo_items = [
            {'description': 'Enterprise AI Consulting - Sprint 1', 'quantity': 1, 'rate': 85000.0},
            {'description': 'Cloud Architecture Audit & Security Review', 'quantity': 1, 'rate': 35000.0}
        ]
        sub = 120000.0
        gst_demo = calculate_gst(sub, 18.0, is_interstate=False)
        demo_inv = Invoice(
            business_id=biz.id,
            invoice_number="INV-202502-001",
            client_name="InnovateTech Global Ltd",
            client_gstin="29XYZAB5678C1Z9",
            client_state="Karnataka",
            client_email="accounts@innovatetech.com",
            invoice_date=date(2025, 2, 10),
            due_date=date(2025, 3, 10),
            subtotal=sub,
            tax_rate=18.0,
            cgst_amount=gst_demo['cgst'],
            sgst_amount=gst_demo['sgst'],
            igst_amount=0.0,
            total_amount=gst_demo['grand_total'],
            items=demo_items,
            status='PAID'
        )
        db.session.add(demo_inv)
        db.session.commit()
        invoices = [demo_inv]

    return jsonify({
        'status': 'success',
        'invoices': [inv.to_dict() for inv in invoices]
    }), 200

@business_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_business_analytics():
    user_id = get_jwt_identity()
    biz = Business.query.filter_by(user_id=user_id).first()
    if not biz:
        return jsonify({'status': 'error', 'message': 'Business profile not set.'}), 404

    invoices = Invoice.query.filter_by(business_id=biz.id).all()
    total_rev = sum(float(inv.total_amount) for inv in invoices if inv.status == 'PAID')
    pending_recv = sum(float(inv.total_amount) for inv in invoices if inv.status == 'PENDING')
    est_expenses = round(total_rev * 0.42, 2) # Estimated 42% cost of delivery
    est_profit = max(0.0, total_rev - est_expenses)

    return jsonify({
        'status': 'success',
        'summary': {
            'total_revenue': round(total_rev, 2),
            'outstanding_receivables': round(pending_recv, 2),
            'estimated_operating_expenses': est_expenses,
            'estimated_net_profit': round(est_profit, 2),
            'profit_margin_percent': round((est_profit / total_rev * 100), 1) if total_rev > 0 else 0.0,
            'invoice_count': len(invoices)
        }
    }), 200

@business_bp.route('/cashflow', methods=['GET'])
@jwt_required()
def get_business_cashflow():
    cashflow_series = [
        {'month': 'Sep 2024', 'inflow': 120000, 'outflow': 75000, 'net': 45000},
        {'month': 'Oct 2024', 'inflow': 145000, 'outflow': 82000, 'net': 63000},
        {'month': 'Nov 2024', 'inflow': 160000, 'outflow': 89000, 'net': 71000},
        {'month': 'Dec 2024', 'inflow': 185000, 'outflow': 95000, 'net': 90000},
        {'month': 'Jan 2025', 'inflow': 210000, 'outflow': 105000, 'net': 105000},
        {'month': 'Feb 2025', 'inflow': 141600, 'outflow': 65000, 'net': 76600}
    ]
    return jsonify({
        'status': 'success',
        'cashflow_trend': cashflow_series,
        'working_capital_runway_months': 5.8
    }), 200
