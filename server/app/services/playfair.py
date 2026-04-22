import re
import time


def build_matrix(key: str) -> tuple:
    key = re.sub(r'[^A-Z]', '', key.upper()).replace('J', 'I')
    if not key:
        raise ValueError("Key must contain at least one alphabetical character.")
    seen, grid = set(), []
    for ch in key + "ABCDEFGHIKLMNOPQRSTUVWXYZ":
        if ch not in seen:
            seen.add(ch)
            grid.append(ch)
    pos = {c: divmod(i, 5) for i, c in enumerate(grid)}
    return grid, pos


def prepare_bigrams(plaintext: str) -> list:
    clean = re.sub(r'[^A-Z]', '', plaintext.upper()).replace('J', 'I')
    if not clean:
        raise ValueError("Plaintext must contain at least one alphabetical character.")
    bigrams, i = [], 0
    while i < len(clean):
        a = clean[i]
        if i + 1 == len(clean):
            bigrams.append((a, 'X')); break
        b = clean[i + 1]
        if a == b:
            bigrams.append((a, 'X')); i += 1
        else:
            bigrams.append((a, b)); i += 2
    return bigrams


def encrypt_playfair(text: str, key: str = "BLOCKCHAIN") -> dict:
    start = time.perf_counter()
    grid, pos = build_matrix(key)
    bigrams = prepare_bigrams(text)
    out = [''] * (len(bigrams) * 2)
    for i, (a, b) in enumerate(bigrams):
        ra, ca = pos[a]; rb, cb = pos[b]
        if ra == rb:
            out[i*2], out[i*2+1] = grid[ra*5+(ca+1)%5], grid[rb*5+(cb+1)%5]
        elif ca == cb:
            out[i*2], out[i*2+1] = grid[((ra+1)%5)*5+ca], grid[((rb+1)%5)*5+cb]
        else:
            out[i*2], out[i*2+1] = grid[ra*5+cb], grid[rb*5+ca]
    encrypted = ''.join(out)
    end = time.perf_counter()
    return {
        "algorithm": "Playfair",
        "encrypted_data": encrypted,
        "key_used": key.upper(),
        "execution_time": round((end - start) * 1000, 3),
    }


def decrypt_playfair(text: str, key: str = "BLOCKCHAIN") -> str:
    grid, pos = build_matrix(key)
    bigrams = [(text[i], text[i+1]) for i in range(0, len(text), 2)]
    out = []
    for a, b in bigrams:
        ra, ca = pos[a]; rb, cb = pos[b]
        if ra == rb:
            out += [grid[ra*5+(ca-1)%5], grid[rb*5+(cb-1)%5]]
        elif ca == cb:
            out += [grid[((ra-1)%5)*5+ca], grid[((rb-1)%5)*5+cb]]
        else:
            out += [grid[ra*5+cb], grid[rb*5+ca]]

    # Remove padding X's that were inserted during encryption
    result = ''.join(out)
    return _remove_playfair_padding(result)


def _remove_playfair_padding(text: str) -> str:
    """
    Remove X padding characters inserted during Playfair encryption.
    X's are inserted when:
    1. A pair contains identical letters (e.g., "LL" becomes "LX" + "L...")
    2. The plaintext has odd length (trailing X appended)
    """
    if not text:
        return text

    chars = list(text)

    # Remove trailing X if present (odd length padding)
    if chars and chars[-1] == 'X':
        chars.pop()

    # Remove X's that were inserted between duplicate letters
    # When encrypting "LL", it becomes "LX" with L carried to next bigram
    # On decryption, this appears as patterns where X is between same letters
    result = []
    i = 0
    while i < len(chars):
        # Check if current char is X and it's between two identical letters
        # This pattern indicates it was padding inserted during encryption
        if (chars[i] == 'X' and
            i > 0 and
            i < len(chars) - 1 and
            chars[i-1] == chars[i+1]):
            # Skip this X (it was padding)
            i += 1
            continue
        result.append(chars[i])
        i += 1

    return ''.join(result)