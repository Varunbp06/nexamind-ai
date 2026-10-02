"""Regression tests for the credential-encryption key source.

The original module shipped a hardcoded Fernet key and used it whenever
ENCRYPTION_KEY was unset, so provider credentials were encrypted with a value
published in the repository. These tests pin the corrected behaviour: a random
per-process key when the variable is absent, a validated stable key when it is
present, and no committed fallback left in the source.
"""

import importlib
import os
import re
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))

SOURCE_PATH = os.path.join(
    os.path.dirname(__file__), "../../backend/common/encrypt_utils.py"
)


def _load_module(monkeypatch, key_value):
    """Reimport encrypt_utils with ENCRYPTION_KEY set to key_value (or unset)."""
    if key_value is None:
        monkeypatch.delenv("ENCRYPTION_KEY", raising=False)
    else:
        monkeypatch.setenv("ENCRYPTION_KEY", key_value)

    sys.modules.pop("common.encrypt_utils", None)
    return importlib.import_module("common.encrypt_utils")


class TestNoCommittedKey:
    def test_source_has_no_hardcoded_fernet_key(self):
        """A Fernet key literal must never be committed to the repository."""
        with open(SOURCE_PATH, encoding="utf-8") as handle:
            source = handle.read()

        # A Fernet key is 44 url-safe base64 characters ending in '='.
        literals = re.findall(r"[A-Za-z0-9_-]{43}=", source)
        assert not literals, f"hardcoded Fernet key literal(s) found: {literals}"

    def test_source_does_not_define_a_default_key_constant(self):
        with open(SOURCE_PATH, encoding="utf-8") as handle:
            source = handle.read()

        assert "DEFAULT_ENCRYPTION_KEY" not in source


class TestKeyResolution:
    def test_unset_key_generates_a_random_key(self, monkeypatch):
        module = _load_module(monkeypatch, None)

        assert module.ENCRYPTION_KEY is not None
        other = _load_module(monkeypatch, None)
        assert module.ENCRYPTION_KEY != other.ENCRYPTION_KEY

    def test_unset_key_warns_loudly(self, monkeypatch, caplog):
        with caplog.at_level("WARNING"):
            _load_module(monkeypatch, None)

        assert any(
            "ENCRYPTION_KEY" in record.message for record in caplog.records
        ), "missing the warning that the key is not persistent"

    def test_configured_key_is_used_verbatim(self, monkeypatch):
        from cryptography.fernet import Fernet

        configured = Fernet.generate_key().decode()
        module = _load_module(monkeypatch, configured)

        assert module.ENCRYPTION_KEY.decode() == configured

    def test_invalid_configured_key_fails_loudly(self, monkeypatch):
        with pytest.raises(RuntimeError, match="not a valid Fernet key"):
            _load_module(monkeypatch, "not-a-real-fernet-key")

    def test_blank_configured_key_falls_back_to_random(self, monkeypatch):
        module = _load_module(monkeypatch, "   ")

        assert module.ENCRYPTION_KEY is not None

    def test_two_deployments_do_not_share_a_key(self, monkeypatch):
        first = _load_module(monkeypatch, None)
        second = _load_module(monkeypatch, None)

        assert first.ENCRYPTION_KEY != second.ENCRYPTION_KEY