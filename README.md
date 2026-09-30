# DeployCraft PlagiarismCheck

A full-stack plagiarism detection tool built with **FastAPI** + **React**, using the **Winnowing fingerprinting algorithm** for accurate, scalable text similarity detection.

![Verdict Banner](https://img.shields.io/badge/verdict-suspicious-orange) ![License](https://img.shields.io/badge/license-MIT-blue) ![Python](https://img.shields.io/badge/python-3.11%2B-blue) ![React](https://img.shields.io/badge/react-18-61dafb)

---

## Features

- **Winnowing fingerprint algorithm** — same technique used by MOSS and Turnitin
- **Passage-level highlighting** — exact matched phrases highlighted in the annotated text view
- **Side-by-side comparison** — "Your text" vs "Source" for every matched n-gram
- **Corpus management** — add, upload (.txt / .docx), and delete source documents
- **Verdict scoring** — `Original` / `Suspicious` / `Plagiarized` based on Jaccard similarity
- **File upload** — check `.txt` and `.docx` files directly
- **REST API** — all features exposed via clean JSON endpoints (FastAPI + Swagger UI)

---

## Screenshots

| Check text & passage highlighting | Corpus management |
|---|---|
| Paste or upload text, get an annotated view with matched passages highlighted and a side-by-side source comparison | Add source documents by pasting text or uploading .txt/.docx files |

---

## How It Works

### Winnowing Algorithm

1. **Tokenize** — extract words using regex, lowercased, preserving character positions
2. **N-gram hashing** — slide a window of `n=5` words, hash each n-gram with SHA-256
3. **Winnow** — select the minimum hash in each window of size `w=4` to produce a compact fingerprint set
4. **Jaccard similarity** — `|A ∩ B| / |A ∪ B|` between two fingerprint sets
5. **Passage extraction** — trace matched hashes back to original character positions for highlighting

### Verdict Thresholds

| Score | Verdict |
|---|---|
| < 15% | Original |
| 15% – 49% | Suspicious |
| ≥ 50% | Plagiarized |

---

## Project Structure

```
plagiarism-api/
├── app/                          # FastAPI backend
│   ├── main.py                   # App entry point, CORS, lifespan
│   ├── config.py                 # Settings (ngram_size, window_size, threshold)
│   ├── database.py               # SQLAlchemy + SQLite setup
│   ├── models.py                 # Document ORM model
│   ├── schemas.py                # Pydantic request/response schemas
│   ├── services/
│   │   ├── fingerprint.py        # Winnowing engine (tokenize → hash → winnow → Jaccard)
│   │   └── comparison.py        # Cross-corpus check, passage extraction, verdict
│   └── routers/
│       ├── documents.py          # CRUD + file upload endpoints
│       └── check.py              # Plagiarism check endpoints
├── frontend/                     # React + Vite + Tailwind
│   ├── src/
│   │   ├── App.jsx               # Layout + tab navigation
│   │   ├── api.js                # API client (fetch wrappers)
│   │   └── components/
│   │       ├── CheckPanel.jsx    # Text input, file upload, results display
│   │       ├── HighlightedText.jsx # Passage annotation with per-doc color coding
│   │       ├── MatchCard.jsx     # Collapsible match card with similarity bar
│   │       └── CorpusPanel.jsx   # Corpus management UI
│   ├── vite.config.js            # Dev proxy → localhost:8000
│   └── package.json
└── requirements.txt
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+

### Backend

```bash
cd plagiarism-api

# Create and activate virtual environment
python -m venv .venv

# Windows
.\.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --reload
# → http://localhost:8000
# → Swagger UI: http://localhost:8000/docs
```

### Frontend

```bash
cd plagiarism-api/frontend

npm install
npm run dev
# → http://localhost:5173
```

> The Vite dev server proxies `/api/*` to `http://localhost:8000` automatically.

---

## API Reference

### Documents

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/documents/` | Add document (JSON body) |
| `POST` | `/api/v1/documents/upload` | Add document (multipart file) |
| `GET` | `/api/v1/documents/` | List all corpus documents |
| `GET` | `/api/v1/documents/{id}` | Get a single document |
| `DELETE` | `/api/v1/documents/{id}` | Remove from corpus |

### Check

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/check/` | Check text (JSON body) |
| `POST` | `/api/v1/check/upload` | Check uploaded file |

### Example

```bash
# Add a source document
curl -X POST http://localhost:8000/api/v1/documents/ \
  -H "Content-Type: application/json" \
  -d '{"title": "My Essay", "content": "Artificial intelligence is transforming..."}'

# Check for plagiarism
curl -X POST http://localhost:8000/api/v1/check/ \
  -H "Content-Type: application/json" \
  -d '{"text": "AI is transforming the way we build software..."}'
```

**Response:**

```json
{
  "word_count": 34,
  "highest_similarity": 0.4615,
  "verdict": "suspicious",
  "matches": [
    {
      "document_id": 1,
      "document_title": "My Essay",
      "similarity": 0.4615,
      "matched_passages": [
        {
          "query_start": 53,
          "query_end": 90,
          "query_text": "software. Machine learning models can",
          "source_start": 57,
          "source_end": 94,
          "source_text": "software. Machine learning models can"
        }
      ]
    }
  ]
}
```

---

## Configuration

Edit `app/config.py` or set environment variables via `.env`:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./plagiarism.db` | Database connection string |
| `NGRAM_SIZE` | `5` | N-gram window size |
| `WINDOW_SIZE` | `4` | Winnowing window size |
| `SIMILARITY_THRESHOLD` | `0.10` | Minimum similarity to report a match |

To use PostgreSQL instead of SQLite:

```env
DATABASE_URL=postgresql://user:password@localhost/plagiarism
```

---

## Roadmap

- [ ] Internet check via Bing / SerpAPI
- [ ] PDF support (PyMuPDF)
- [ ] Code plagiarism (AST-based comparison)
- [ ] Bulk document upload
- [ ] API key authentication
- [ ] Docker Compose deployment
- [ ] Export results as PDF report

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy |
| Database | SQLite (swappable to PostgreSQL) |
| Algorithm | Winnowing + Jaccard similarity |
| Frontend | React 18, Vite, Tailwind CSS |
| File parsing | python-docx |

---

## License

MIT — free to use, modify, and distribute.

---

*Built as part of the [DeployCraft.io](https://deploycraft.io) toolchain.*
