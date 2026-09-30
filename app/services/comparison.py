from sqlalchemy.orm import Session
from app.models import Document
from app.schemas import CheckResponse, DocumentMatch, MatchedPassage
from app.services.fingerprint import build_fingerprints, jaccard_similarity
from app.config import settings

_VERDICT_THRESHOLDS = {
    "plagiarized": 0.50,
    "suspicious": 0.15,
}


def _build_passages(
    query_text: str,
    source_text: str,
    query_fp: dict,
    source_fp: dict,
) -> list[MatchedPassage]:
    shared_hashes = set(query_fp["hashes"]) & set(source_fp["hashes"])
    passages: list[MatchedPassage] = []
    seen: set[tuple] = set()

    for h in shared_hashes:
        key = str(h)
        for q_pos in query_fp["positions"].get(key, []):
            for s_pos in source_fp["positions"].get(key, []):
                sig = (q_pos[0], q_pos[1], s_pos[0], s_pos[1])
                if sig in seen:
                    continue
                seen.add(sig)
                passages.append(
                    MatchedPassage(
                        query_start=q_pos[0],
                        query_end=q_pos[1],
                        query_text=query_text[q_pos[0] : q_pos[1]],
                        source_start=s_pos[0],
                        source_end=s_pos[1],
                        source_text=source_text[s_pos[0] : s_pos[1]],
                    )
                )

    return sorted(passages, key=lambda p: p.query_start)


def check_text(text: str, db: Session) -> CheckResponse:
    query_fp = build_fingerprints(text)
    documents: list[Document] = db.query(Document).all()

    matches: list[DocumentMatch] = []

    for doc in documents:
        source_fp = doc.get_fingerprints()
        sim = jaccard_similarity(query_fp["hashes"], source_fp["hashes"])
        if sim < settings.similarity_threshold:
            continue

        passages = _build_passages(text, doc.content, query_fp, source_fp)
        matches.append(
            DocumentMatch(
                document_id=doc.id,
                document_title=doc.title,
                similarity=round(sim, 4),
                matched_passages=passages,
            )
        )

    matches.sort(key=lambda m: m.similarity, reverse=True)
    highest = matches[0].similarity if matches else 0.0

    if highest >= _VERDICT_THRESHOLDS["plagiarized"]:
        verdict = "plagiarized"
    elif highest >= _VERDICT_THRESHOLDS["suspicious"]:
        verdict = "suspicious"
    else:
        verdict = "original"

    return CheckResponse(
        word_count=len(text.split()),
        highest_similarity=round(highest, 4),
        verdict=verdict,
        matches=matches,
    )
