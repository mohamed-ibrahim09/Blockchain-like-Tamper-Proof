import re
import time


def build_matrix(key: str) -> tuple[list[str], dict[str, tuple[int, int]]]:
    """Build the 5x5 Playfair matrix from the key."""
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


def prepare_bigrams(plaintext: str) -> list[tuple[str, str]]:
    """Prepare text into bigrams for Playfair encryption."""
    clean = re.sub(r'[^A-Z]', '', plaintext.upper()).replace('J', 'I')
    if not clean:
        raise ValueError("Plaintext must contain at least one alphabetical character.")
    bigrams, i = [], 0
    while i < len(clean):
        a = clean[i]
        if i + 1 == len(clean):
            bigrams.append((a, 'X'))
            break
        b = clean[i + 1]
        if a == b:
            bigrams.append((a, 'X'))
            i += 1
        else:
            bigrams.append((a, b))
            i += 2
    return bigrams


def encrypt_playfair(text: str, key: str = "BLOCKCHAIN") -> dict:
    """Encrypt text using the Playfair cipher."""
    start = time.perf_counter()

    grid, pos = build_matrix(key)
    bigrams = prepare_bigrams(text)
    out = [''] * (len(bigrams) * 2)

    for i, (a, b) in enumerate(bigrams):
        ra, ca = pos[a]
        rb, cb = pos[b]
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
        "execution_time": round((end - start) * 1000, 3),
    }
