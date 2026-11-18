import os
import csv
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_csv_report(filename: str, headers: list, rows: list, output_dir: str) -> str:
    """Generate a clean CSV report and return absolute file path."""
    os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, filename)
    with open(file_path, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
    return file_path

def generate_pdf_report(filename: str, title: str, subtitle: str, summary_metrics: dict, table_headers: list, table_data: list, output_dir: str) -> str:
    """Generate a high-grade branded fintech PDF report using ReportLab."""
    os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, filename)

    doc = SimpleDocTemplate(
        file_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#101828')
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B')
    )

    h2_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#5146E5')
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1E293B')
    )

    elements = []

    # Header
    elements.append(Paragraph(f"FINWISE AI - {title}", title_style))
    elements.append(Paragraph(f"{subtitle} | Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}", subtitle_style))
    elements.append(Spacer(1, 15))

    # Summary Metrics Card Table
    if summary_metrics:
        elements.append(Paragraph("EXECUTIVE SUMMARY", h2_style))
        elements.append(Spacer(1, 6))
        metric_rows = []
        keys = list(summary_metrics.keys())
        for i in range(0, len(keys), 2):
            k1 = keys[i]
            v1 = str(summary_metrics[k1])
            k2 = keys[i+1] if i+1 < len(keys) else ""
            v2 = str(summary_metrics[k2]) if k2 else ""
            metric_rows.append([k1, v1, k2, v2])

        metric_table = Table(metric_rows, colWidths=[130, 130, 130, 130])
        metric_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#101828')),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0'))
        ]))
        elements.append(metric_table)
        elements.append(Spacer(1, 18))

    # Data Table
    if table_headers and table_data:
        elements.append(Paragraph("DETAILED ANALYSIS", h2_style))
        elements.append(Spacer(1, 6))

        clean_table_data = [[Paragraph(str(cell), body_style) for cell in row] for row in table_data]
        header_row = [Paragraph(f"<b>{h}</b>", body_style) for h in table_headers]
        full_table_matrix = [header_row] + clean_table_data

        data_table = Table(full_table_matrix, repeatRows=1)
        data_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#101828')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ]))
        elements.append(data_table)

    # Footer note
    elements.append(Spacer(1, 20))
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#94A3B8')
    )
    elements.append(Paragraph("Confidential - Generated for personal and internal planning by FINWISE AI. Algorithmic outputs should be reviewed against original institutional documentation.", disclaimer_style))

    doc.build(elements)
    return file_path
