import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Document
from app.schemas import DocumentCreate, DocumentResponse
from app.services.fingerprint import build_fingerprints

router = APIRouter(prefix="/documents", tags=["documents"])


def _parse_upload(file: UploadFile) -> str:
    raw = file.file.read()
    filename = file.filename or ""
    if filename.endswith(".docx"):
        from docx import Document as DocxDoc
        doc = DocxDoc(io.BytesIO(raw))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    return raw.decode("utf-8", errors="replace")


def _create_doc(title: str, content: str, db: Session) -> Document:
    fp = build_fingerprints(content)
    doc = Document(
        title=title,
        content=content,
        word_count=len(content.split()),
        char_count=len(content),
    )
    doc.set_fingerprints(fp)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.post("/", response_model=DocumentResponse, status_code=201)
def add_document(payload: DocumentCreate, db: Session = Depends(get_db)):
    return _create_doc(payload.title, payload.content, db)


@router.post("/upload", response_model=DocumentResponse, status_code=201)
def upload_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return _create_doc(title, _parse_upload(file), db)


@router.get("/", response_model=list[DocumentResponse])
def list_documents(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    return db.query(Document).offset(skip).limit(limit).all()


@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/{doc_id}", status_code=204)
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
