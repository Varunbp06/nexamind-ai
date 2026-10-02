import logging
import os

from cryptography.fernet import Fernet

logger = logging.getLogger(__name__)


def _load_encryption_key() -> bytes:
    """Resolve the Fernet key used to protect stored provider credentials.

    Provider credentials (LLM, embedding, vector DB, MCP, tools, guardrail,
    websearch, codesandbox) are encrypted at rest with this key, so the key
    must never be committed to the repository: anyone holding it could decrypt
    every credential of every deployment that did not override it.

    A previously committed fallback key made that the default for any
    deployment missing the variable. The fallback is now a key generated
    randomly for this process. That keeps local development and CI working
    while ensuring the key is never shared, at the cost of making stored
    ciphertext unrecoverable after a restart -- which is announced loudly so
    the operator configures ENCRYPTION_KEY for anything persistent.
    """
    configured = os.getenv("ENCRYPTION_KEY")
    if configured and configured.strip():
        key = configured.strip().encode()
        try:
            Fernet(key)
        except (ValueError, TypeError) as exc:
            raise RuntimeError(
                "ENCRYPTION_KEY is set but is not a valid Fernet key. "
                "Generate one with: python -c \"from cryptography.fernet import "
                'Fernet; print(Fernet.generate_key().decode())"'
            ) from exc
        return key

    logger.warning(
        "ENCRYPTION_KEY is not set; generating a random key for this process. "
        "Credentials encrypted now cannot be decrypted after a restart. Set "
        "ENCRYPTION_KEY to a stable Fernet key before storing real credentials."
    )
    return Fernet.generate_key()


ENCRYPTION_KEY = _load_encryption_key()
cipher = Fernet(ENCRYPTION_KEY)


def encrypt_key(key: str) -> str:
    if not key:
        return key

    return cipher.encrypt(key.encode()).decode()


def decrypt_key(key: str) -> str:
    if not key:
        return key

    return cipher.decrypt(key.encode()).decode()


if __name__ == "__main__":
    encrypted_key = encrypt_key("123")
    print(encrypted_key)
    key = decrypt_key(encrypted_key)

    print(encrypted_key, key)