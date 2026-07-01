"""Resume parsing and summary generation service."""

import io
import re
import zipfile
from typing import Optional

try:
    from PyPDF2 import PdfReader
except ImportError:  # pragma: no cover
    PdfReader = None

try:
    import docx
except ImportError:  # pragma: no cover
    docx = None


def _extract_text_from_pdf(file_bytes: bytes) -> str:
    if PdfReader is None:
        return ""

    with io.BytesIO(file_bytes) as buffer:
        reader = PdfReader(buffer)
        pages = []
        for page in reader.pages:
            text = page.extract_text() or ""
            pages.append(text)
    return "\n".join(pages).strip()


def _extract_text_from_docx(file_bytes: bytes) -> str:
    if docx is not None:
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            return "\n".join(p.text for p in doc.paragraphs if p.text).strip()
        except Exception:
            return ""

    if zipfile.is_zipfile(io.BytesIO(file_bytes)):
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
                if 'word/document.xml' in z.namelist():
                    xml = z.read('word/document.xml').decode('utf-8', errors='ignore')
                    text = re.sub(r'</w:p>|</w:tr>|</w:tc>', '\n', xml)
                    text = re.sub(r'<[^>]+>', '', text)
                    return text.strip()
        except Exception:
            return ""
    return ""


def _extract_text_from_plain_text(file_bytes: bytes) -> str:
    try:
        return file_bytes.decode('utf-8', errors='replace').strip()
    except Exception:
        return ""


def extract_resume_text(filename: str, file_bytes: bytes) -> str:
    lower = filename.lower()
    if lower.endswith('.pdf'):
        return _extract_text_from_pdf(file_bytes)
    if lower.endswith('.docx'):
        return _extract_text_from_docx(file_bytes)
    if lower.endswith('.txt'):
        return _extract_text_from_plain_text(file_bytes)

    # fallback: attempt text extraction anyway
    text = _extract_text_from_pdf(file_bytes)
    if text:
        return text
    text = _extract_text_from_docx(file_bytes)
    if text:
        return text
    return _extract_text_from_plain_text(file_bytes)


def summarize_resume_text(text: str, max_sentences: int = 4) -> str:
    if not text:
        return "Resume was uploaded successfully, but no extractable text was found."

    lines = [line.strip() for line in re.split(r'[\r\n]+', text) if line.strip()]
    high_priority = []
    keywords = [
        'summary', 'experience', 'skills', 'education', 'project', 'achievement',
        'certification', 'leadership', 'results', 'background', 'role', 'accomplishment',
    ]

    for line in lines:
        if len(high_priority) >= max_sentences:
            break
        lower_line = line.lower()
        if any(keyword in lower_line for keyword in keywords):
            high_priority.append(line)

    if len(high_priority) < max_sentences:
        for line in lines:
            if line not in high_priority:
                high_priority.append(line)
            if len(high_priority) >= max_sentences:
                break

    summary = ' '.join(high_priority[:max_sentences]).strip()
    if not summary:
        summary = 'Resume was uploaded successfully, but no clear summary could be generated.'

    return summary


def parse_resume(filename: str, file_bytes: bytes) -> str:
    text = extract_resume_text(filename, file_bytes)
    if not text:
        raise ValueError('Could not read the resume. Please upload a PDF, DOCX, or plain text resume.')
    return summarize_resume_text(text)
