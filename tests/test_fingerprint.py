import pytest
from app.services.fingerprint import (
    build_fingerprints,
    jaccard_similarity,
    _tokenize,
    _hash_ngram,
)


def test_tokenize_returns_lowercased_tokens():
    tokens = _tokenize("Hello World")
    assert [(t, s, e) for t, s, e in tokens] == [("hello", 0, 5), ("world", 6, 11)]


def test_tokenize_positions_match_original():
    text = "The quick brown fox"
    for tok, start, end in _tokenize(text):
        assert text[start:end].lower() == tok


def test_tokenize_ignores_punctuation():
    tokens = _tokenize("Hello, world!")
    words = [t for t, _, _ in tokens]
    assert words == ["hello", "world"]


def test_hash_ngram_is_deterministic():
    ngram = ("the", "quick", "brown", "fox", "jumps")
    assert _hash_ngram(ngram) == _hash_ngram(ngram)


def test_hash_different_ngrams_differ():
    a = _hash_ngram(("the", "quick", "brown", "fox", "jumps"))
    b = _hash_ngram(("over", "the", "lazy", "dog", "today"))
    assert a != b


def test_identical_texts_full_similarity():
    text = ("Artificial intelligence is transforming the way we build software. " * 4).strip()
    fp1 = build_fingerprints(text)
    fp2 = build_fingerprints(text)
    assert jaccard_similarity(fp1["hashes"], fp2["hashes"]) == 1.0


def test_unrelated_texts_zero_similarity():
    fp1 = build_fingerprints("The weather is sunny and warm in the garden today.")
    fp2 = build_fingerprints("Quantum mechanics governs subatomic particle behavior.")
    assert jaccard_similarity(fp1["hashes"], fp2["hashes"]) == 0.0


def test_near_copy_high_similarity():
    original = (
        "Artificial intelligence is transforming the way we build software. "
        "Machine learning models can now write code and assist developers in complex tasks."
    )
    copy = (
        "Artificial intelligence is transforming how we build software. "
        "Machine learning models can write code and assist developers in complex tasks."
    )
    fp_orig = build_fingerprints(original)
    fp_copy = build_fingerprints(copy)
    assert jaccard_similarity(fp_orig["hashes"], fp_copy["hashes"]) > 0.25


def test_empty_text_returns_empty():
    fp = build_fingerprints("")
    assert fp["hashes"] == []
    assert fp["positions"] == {}


def test_very_short_text_no_error():
    fp = build_fingerprints("hello")
    assert isinstance(fp["hashes"], list)


def test_fingerprints_include_positions():
    text = "The quick brown fox jumps over the lazy dog and keeps on running fast today."
    fp = build_fingerprints(text)
    assert len(fp["hashes"]) > 0
    for h in fp["hashes"]:
        key = str(h)
        assert key in fp["positions"]
        assert len(fp["positions"][key]) > 0
        for pos in fp["positions"][key]:
            assert len(pos) == 2
            start, end = pos
            assert 0 <= start < end <= len(text)


def test_jaccard_both_empty():
    assert jaccard_similarity([], []) == 0.0


def test_jaccard_one_empty():
    fp = build_fingerprints("Some text about machine learning and AI systems today.")
    assert jaccard_similarity(fp["hashes"], []) == 0.0
    assert jaccard_similarity([], fp["hashes"]) == 0.0
