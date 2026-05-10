from dataclasses import dataclass
from typing import Any

from app.services.legacy_crypto_loader import (
    get_hybrid_module,
    get_playfair_module,
    get_rsa_module,
    get_vigenere_module,
)


class CryptoServiceError(ValueError):
    pass


@dataclass
class EncryptionResult:
    encrypted_message: str
    key_metadata: dict[str, Any]
    hybrid_steps: list[dict[str, Any]] | None
    pipeline: list[str]


class CryptoService:
    def encrypt(
        self,
        *,
        algorithm: str,
        message: str,
        key: str | None = None,
        hybrid_steps: list[dict[str, str]] | None = None,
    ) -> EncryptionResult:
        if algorithm == "hybrid":
            return self._encrypt_hybrid(message)

        encrypted_message, key_metadata = self._encrypt_single(algorithm, message, key or "")
        return EncryptionResult(
            encrypted_message=encrypted_message,
            key_metadata=key_metadata,
            hybrid_steps=None,
            pipeline=[algorithm],
        )

    def decrypt(
        self,
        *,
        algorithm: str,
        encrypted_message: str,
        key_metadata: dict[str, Any],
        hybrid_steps: list[dict[str, Any]] | None = None,
    ) -> tuple[str, list[str]]:
        if algorithm == "hybrid":
            decrypted_message = self._decrypt_hybrid(encrypted_message)
            return decrypted_message, ["playfair", "vigenere", "rsa"]

        return self._decrypt_single(algorithm, encrypted_message, key_metadata["key"]), [algorithm]

    def _encrypt_single(self, algorithm: str, message: str, key: str) -> tuple[str, dict[str, Any]]:
        try:
            if algorithm == "playfair":
                module = get_playfair_module()
                encrypted = module.encrypt(message, key)
                return encrypted, {
                    "key": key,
                    "preprocessing": "Repo-local Playfair preprocessing from playfair.py.",
                }
            if algorithm == "vigenere":
                module = get_vigenere_module()
                encrypted = module.vigenere_encrypt(message, key)
                if isinstance(encrypted, str) and encrypted.startswith("Error:"):
                    raise CryptoServiceError(encrypted)
                return encrypted, {
                    "key": key,
                    "preprocessing": "Repo-local Vigenere processing from vignere.py.",
                }
            if algorithm == "rsa":
                module = get_rsa_module()
                p, q = 61, 53
                if key and "," in key:
                    try:
                        p, q = map(int, key.split(","))
                    except ValueError:
                        pass
                encrypted = module.rsa_algorithm(message, p, q)
                if isinstance(encrypted, str) and encrypted.startswith("[ERROR"):
                    raise CryptoServiceError(f"RSA encryption failed: {encrypted}")
                return encrypted, {
                    "key": f"{p},{q}",
                    "preprocessing": f"Repo-local RSA processing from rsa.py using primes {p} and {q}.",
                }
            raise CryptoServiceError(f"Unsupported algorithm: {algorithm}")
        except (KeyError, ValueError, FileNotFoundError) as exc:
            raise CryptoServiceError(str(exc)) from exc

    def _decrypt_single(self, algorithm: str, encrypted_message: str, key: str) -> str:
        try:
            if algorithm == "playfair":
                module = get_playfair_module()
                return module.decrypt(encrypted_message, key)
            if algorithm == "vigenere":
                module = get_vigenere_module()
                decrypted = module.vigenere_decrypt(encrypted_message, key)
                if isinstance(decrypted, str) and decrypted.startswith("Error:"):
                    raise CryptoServiceError(decrypted)
                return decrypted
            if algorithm == "rsa":
                module = get_rsa_module()
                p, q = 61, 53
                if key and "," in key:
                    try:
                        p, q = map(int, key.split(","))
                    except ValueError:
                        pass
                decrypted = module.rsa_decrypt(encrypted_message, p, q)
                if isinstance(decrypted, str) and decrypted.startswith("[ERROR"):
                    raise CryptoServiceError(f"RSA decryption failed: {decrypted}")
                return decrypted
            raise CryptoServiceError(f"Unsupported algorithm: {algorithm}")
        except (KeyError, ValueError, FileNotFoundError) as exc:
            raise CryptoServiceError(str(exc)) from exc

    def _encrypt_hybrid(self, message: str) -> EncryptionResult:
        module = get_hybrid_module()
        encrypt_fn = getattr(module, "hybrid_encrypt", None) or getattr(module, "enhanced_algorithm", None)
        if encrypt_fn is None:
            raise CryptoServiceError("The repo-local hybrid module does not expose a supported encrypt function.")

        encrypted_value = encrypt_fn(message)
        if isinstance(encrypted_value, str) and encrypted_value.startswith("[ERROR"):
            raise CryptoServiceError(f"Hybrid encryption failed: {encrypted_value}")

        steps_metadata = [
            {
                "algorithm": "playfair",
                "key": "SECURITY",
                "preprocessing": "Repo-local Playfair preprocessing from the hybrid module.",
            },
            {
                "algorithm": "vigenere",
                "key": "SECURITY",
                "preprocessing": "Repo-local Vigenere preprocessing from the hybrid module.",
            },
            {
                "algorithm": "rsa",
                "key": "repo-local-rsa-keypair",
                "preprocessing": "Repo-local RSA transformation from the hybrid module.",
            },
        ]
        return EncryptionResult(
            encrypted_message=encrypted_value,
            key_metadata={
                "mode": "hybrid",
                "pipeline": ["playfair", "vigenere", "rsa"],
                "step_count": len(steps_metadata),
                "source": "Repo-local hybrid implementation from hyprid.py",
            },
            hybrid_steps=steps_metadata,
            pipeline=["playfair", "vigenere", "rsa"],
        )

    def _decrypt_hybrid(self, encrypted_message: str) -> str:
        module = get_hybrid_module()
        decrypt_fn = getattr(module, "hybrid_decrypt", None) or getattr(module, "enhance_decrypt", None)
        if decrypt_fn is None:
            raise CryptoServiceError("The repo-local hybrid module does not expose a supported decrypt function.")

        decrypted_value = decrypt_fn(encrypted_message)
        if isinstance(decrypted_value, str) and decrypted_value.startswith("[ERROR"):
            raise CryptoServiceError(f"Hybrid decryption failed: {decrypted_value}")
        return decrypted_value


crypto_service = CryptoService()
