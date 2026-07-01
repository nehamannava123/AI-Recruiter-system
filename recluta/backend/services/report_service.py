"""PDF report generation using WeasyPrint."""

import io
from datetime import datetime
from typing import Any
import base64
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


def _get_weasyprint_html():
    try:
        from weasyprint import HTML
        return HTML
    except OSError:
        return None


def _build_html(data: dict) -> str:
    overall = data.get("overall_score", 0)
    metrics = data.get("metrics", {})
    qa_pairs = data.get("qa_pairs", [])
    role = data.get("role", "Candidate")
    timestamp = datetime.now().strftime("%B %d, %Y at %H:%M")

    metric_rows = ""
    for name, value in metrics.items():
        label = name.replace("_", " ").title()
        metric_rows += f"""
        <tr>
            <td>{label}</td>
            <td>{value}/100</td>
            <td>
                <div class="bar"><div class="bar-fill" style="width:{value}%"></div></div>
            </td>
        </tr>"""

    qa_rows = ""
    for i, qa in enumerate(qa_pairs, 1):
        star = "✓ STAR" if qa.get("star_compliance") else "✗ No STAR"
        qa_rows += f"""
        <div class="qa-block">
            <h3>Question {i}</h3>
            <p class="question">{qa.get('question', '')}</p>
            <p class="answer">{qa.get('answer', '')}</p>
            <p class="meta">Score: {qa.get('answer_score', 0)}/100 · {star}</p>
            <p class="tip">{qa.get('feedback', '')}</p>
        </div>"""

    radar = metrics
    # optionally embed a trend chart if provided in data['charts']
    chart_img = ""
    try:
      chart = data.get("chart")
      if chart and isinstance(chart, list) and len(chart) > 1:
        fig, ax = plt.subplots(figsize=(6, 2))
        ax.plot(chart, color="#00FFA3")
        ax.fill_between(range(len(chart)), chart, color="#00FFA3", alpha=0.1)
        ax.set_title("Score Trend")
        ax.set_ylim(0, 100)
        ax.set_xlabel("")
        ax.set_ylabel("")
        ax.grid(alpha=0.2)
        buf = io.BytesIO()
        fig.tight_layout()
        fig.savefig(buf, format="png", dpi=150, bbox_inches="tight")
        plt.close(fig)
        buf.seek(0)
        chart_img = "data:image/png;base64," + base64.b64encode(buf.read()).decode("utf-8")
    except Exception:
      chart_img = ""
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {{ size: A4; margin: 2cm; }}
  body {{
    font-family: 'Segoe UI', Inter, sans-serif;
    background: #080B14;
    color: #F0F4FF;
    margin: 0;
    padding: 40px;
  }}
  .header {{
    border-bottom: 2px solid #2563EB;
    padding-bottom: 20px;
    margin-bottom: 30px;
  }}
  .brand {{
    font-size: 28px;
    font-weight: 700;
    color: #2563EB;
    letter-spacing: -0.5px;
  }}
  .subtitle {{ color: #8896B3; font-size: 14px; margin-top: 4px; }}
  .hero {{
    display: flex;
    align-items: center;
    gap: 40px;
    margin-bottom: 40px;
    background: #0E1424;
    border: 1px solid #1C2840;
    border-radius: 12px;
    padding: 30px;
  }}
  .score-circle {{
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 6px solid #00FFA3;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    font-weight: 700;
    color: #00FFA3;
    flex-shrink: 0;
  }}
  .hero-text h1 {{ font-size: 24px; margin: 0 0 8px; }}
  .hero-text p {{ color: #8896B3; margin: 0; }}
  h2 {{
    color: #F0F4FF;
    font-size: 18px;
    border-left: 3px solid #00FFA3;
    padding-left: 12px;
    margin: 30px 0 16px;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    background: #0E1424;
    border-radius: 12px;
    overflow: hidden;
  }}
  th, td {{
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #1C2840;
  }}
  th {{ background: #141B2D; color: #8896B3; font-size: 12px; text-transform: uppercase; }}
  .bar {{
    background: #141B2D;
    border-radius: 4px;
    height: 8px;
    overflow: hidden;
  }}
  .bar-fill {{
    background: #00FFA3;
    height: 100%;
    border-radius: 4px;
  }}
  .qa-block {{
    background: #0E1424;
    border: 1px solid #1C2840;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
  }}
  .qa-block h3 {{ color: #2563EB; margin: 0 0 8px; font-size: 14px; }}
  .question {{ color: #F0F4FF; font-weight: 600; }}
  .answer {{ color: #8896B3; font-size: 13px; }}
  .meta {{ color: #00FFA3; font-size: 12px; }}
  .tip {{ color: #F59E0B; font-size: 12px; font-style: italic; }}
  .footer {{
    margin-top: 40px;
    text-align: center;
    color: #3D4E6B;
    font-size: 11px;
  }}
</style>
</head>
<body>
  <div class="header">
    <div class="brand">Recluta</div>
    <div class="subtitle">Interview Performance Report · {timestamp}</div>
  </div>

  <div class="hero">
    <div class="score-circle">{overall}</div>
    <div class="hero-text">
      <h1>{role} — Interview Results</h1>
      <p>Overall readiness score based on confidence, communication, eye contact, and answer quality.</p>
    </div>
  </div>

  <h2>Performance Metrics</h2>
  <table>
    <thead>
      <tr><th>Metric</th><th>Score</th><th>Progress</th></tr>
    </thead>
    <tbody>{metric_rows}</tbody>
  </table>

  {f'<h2>Score Trend</h2><img src="{chart_img}" style="width:100%;height:auto;border-radius:8px;"/>' if chart_img else ''}

  <h2>Question Breakdown</h2>
  {qa_rows if qa_rows else '<p style="color:#8896B3">No Q&A data available.</p>'}

  <div class="footer">
    Generated by Recluta AI Interview Coach · Confidential
  </div>
</body>
</html>"""


def generate_pdf_report(data: dict) -> bytes:
    """Render HTML template to PDF bytes."""
    HTML = _get_weasyprint_html()
    if HTML is None:
        raise RuntimeError(
            "PDF generation unavailable. Install WeasyPrint system deps: "
            "brew install pango libffi gdk-pixbuf"
        )
    html_content = _build_html(data)
    pdf_buffer = io.BytesIO()
    HTML(string=html_content).write_pdf(pdf_buffer)
    return pdf_buffer.getvalue()
