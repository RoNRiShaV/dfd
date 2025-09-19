from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
)
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from pathlib import Path
from datetime import datetime

# ✅ NEW: Define reports folder globally
BASE_DIR = Path(__file__).resolve().parent
REPORTS_DIR = BASE_DIR / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

def generate_pdf_report(output_path, image_path, analysis_data, exif_data, heatmap_path=None):
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "TitleStyle", parent=styles["Title"], textColor=colors.HexColor("#1E3A8A"), fontSize=20, leading=24
    )
    heading_style = ParagraphStyle(
        "HeadingStyle", parent=styles["Heading2"], textColor=colors.HexColor("#2563EB"), fontSize=14, spaceAfter=6
    )
    normal_style = ParagraphStyle(
        "NormalStyle", parent=styles["Normal"], fontSize=10, leading=14
    )

    doc = SimpleDocTemplate(
        str(output_path), pagesize=A4,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )
    elements = []

    # Title + timestamp
    elements.append(Paragraph("DeepFake Analysis Report", title_style))
    elements.append(Paragraph(datetime.utcnow().strftime("Generated on %Y-%m-%d %H:%M:%S UTC"), normal_style))
    elements.append(Spacer(1, 20))

    # Image preview
    if Path(image_path).exists():
        elements.append(Paragraph("Analyzed Image", heading_style))
        elements.append(Image(image_path, width=250, height=250))
        elements.append(Spacer(1, 12))

    # Heatmap preview
    if heatmap_path and Path(heatmap_path).exists():
        elements.append(Paragraph("Detection Heatmap", heading_style))
        elements.append(Image(heatmap_path, width=250, height=250))
        elements.append(Spacer(1, 12))

    # Analysis Results table
    if analysis_data:
        elements.append(Paragraph("Analysis Results", heading_style))
        data = [["Metric", "Value"]]
        for key, value in analysis_data.items():
            data.append([str(key), str(value)])

        table = Table(data, hAlign="LEFT", colWidths=[150, 300])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563EB")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 1), (-1, -1), colors.whitesmoke),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 20))

    # Page break before metadata
    elements.append(PageBreak())

    # EXIF Metadata
    if exif_data:
        elements.append(Paragraph("EXIF Metadata", heading_style))
        exif_table_data = [["Property", "Value"]]
        for k, v in exif_data.items():
            exif_table_data.append([str(k), str(v)])

        exif_table = Table(exif_table_data, hAlign="LEFT", colWidths=[150, 300])
        exif_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E40AF")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 1), (-1, -1), colors.whitesmoke),
        ]))
        elements.append(exif_table)

    # Build PDF
    doc.build(elements)
