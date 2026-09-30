import hashlib
import re

from app.config import settings


def _tokenize(text: str) -> list[tuple[str, int, int]]:
    """Return (token_lower, char_start, char_end) for every word in text."""
    return [
        (m.group().lower(), m.start(), m.end())
        for m in re.finditer(r"\b\w+\b", text)
    ]


def _hash_ngram(ngram: tuple[str, ...]) -> int:
    digest = hashlib.sha256(" ".join(ngram).encode()).hexdigest()
    return int(digest[:16], 16)


def build_fingerprints(
    text: str,
    ngram_size: int | None = None,
    window_size: int | None = None,
) -> dict:
    """
    Winnowing fingerprint algorithm.

    Returns a JSON-serializable dict:
        {
            "hashes": [int, ...],
            "positions": {"<hash_str>": [[start, end], ...], ...}
        }
    """
    n = ngram_size or settings.ngram_size
    w = window_size or settings.window_size

    tokens = _tokenize(text)
    if not tokens:
        return {"hashes": [], "positions": {}}

    # Clamp n to available tokens so short texts still get fingerprints
    n = min(n, len(tokens))

    ngram_hashes: list[int] = []
    ngram_spans: list[tuple[int, int]] = []

    for i in range(len(tokens) - n + 1):
        window = tokens[i : i + n]
        h = _hash_ngram(tuple(t[0] for t in window))
        ngram_hashes.append(h)
        ngram_spans.append((window[0][1], window[-1][2]))

    # Winnowing: keep minimum hash per sliding window
    w = min(w, len(ngram_hashes))
    fingerprints: set[int] = set()
    hash_to_positions: dict[str, list[list[int]]] = {}

    for i in range(len(ngram_hashes) - w + 1):
        win = ngram_hashes[i : i + w]
        min_val = min(win)
        idx = i + win.index(min_val)
        h = ngram_hashes[idx]
        fingerprints.add(h)
        span = list(ngram_spans[idx])
        key = str(h)
        positions = hash_to_positions.setdefault(key, [])
        if span not in positions:
            positions.append(span)

    return {
        "hashes": list(fingerprints),
        "positions": hash_to_positions,
    }


def jaccard_similarity(hashes_a: list[int], hashes_b: list[int]) -> float:
    set_a, set_b = set(hashes_a), set(hashes_b)
    if not set_a and not set_b:
        return 0.0
    return len(set_a & set_b) / len(set_a | set_b)
