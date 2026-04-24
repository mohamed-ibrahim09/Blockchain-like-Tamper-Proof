from app.services.legacy_crypto_loader import (
    get_hybrid_module,
    get_playfair_module,
    get_rsa_module,
    get_vigenere_module,
)


class CryptoSelfCheckError(RuntimeError):
    pass


def _assert(condition: bool, message: str) -> None:
    if not condition:
        raise CryptoSelfCheckError(message)


def run_crypto_self_check() -> None:
    playfair_module = get_playfair_module()
    vigenere_module = get_vigenere_module()
    rsa_module = get_rsa_module()
    hybrid_module = get_hybrid_module()

    playfair_cipher = playfair_module.encrypt("CAMPUS", "SECURITY")
    _assert(playfair_cipher != "[ERROR]", "Playfair encryption self-check failed.")
    playfair_plain = playfair_module.decrypt(playfair_cipher, "SECURITY")
    _assert(playfair_plain == "CAMPUS", "Playfair decryption self-check failed.")

    vigenere_cipher = vigenere_module.vigenere_encrypt("Campus log", "SECURITY")
    _assert(vigenere_cipher != "[ERROR]", "Vigenere encryption self-check failed.")
    vigenere_plain = vigenere_module.vigenere_decrypt(vigenere_cipher, "SECURITY")
    _assert(vigenere_plain == "Campus log", "Vigenere decryption self-check failed.")

    rsa_cipher = rsa_module.rsa_algorithm("Campus log")
    _assert(rsa_cipher != "[ERROR]", "RSA encryption self-check failed.")
    rsa_plain = rsa_module.rsa_decrypt(rsa_cipher)
    _assert(rsa_plain == "Campus log", "RSA decryption self-check failed.")

    hybrid_encrypt = getattr(hybrid_module, "hybrid_encrypt", None) or getattr(hybrid_module, "enhanced_algorithm", None)
    hybrid_decrypt = getattr(hybrid_module, "hybrid_decrypt", None) or getattr(hybrid_module, "enhance_decrypt", None)
    _assert(callable(hybrid_encrypt), "Hybrid module does not expose a supported encrypt function.")
    _assert(callable(hybrid_decrypt), "Hybrid module does not expose a supported decrypt function.")

    hybrid_cipher = hybrid_encrypt("CAMPUS")
    _assert(hybrid_cipher != "[ERROR]", "Hybrid encryption self-check failed.")
    hybrid_plain = hybrid_decrypt(hybrid_cipher)
    _assert(hybrid_plain == "CAMPUS", "Hybrid decryption self-check failed.")
