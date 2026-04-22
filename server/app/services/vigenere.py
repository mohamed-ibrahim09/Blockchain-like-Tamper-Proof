import time


def encrypt_vigenere(text: str, key: str = "TAMPERPROOF") -> dict:
    start = time.perf_counter()
    if not key:
        raise ValueError("Key must not be empty.")
    key = key.upper()
    result = []
    key_index = 0
    for char in text:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            shift = ord(key[key_index % len(key)]) - ord('A')
            result.append(chr((ord(char) - base + shift) % 26 + base))
            key_index += 1
        else:
            result.append(char)
    encrypted = ''.join(result)
    end = time.perf_counter()
    return {
        "algorithm": "Vigenere",
        "encrypted_data": encrypted,
        "key_used": key,
        "execution_time": round((end - start) * 1000, 3),
    }


def decrypt_vigenere(text: str, key: str = "TAMPERPROOF") -> str:
    if not key:
        raise ValueError("Key must not be empty.")
    key = key.upper()
    result = []
    key_index = 0
    for char in text:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            shift = ord(key[key_index % len(key)]) - ord('A')
            result.append(chr((ord(char) - base - shift) % 26 + base))
            key_index += 1
        else:
            result.append(char)
    return ''.join(result)