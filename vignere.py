LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
DEFAULT_VIGENERE_KEY = "SECURITY"


def vigenere_encrypt(message: str, key: str):
    return _translate(message, key, mode="encrypt")


def vigenere_decrypt(cipher: str, key: str):
    return _translate(cipher, key, mode="decrypt")


def _translate(message: str, key: str, mode: str):
    if message == "":
        raise ValueError("Message is empty.")

    if not key or not key.isalpha():
        raise ValueError("Key must contain letters only.")

    translated: list[str] = []
    key_index = 0
    normalized_key = key.upper()

    for symbol in message:
        number = LETTERS.find(symbol.upper())

        if number != -1:
            shift = LETTERS.find(normalized_key[key_index])
            if mode == "encrypt":
                number += shift
            elif mode == "decrypt":
                number -= shift
            else:
                raise ValueError("Mode must be encrypt or decrypt.")

            number %= len(LETTERS)
            translated.append(LETTERS[number] if symbol.isupper() else LETTERS[number].lower())
            key_index = (key_index + 1) % len(normalized_key)
        else:
            translated.append(symbol)

    return "".join(translated)


def vignere_algorithm(text: str, key: str = DEFAULT_VIGENERE_KEY):
    try:
        return vigenere_encrypt(text, key)
    except (TypeError, ValueError):
        return "[ERROR]"


def vig_decrypt(text: str, key: str = DEFAULT_VIGENERE_KEY):
    try:
        return vigenere_decrypt(text, key)
    except (TypeError, ValueError):
        return "[ERROR]"
