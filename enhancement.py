from hyprid import hybrid_decrypt, hybrid_encrypt


def enhanced_algorithm(data: str) -> str:
    """
    Hybrid encrypt: Playfair → Vigenere → RSA.
    Returns encrypted string or '[ERROR: ...]'.
    """
    if not isinstance(data, str):
        return "[ERROR: Input must be a string.]"
    return hybrid_encrypt(data)


def enhance_decrypt(data: str) -> str:
    """
    Hybrid decrypt: RSA → Vigenere → Playfair.
    Returns original plaintext or '[ERROR: ...]'.
    """
    if not isinstance(data, str):
        return "[ERROR: Input must be a string.]"
    return hybrid_decrypt(data)
