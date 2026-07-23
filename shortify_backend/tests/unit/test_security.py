"""Unit tests for security utilities: password hashing and JWT."""

import time

import pytest
from jose import JWTError

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_token_jti,
    hash_password,
    verify_password,
)


class TestPasswordHashing:
    def test_hash_password_returns_string(self):
        hashed = hash_password("MySecurePass1")
        assert isinstance(hashed, str)
        assert len(hashed) > 20

    def test_hash_is_not_plaintext(self):
        plain = "MySecurePass1"
        hashed = hash_password(plain)
        assert hashed != plain

    def test_verify_correct_password(self):
        plain = "MySecurePass1"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("CorrectPassword1")
        assert verify_password("WrongPassword1", hashed) is False

    def test_same_password_different_hashes(self):
        """bcrypt uses unique salt per hash — same input → different output."""
        plain = "MySecurePass1"
        h1 = hash_password(plain)
        h2 = hash_password(plain)
        assert h1 != h2
        # Both should still verify correctly
        assert verify_password(plain, h1)
        assert verify_password(plain, h2)


class TestJWT:
    def test_create_access_token(self):
        token = create_access_token({"sub": "user-123", "role": "user"})
        assert isinstance(token, str)
        assert len(token) > 0

    def test_decode_access_token(self):
        data = {"sub": "user-123", "role": "user"}
        token = create_access_token(data)
        payload = decode_token(token)
        assert payload["sub"] == "user-123"
        assert payload["role"] == "user"
        assert payload["type"] == "access"

    def test_access_token_has_jti(self):
        token = create_access_token({"sub": "user-123"})
        payload = decode_token(token)
        assert "jti" in payload
        assert len(payload["jti"]) > 0

    def test_refresh_token_type(self):
        token = create_refresh_token({"sub": "user-123"})
        payload = decode_token(token)
        assert payload["type"] == "refresh"

    def test_access_and_refresh_have_different_jtis(self):
        data = {"sub": "user-123"}
        access = create_access_token(data)
        refresh = create_refresh_token(data)
        p1 = decode_token(access)
        p2 = decode_token(refresh)
        assert p1["jti"] != p2["jti"]

    def test_invalid_token_raises(self):
        with pytest.raises(JWTError):
            decode_token("not.a.valid.token")

    def test_tampered_token_raises(self):
        token = create_access_token({"sub": "user-123"})
        tampered = token[:-5] + "XXXXX"
        with pytest.raises(JWTError):
            decode_token(tampered)

    def test_get_token_jti_extracts_correctly(self):
        token = create_access_token({"sub": "user-123"})
        payload = decode_token(token)
        jti = get_token_jti(token)
        assert jti == payload["jti"]

    def test_get_token_jti_invalid_token_returns_none(self):
        jti = get_token_jti("garbage.token.here")
        assert jti is None
