from playfair import DEFAULT_PLAYFAIR_KEY, playfair_algorithm, playfair_decrypt
from rsa import rsa_algorithm, rsa_decrypt
from vignere import DEFAULT_VIGENERE_KEY, vig_decrypt, vignere_algorithm


DEFAULT_HYBRID_PIPELINE = ("playfair", "vigenere", "rsa")


def hybrid_encrypt(
    message: str,
    vig_key: str = DEFAULT_VIGENERE_KEY,
    rsa_pub_key=None,
    play_k: str = DEFAULT_PLAYFAIR_KEY,
):
    del rsa_pub_key
    playfair_output = playfair_algorithm(message, play_k)
    if playfair_output == "[ERROR]":
        return "[ERROR]"

    vigenere_output = vignere_algorithm(playfair_output, vig_key)
    if vigenere_output == "[ERROR]":
        return "[ERROR]"

    rsa_output = rsa_algorithm(vigenere_output)
    return rsa_output


def hybrid_decrypt(
    cipher: str,
    vig_key: str = DEFAULT_VIGENERE_KEY,
    rsa_priv_key=None,
    play_k: str = DEFAULT_PLAYFAIR_KEY,
):
    del rsa_priv_key
    rsa_output = rsa_decrypt(cipher)
    if rsa_output == "[ERROR]":
        return "[ERROR]"

    vigenere_output = vig_decrypt(rsa_output, vig_key)
    if vigenere_output == "[ERROR]":
        return "[ERROR]"

    playfair_output = playfair_decrypt(vigenere_output, play_k)
    return playfair_output
