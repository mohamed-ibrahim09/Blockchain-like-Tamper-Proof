import time
import random
import math


def is_prime(n: int, k: int = 10) -> bool:
    """Miller-Rabin primality test."""
    if n < 2:
        return False
    if n in (2, 3):
        return True
    if n % 2 == 0:
        return False
    r, d = 0, n - 1
    while d % 2 == 0:
        r += 1
        d //= 2
    for _ in range(k):
        a = random.randrange(2, n - 1)
        x = pow(a, d, n)
        if x == 1 or x == n - 1:
            continue
        for _ in range(r - 1):
            x = pow(x, 2, n)
            if x == n - 1:
                break
        else:
            return False
    return True


def generate_prime(bits: int = 32) -> int:
    """Generate a random prime number with specified bits."""
    while True:
        n = random.getrandbits(bits) | (1 << bits - 1) | 1
        if is_prime(n):
            return n


def mod_inverse(e: int, phi: int) -> int:
    """Extended Euclidean Algorithm to find modular inverse of e mod phi."""
    def extended_gcd(a, b):
        if a == 0:
            return b, 0, 1
        gcd, x1, y1 = extended_gcd(b % a, a)
        x = y1 - (b // a) * x1
        y = x1
        return gcd, x, y

    gcd, x, _ = extended_gcd(e, phi)
    if gcd != 1:
        raise ValueError(f"No modular inverse exists for e={e} and phi={phi} (gcd={gcd})")
    return (x % phi + phi) % phi


def generate_keypair_from_primes(p: int, q: int) -> tuple:
    """Generate RSA keypair from user-provided primes p and q."""
    if p == q:
        raise ValueError("p and q must be different primes")
    if not is_prime(p):
        raise ValueError(f"p={p} is not a prime number")
    if not is_prime(q):
        raise ValueError(f"q={q} is not a prime number")

    n = p * q
    phi = (p - 1) * (q - 1)

    e = 65537
    if math.gcd(e, phi) != 1:
        # Find a suitable e
        for candidate in [3, 5, 17, 257, 65537]:
            if math.gcd(candidate, phi) == 1:
                e = candidate
                break
        else:
            raise ValueError("Could not find suitable public exponent e")

    d = mod_inverse(e, phi)
    return (e, n), (d, n), p, q


def generate_keypair(bits: int = 32) -> tuple:
    """Generate RSA public and private key pair with random primes."""
    p = generate_prime(bits)
    q = generate_prime(bits)
    while q == p:
        q = generate_prime(bits)

    pub, priv, p_used, q_used = generate_keypair_from_primes(p, q)
    return pub, priv, p_used, q_used


def encrypt_rsa(text: str, p: int = None, q: int = None) -> dict:
    """
    Encrypt text using RSA algorithm.
    If p and q are provided, use them; otherwise generate random primes.
    """
    start = time.perf_counter()

    if p is not None and q is not None:
        # Use user-provided primes
        public_key, private_key, p_used, q_used = generate_keypair_from_primes(p, q)
    else:
        # Generate random primes (use smaller bits for reasonable performance)
        public_key, private_key, p_used, q_used = generate_keypair(32)

    e, n = public_key
    d, _ = private_key

    # Debug logging - show keys for verification
    print(f"[RSA Encrypt] KEYS: n={n}, e={e}, d={d}, p={p_used}, q={q_used}")
    print(f"[RSA Encrypt] Text: {repr(text)}")

    # Encrypt each character
    encrypted_values = []
    for i, c in enumerate(text):
        char_code = ord(c)
        encrypted_val = pow(char_code, e, n)
        encrypted_values.append(str(encrypted_val))

    encrypted = ','.join(encrypted_values)
    end = time.perf_counter()

    return {
        "algorithm": "RSA",
        "encrypted_data": encrypted,
        "execution_time": round((end - start) * 1000, 3),
        "public_key": {"e": e, "n": n},
        "private_key": {"d": d, "n": n},
        "p": p_used,
        "q": q_used,
    }


def decrypt_rsa(cipher: str, p: int = None, q: int = None, d: int = None, n: int = None) -> str:
    """
    Decrypt RSA ciphertext.
    Can use either (p, q) pair or (d, n) pair.
    Returns the original plaintext with proper character encoding.
    """
    if not cipher or not isinstance(cipher, str):
        raise ValueError("Ciphertext must be a non-empty string")

    # Validate required parameters
    if d is not None and n is not None:
        d_val, n_val = d, n
    elif p is not None and q is not None:
        # Compute d from p and q
        _, priv, _, _ = generate_keypair_from_primes(p, q)
        d_val, n_val = priv
    else:
        raise ValueError("Must provide either (p, q) or (d, n) for decryption")

    # Debug logging
    print(f"[RSA Decrypt] Cipher: {cipher[:100]}..., n={n_val}, d={d_val}")

    # Validate n is sufficient for ASCII encoding
    if n_val < 256:
        raise ValueError(f"Modulus n={n_val} is too small. Must be at least 256 to support ASCII encoding.")

    # Decrypt each number in the ciphertext
    decrypted_chars = []
    cipher_parts = cipher.split(',')
    print(f"[RSA Decrypt] Cipher parts count: {len(cipher_parts)}")

    for i, x in enumerate(cipher_parts):
        x = x.strip()
        if not x:
            continue  # Skip empty segments
        try:
            encrypted_val = int(x)
            decrypted_val = pow(encrypted_val, d_val, n_val)

            if i < 3:  # Log first 3 for debugging
                print(f"[RSA Decrypt] Part {i}: encrypted={encrypted_val} -> decrypted_code={decrypted_val} -> char={repr(chr(decrypted_val))}")

            # Validate decrypted value is in valid ASCII range
            if decrypted_val < 0 or decrypted_val > 1114111:  # Max Unicode code point
                raise ValueError(f"Decrypted value {decrypted_val} is out of valid character range")

            decrypted_chars.append(chr(decrypted_val))
        except ValueError as e:
            raise ValueError(f"Failed to decrypt value '{x}': {str(e)}")

    result = ''.join(decrypted_chars)
    print(f"[RSA Decrypt] Result: {repr(result)}")
    return result