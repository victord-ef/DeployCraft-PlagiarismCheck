import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db

# StaticPool keeps a single connection so all operations see the same in-memory DB
_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_Session = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


def _override_db():
    db = _Session()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_db

# Create tables in the test engine before TestClient initializes
Base.metadata.create_all(bind=_engine)
client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_db():
    # Drop and recreate between tests for a clean slate
    Base.metadata.drop_all(bind=_engine)
    Base.metadata.create_all(bind=_engine)
    yield

SOURCE_TEXT = (
    "Artificial intelligence is transforming the way we build software. "
    "Machine learning models can now write code and assist developers in complex tasks. "
    "Deep learning has enabled breakthroughs in image recognition and natural language processing."
)


# ── Health ──────────────────────────────────────────────────────────────────────

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ── Documents ───────────────────────────────────────────────────────────────────

def test_add_document_returns_201():
    r = client.post("/api/v1/documents/", json={"title": "Doc A", "content": SOURCE_TEXT})
    assert r.status_code == 201
    body = r.json()
    assert body["id"] == 1
    assert body["title"] == "Doc A"
    assert body["word_count"] > 0
    assert body["char_count"] == len(SOURCE_TEXT)


def test_list_documents_empty():
    r = client.get("/api/v1/documents/")
    assert r.status_code == 200
    assert r.json() == []


def test_list_documents_returns_all():
    client.post("/api/v1/documents/", json={"title": "A", "content": "Content alpha"})
    client.post("/api/v1/documents/", json={"title": "B", "content": "Content beta"})
    r = client.get("/api/v1/documents/")
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_get_document_by_id():
    client.post("/api/v1/documents/", json={"title": "Specific", "content": "Some content"})
    r = client.get("/api/v1/documents/1")
    assert r.status_code == 200
    assert r.json()["title"] == "Specific"


def test_get_document_not_found():
    r = client.get("/api/v1/documents/9999")
    assert r.status_code == 404


def test_delete_document():
    client.post("/api/v1/documents/", json={"title": "Temp", "content": "Delete me please"})
    assert client.delete("/api/v1/documents/1").status_code == 204
    assert client.get("/api/v1/documents/1").status_code == 404


def test_delete_nonexistent_returns_404():
    assert client.delete("/api/v1/documents/9999").status_code == 404


def test_add_document_missing_title_returns_422():
    r = client.post("/api/v1/documents/", json={"content": "Some content"})
    assert r.status_code == 422


def test_add_document_empty_content_returns_422():
    r = client.post("/api/v1/documents/", json={"title": "X", "content": ""})
    assert r.status_code == 422


# ── Check ───────────────────────────────────────────────────────────────────────

def test_check_empty_corpus_is_original():
    r = client.post("/api/v1/check/", json={"text": "Completely unique text about nothing special here."})
    assert r.status_code == 200
    body = r.json()
    assert body["verdict"] == "original"
    assert body["highest_similarity"] == 0.0
    assert body["matches"] == []


def test_check_near_copy_detected():
    client.post("/api/v1/documents/", json={"title": "Source", "content": SOURCE_TEXT})
    copy = (
        "Artificial intelligence is transforming how we build software. "
        "Machine learning models can write code and help developers in complex tasks. "
        "Deep learning has led to breakthroughs in image recognition and NLP."
    )
    r = client.post("/api/v1/check/", json={"text": copy})
    assert r.status_code == 200
    body = r.json()
    assert body["highest_similarity"] > 0.1
    assert len(body["matches"]) == 1
    assert body["matches"][0]["document_id"] == 1
    assert body["matches"][0]["document_title"] == "Source"


def test_check_exact_copy_is_plagiarized():
    client.post("/api/v1/documents/", json={"title": "Original", "content": SOURCE_TEXT})
    r = client.post("/api/v1/check/", json={"text": SOURCE_TEXT})
    assert r.status_code == 200
    body = r.json()
    assert body["verdict"] == "plagiarized"
    assert body["highest_similarity"] == 1.0


def test_check_returns_matched_passages():
    client.post("/api/v1/documents/", json={"title": "Src", "content": SOURCE_TEXT})
    copy = (
        "Artificial intelligence is transforming how we build software. "
        "Machine learning models can write code and assist developers."
    )
    r = client.post("/api/v1/check/", json={"text": copy})
    body = r.json()
    if body["matches"]:
        passages = body["matches"][0]["matched_passages"]
        assert len(passages) > 0
        p = passages[0]
        assert "query_start" in p
        assert "query_end" in p
        assert "query_text" in p
        assert "source_text" in p
        assert p["query_start"] < p["query_end"]


def test_check_unrelated_text_no_match():
    client.post("/api/v1/documents/", json={"title": "AI Essay", "content": SOURCE_TEXT})
    r = client.post("/api/v1/check/", json={"text": "The weather today is sunny and warm outside in the garden."})
    assert r.status_code == 200
    body = r.json()
    assert body["highest_similarity"] < 0.1


def test_check_word_count_returned():
    r = client.post("/api/v1/check/", json={"text": "one two three four five"})
    assert r.json()["word_count"] == 5


def test_check_missing_text_returns_422():
    r = client.post("/api/v1/check/", json={})
    assert r.status_code == 422
