import time
import random
import math


def is_prime(n: int, k: int = 10) -> bool:
    """Miller-Rabin primality test."""
    if n < 2:
        return False
    if n == 2 or n == 3:
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
    """Extended Euclidean Algorithm to find modular inverse."""
    def extended_gcd(a, b):
        if a == 0:
            return b, 0, 1
        gcd, x1, y1 = extended_gcd(b % a, a)
        x = y1 - (b // a) * x1
        y = x1
        return gcd, x, y
    
    _, x, _ = extended_gcd(e % phi, phi)
    return (x % phi + phi) % phi


def generate_keypair(bits: int = 32) -> tuple:
    """Generate RSA public and private key pair."""
    p = generate_prime(bits)
    q = generate_prime(bits)
    while q == p:
        q = generate_prime(bits)
    
    n = p * q
    phi = (p - 1) * (q - 1)
    
    e = 65537
    while math.gcd(e, phi) != 1:
        e = random.randrange(3, phi, 2)
    
    d = mod_inverse(e, phi)
    
    return ((e, n), (d, n))


def encrypt_rsa(text: str) -> dict:
    """Encrypt text using RSA algorithm."""
    start = time.perf_counter()
    
    # Generate keys
    public_key, private_key = generate_keypair(32)
    e, n = public_key
    
    # Encrypt each character
    encrypted_values = []
    for char in text:
        encrypted_char = pow(ord(char), e, n)
        encrypted_values.append(str(encrypted_char))
    
    encrypted = ','.join(encrypted_values)
    end = time.perf_counter()
    
    return {
        "algorithm": "RSA",
        "encrypted_data": encrypted,
        "execution_time": round((end - start) * 1000, 3),
        "public_key": {"e": e, "n": n},
    }
