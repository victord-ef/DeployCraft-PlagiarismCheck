import json
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    fingerprint_data = Column(Text, nullable=False)  # JSON blob
    word_count = Column(Integer, nullable=False)
    char_count = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def get_fingerprints(self) -> dict:
        return json.loads(self.fingerprint_data)

    def set_fingerprints(self, data: dict) -> None:
        self.fingerprint_data = json.dumps(data)
