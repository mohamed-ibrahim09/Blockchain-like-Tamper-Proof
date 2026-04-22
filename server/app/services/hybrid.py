"""
Hybrid Encryption Service

Combines Playfair, Vigenere, and RSA encryption algorithms for maximum security.
Encryption order: Playfair → Vigenere → RSA
Decryption order: RSA → Vigenere → Playfair
"""

from typing import Optional, Tuple
from .playfair import encrypt_playfair, decrypt_playfair
from .vigenere import encrypt_vigenere, decrypt_vigenere
from .rsa import encrypt_rsa, decrypt_rsa


def validate_key(key: str, algorithm_name: str) -> str:
    """Validate and sanitize encryption key."""
    if not key or not isinstance(key, str):
        raise ValueError(f"{algorithm_name} key must be a non-empty string")
    if len(key) < 2:
        raise ValueError(f"{algorithm_name} key must be at least 2 characters long")
    # Remove non-alphabetic characters for classical ciphers
    sanitized = ''.join(c for c in key if c.isalpha())
    if not sanitized:
        raise ValueError(f"{algorithm_name} key must contain at least one letter")
    return sanitized.upper()


def validate_rsa_primes(p: int, q: int) -> Tuple[int, int]:
    """Validate RSA prime factors."""
    from .rsa import is_prime

    if not isinstance(p, int) or not isinstance(q, int):
        raise ValueError("RSA primes must be integers")
    if p < 2 or q < 2:
        raise ValueError("RSA primes must be greater than 1")
    if p == q:
        raise ValueError("RSA primes p and q must be different")
    if not is_prime(p):
        raise ValueError(f"p={p} is not a prime number")
    if not is_prime(q):
        raise ValueError(f"q={q} is not a prime number")
    # Ensure n = p*q is large enough for ASCII encoding (n >= 256)
    n = p * q
    if n < 256:
        raise ValueError(f"Product n={n} is too small. p*q must be at least 256 for ASCII encoding.")
    return p, q


def hybrid_encrypt(
    message: str,
    playfair_key: str,
    vigenere_key: str,
    rsa_p: Optional[int] = None,
    rsa_q: Optional[int] = None
) -> dict:
    """
    Encrypt using hybrid algorithm: Playfair → Vigenere → RSA

    Args:
        message: Plaintext to encrypt
        playfair_key: Key for Playfair cipher layer
        vigenere_key: Key for Vigenere cipher layer
        rsa_p: First prime for RSA (auto-generated if None)
        rsa_q: Second prime for RSA (auto-generated if None)

    Returns:
        Dictionary with encrypted data and all key information
    """
    import time
    start = time.perf_counter()

    # Validate inputs
    if not message or not isinstance(message, str):
        raise ValueError("Message must be a non-empty string")

    playfair_key = validate_key(playfair_key, "Playfair")
    vigenere_key = validate_key(vigenere_key, "Vigenere")

    # Layer 1: Playfair encryption
    # Note: Playfair converts to uppercase and removes non-letters
    playfair_result = encrypt_playfair(message, playfair_key)
    playfair_output = playfair_result["encrypted_data"]

    # Layer 2: Vigenere encryption (on Playfair output)
    vigenere_result = encrypt_vigenere(playfair_output, vigenere_key)
    vigenere_output = vigenere_result["encrypted_data"]

    # Layer 3: RSA encryption (on combined output)
    if rsa_p is not None and rsa_q is not None:
        rsa_p, rsa_q = validate_rsa_primes(rsa_p, rsa_q)
        rsa_result = encrypt_rsa(vigenere_output, p=rsa_p, q=rsa_q)
    else:
        rsa_result = encrypt_rsa(vigenere_output)

    end = time.perf_counter()
    total_time = round((end - start) * 1000, 3)

    return {
        "algorithm": "Hybrid",
        "encrypted_data": rsa_result["encrypted_data"],
        "playfair_key": playfair_key,
        "vigenere_key": vigenere_key,
        "rsa_p": rsa_result["p"],
        "rsa_q": rsa_result["q"],
        "rsa_public_key": rsa_result["public_key"],
        "rsa_private_key": rsa_result["private_key"],
        "execution_time": total_time,
        "layer_times": {
            "playfair": playfair_result["execution_time"],
            "vigenere": vigenere_result["execution_time"],
            "rsa": rsa_result["execution_time"]
        }
    }


def hybrid_decrypt(
    cipher: str,
    playfair_key: str,
    vigenere_key: str,
    rsa_p: Optional[int] = None,
    rsa_q: Optional[int] = None,
    rsa_d: Optional[int] = None,
    rsa_n: Optional[int] = None
) -> dict:
    """
    Decrypt using hybrid algorithm: RSA → Vigenere → Playfair

    Args:
        cipher: Ciphertext to decrypt (comma-separated RSA numbers)
        playfair_key: Key for Playfair cipher layer
        vigenere_key: Key for Vigenere cipher layer
        rsa_p: First prime for RSA (alternative to d, n)
        rsa_q: Second prime for RSA (alternative to d, n)
        rsa_d: RSA private exponent (alternative to p, q)
        rsa_n: RSA modulus (alternative to p, q)

    Returns:
        Dictionary with decrypted data and timing information
    """
    import time
    start = time.perf_counter()

    # Validate inputs
    if not cipher or not isinstance(cipher, str):
        raise ValueError("Cipher must be a non-empty string")

    playfair_key = validate_key(playfair_key, "Playfair")
    vigenere_key = validate_key(vigenere_key, "Vigenere")

    # Layer 3: Decrypt RSA layer first
    if rsa_p is not None and rsa_q is not None:
        validate_rsa_primes(rsa_p, rsa_q)
        rsa_output = decrypt_rsa(cipher, p=rsa_p, q=rsa_q)
    elif rsa_d is not None and rsa_n is not None:
        if rsa_n < 256:
            raise ValueError(f"RSA modulus n={rsa_n} is too small. Must be at least 256.")
        rsa_output = decrypt_rsa(cipher, d=rsa_d, n=rsa_n)
    else:
        raise ValueError("RSA decryption requires either (p, q) or (d, n) parameters")

    # Layer 2: Decrypt Vigenere layer
    vigenere_output = decrypt_vigenere(rsa_output, vigenere_key)

    # Layer 1: Decrypt Playfair layer (removes X padding automatically)
    playfair_output = decrypt_playfair(vigenere_output, playfair_key)

    end = time.perf_counter()
    total_time = round((end - start) * 1000, 3)

    return {
        "algorithm": "Hybrid",
        "decrypted_data": playfair_output,
        "execution_time": total_time
    }


# Convenience functions for direct module usage
def encrypt(message: str, playfair_key: str, vigenere_key: str, rsa_p: int = None, rsa_q: int = None) -> dict:
    """Alias for hybrid_encrypt."""
    return hybrid_encrypt(message, playfair_key, vigenere_key, rsa_p, rsa_q)


def decrypt(cipher: str, playfair_key: str, vigenere_key: str, rsa_p: int = None, rsa_q: int = None) -> dict:
    """Alias for hybrid_decrypt with p, q parameters."""
    return hybrid_decrypt(cipher, playfair_key, vigenere_key, rsa_p=rsa_p, rsa_q=rsa_q)
