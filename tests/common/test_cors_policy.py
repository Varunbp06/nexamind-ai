"""Regression tests for the API CORS policy.

The backend registered CORSMiddleware with ALLOWED_ORIGINS defaulting to "*".
It authenticates no user requests, so any origin could read and mutate every
tenant's configuration, knowledge bases and stored credentials through a
victim's browser. Origins are now same-origin-only unless ALLOWED_ORIGINS opts
in explicitly.
"""

import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))

MAIN_PATH = os.path.join(
    os.path.dirname(__file__), "../../backend/app/main.py"
)


def _resolve_origins(monkeypatch, value):
    """Execute main._cors_origins in isolation with ALLOWED_ORIGINS=value."""
    source = open(MAIN_PATH, encoding="utf-8").read()
    match = re.search(
        r"^def _cors_origins\(\).*?(?=^\S)", source, re.MULTILINE | re.DOTALL
    )
    assert match, "_cors_origins helper not found in app/main.py"
    body = match.group(0)

    namespace = {"os": os}
    exec(compile(body, "main.py", "exec"), namespace)  # noqa: S102
    return namespace["_cors_origins"]()


class TestCorsDefaults:
    def test_no_origins_allowed_when_unset(self, monkeypatch):
        monkeypatch.delenv("ALLOWED_ORIGINS", raising=False)
        assert _resolve_origins(monkeypatch, None) == []

    def test_no_wildcard_implicit_default(self, monkeypatch):
        """The regression: ALLOWED_ORIGINS used to default to '*'."""
        monkeypatch.delenv("ALLOWED_ORIGINS", raising=False)
        assert "*" not in _resolve_origins(monkeypatch, None)

    def test_empty_value_allows_nothing(self, monkeypatch):
        monkeypatch.setenv("ALLOWED_ORIGINS", "   ")
        assert _resolve_origins(monkeypatch, "   ") == []


class TestCorsExplicitOrigins:
    def test_single_origin(self, monkeypatch):
        monkeypatch.setenv("ALLOWED_ORIGINS", "https://nexamindai.vercel.app")
        assert _resolve_origins(monkeypatch, None) == [
            "https://nexamindai.vercel.app"
        ]

    def test_multiple_origins_trimmed(self, monkeypatch):
        value = "https://a.example.com, https://b.example.com ,"
        monkeypatch.setenv("ALLOWED_ORIGINS", value)
        assert _resolve_origins(monkeypatch, value) == [
            "https://a.example.com",
            "https://b.example.com",
        ]

    def test_blank_entries_dropped(self, monkeypatch):
        value = "https://a.example.com,,  ,https://b.example.com"
        monkeypatch.setenv("ALLOWED_ORIGINS", value)
        assert _resolve_origins(monkeypatch, value) == [
            "https://a.example.com",
            "https://b.example.com",
        ]


class TestNoWildcardRegistration:
    def test_source_does_not_register_wildcard_origins(self):
        source = open(MAIN_PATH, encoding="utf-8").read()
        assert 'allow_origins=["*"]' not in source
        assert "allow_origins=['*']" not in source

    def test_no_env_default_of_wildcard(self):
        """ALLOWED_ORIGINS must not carry a '*' fallback any more."""
        source = open(MAIN_PATH, encoding="utf-8").read()
        assert not re.search(r'ALLOWED_ORIGINS",\s*"\*"', source)

    def test_credentials_stay_disabled(self):
        """A wildcard origin plus credentials would be rejected by browsers
        anyway, and enabling cookies would change the auth model."""
        source = open(MAIN_PATH, encoding="utf-8").read()
        assert re.search(r"allow_credentials\s*=\s*False", source)