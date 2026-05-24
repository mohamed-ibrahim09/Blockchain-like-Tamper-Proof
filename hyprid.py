from playfair import DEFAULT_PLAYFAIR_KEY, playfair_algorithm, playfair_decrypt
from rsa import rsa_algorithm, rsa_decrypt
from vignere import DEFAULT_VIGENERE_KEY, vig_decrypt, vignere_algorithm

DEFAULT_HYBRID_PIPELINE = ("playfair", "vigenere", "rsa")


def _is_error(value: str) -> bool:
    return value.startswith("[ERROR")


def hybrid_encrypt(
    message: str,
    vig_key: str = DEFAULT_VIGENERE_KEY,
    play_k: str = DEFAULT_PLAYFAIR_KEY,
) -> str:
    """
    Encrypt using pipeline: Playfair → Vigenere → RSA.
    Returns the encrypted string or '[ERROR: ...]' with a descriptive message.
    """

    if not message or not message.strip():
        return "[ERROR: Message is empty.]"

    # Step 1 — Playfair
    # playfair_algorithm returns "CIPHERTEXT|original_len"
    playfair_output = playfair_algorithm(message, play_k)
    if _is_error(playfair_output):
        return f"[ERROR: Playfair encrypt failed — {playfair_output}]"

    # Step 2 — Vigenere
    # Vigenere works on alpha chars; the "|len" suffix from Playfair must be
    # carried through intact. We encrypt only the cipher part and reattach suffix.
    if "|" in playfair_output:
        cipher_part, length_suffix = playfair_output.rsplit("|", 1)
    else:
        cipher_part, length_suffix = playfair_output, None

    vigenere_output = vignere_algorithm(cipher_part, vig_key)
    if _is_error(vigenere_output):
        return f"[ERROR: Vigenere encrypt failed — {vigenere_output}]"

    # Reattach length suffix so decrypt can unpad precisely
    combined = f"{vigenere_output}|{length_suffix}" if length_suffix is not None else vigenere_output

    # Step 3 — RSA
    rsa_output = rsa_algorithm(combined)
    if _is_error(rsa_output):
        return f"[ERROR: RSA encrypt failed — {rsa_output}]"

    return rsa_output


def hybrid_decrypt(
    cipher: str,
    vig_key: str = DEFAULT_VIGENERE_KEY,
    play_k: str = DEFAULT_PLAYFAIR_KEY,
) -> str:
    """
    Decrypt using reverse pipeline: RSA → Vigenere → Playfair.
    Returns the original plaintext or '[ERROR: ...]'.
    """

    if not cipher or not cipher.strip():
        return "[ERROR: Ciphertext is empty.]"

    # Step 1 — RSA decrypt
    rsa_output = rsa_decrypt(cipher)
    if _is_error(rsa_output):
        return f"[ERROR: RSA decrypt failed — {rsa_output}]"

    # Step 2 — Vigenere decrypt
    # Split off the "|length" suffix before passing to Vigenere
    if "|" in rsa_output:
        vigenere_input, length_suffix = rsa_output.rsplit("|", 1)
    else:
        vigenere_input, length_suffix = rsa_output, None

    vigenere_output = vig_decrypt(vigenere_input, vig_key)
    if _is_error(vigenere_output):
        return f"[ERROR: Vigenere decrypt failed — {vigenere_output}]"

    # Reattach length suffix for Playfair to use during unpadding
    playfair_input = f"{vigenere_output}|{length_suffix}" if length_suffix is not None else vigenere_output

    # Step 3 — Playfair decrypt (removes padding precisely using embedded length)
    playfair_output = playfair_decrypt(playfair_input, play_k)
    if _is_error(playfair_output):
        return f"[ERROR: Playfair decrypt failed — {playfair_output}]"

    return playfair_output
