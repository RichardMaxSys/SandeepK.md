from docx import Document
from weasyprint import HTML
import io

from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def generate_docx(content_text: str) -> io.BytesIO:
    doc = Document()

    # Set default style
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Arial'
    font.size = Pt(11)

    for line in content_text.split('\n'):
        line = line.strip()
        if not line:
            continue

        p = doc.add_paragraph()
        if line.isupper() and len(line) < 50: # Assume header
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            run = p.add_run(line)
            run.bold = True
            run.font.size = Pt(13)
            run.font.color.rgb = RGBColor(0, 51, 102) # Dark blue
        else:
            p.add_run(line)

    file_stream = io.BytesIO()
    doc.save(file_stream)
    file_stream.seek(0)
    return file_stream

def generate_pdf(content_text: str) -> io.BytesIO:
    # Improved HTML template for professional look
    sections = content_text.split('\n')
    styled_content = ""
    for line in sections:
        line = line.strip()
        if not line:
            continue
        if line.isupper() and len(line) < 50:
            styled_content += f"<h2 style='color: #003366; border-bottom: 1px solid #ccc; margin-top: 20px;'>{line}</h2>"
        else:
            styled_content += f"<p style='margin: 5px 0;'>{line}</p>"

    html_content = f"""
    <html>
        <head>
            <style>
                body {{ font-family: 'Helvetica', 'Arial', sans-serif; line-height: 1.5; margin: 50px; color: #333; }}
                h2 {{ font-size: 16px; text-transform: uppercase; }}
                p {{ font-size: 11pt; }}
            </style>
        </head>
        <body>
            {styled_content}
        </body>
    </html>
    """
    pdf_stream = io.BytesIO()
    HTML(string=html_content).write_pdf(pdf_stream)
    pdf_stream.seek(0)
    return pdf_stream
