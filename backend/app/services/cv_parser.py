"""
Extracts plain text from an uploaded CV so it can be fed into agent prompts.
Supports .txt/.md directly and .pdf via pypdf. Drop your own CVs into
app/data/candidate_cvs/ and they'll be readable the same way.
"""
from pathlib import Path
from pypdf import PdfReader
import io


def extract_text(filename: str, raw_bytes: bytes) -> str:
    suffix = Path(filename).suffix.lower()

    if suffix == ".pdf":
        reader = PdfReader(io.BytesIO(raw_bytes))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages).strip()

    # txt / md / anything else: assume UTF-8 text
    try:
        return raw_bytes.decode("utf-8").strip()
    except UnicodeDecodeError:
        return raw_bytes.decode("latin-1", errors="ignore").strip()


def extract_from_path(path: Path) -> str:
    return extract_text(path.name, path.read_bytes())
