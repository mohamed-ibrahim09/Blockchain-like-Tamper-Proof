import time


def encrypt_vigenere(text: str, key: str = "TAMPERPROOF") -> dict:
    """Encrypt text using the Vigenere cipher."""
    start = time.perf_counter()
    
    if not key:
        raise ValueError("Key must not be empty.")
    
    key = key.upper()
    key_length = len(key)
    result = []
    key_index = 0
    
    for char in text:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            shift = ord(key[key_index % key_length]) - ord('A')
            encrypted_char = chr((ord(char) - base + shift) % 26 + base)
            result.append(encrypted_char)
            key_index += 1
        else:
            result.append(char)
    
    encrypted = ''.join(result)
    end = time.perf_counter()
    
    return {
        "algorithm": "Vigenere",
        "encrypted_data": encrypted,
        "execution_time": round((end - start) * 1000, 3),
    }
