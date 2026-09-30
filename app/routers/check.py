from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.documents import _parse_upload
from app.schemas import CheckRequest, CheckResponse
from app.services.comparison import check_text

router = APIRouter(prefix="/check", tags=["check"])


@router.post("/", response_model=CheckResponse)
def check_text_endpoint(payload: CheckRequest, db: Session = Depends(get_db)):
    return check_text(payload.text, db)


@router.post("/upload", response_model=CheckResponse)
def check_upload(file: UploadFile = File(...), db: Session = Depends(get_db)):
    return check_text(_parse_upload(file), db)
