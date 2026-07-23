"""Unit tests for URL service utilities."""

import pytest

from app.services.url_service import _hash_url, _generate_slug, _build_short_url, NANOID_ALPHABET


class TestNanoID:
    def test_generate_slug_returns_correct_length(self):
        slug = _generate_slug(8)
        assert len(slug) == 8

    def test_generate_slug_uses_valid_alphabet(self):
        slug = _generate_slug(8)
        for char in slug:
            assert char in NANOID_ALPHABET, f"Invalid char: {char}"

    def test_generate_slug_unique(self):
        """Basic uniqueness check — not a statistical test."""
        slugs = {_generate_slug(8) for _ in range(100)}
        # With 64^8 combinations, 100 attempts should never collide
        assert len(slugs) == 100

    def test_generate_different_lengths(self):
        for length in [6, 8, 10, 12]:
            slug = _generate_slug(length)
            assert len(slug) == length


class TestURLHash:
    def test_hash_returns_64_chars(self):
        h = _hash_url("https://example.com")
        assert len(h) == 64

    def test_same_url_same_hash(self):
        url = "https://example.com/path?query=1"
        assert _hash_url(url) == _hash_url(url)

    def test_different_urls_different_hashes(self):
        h1 = _hash_url("https://example.com/a")
        h2 = _hash_url("https://example.com/b")
        assert h1 != h2

    def test_hash_is_hex(self):
        h = _hash_url("https://example.com")
        int(h, 16)  # Should not raise — all hex chars


class TestBuildShortURL:
    def test_builds_correct_url(self):
        short = _build_short_url("abc123")
        assert "abc123" in short
        assert short.startswith("http")
