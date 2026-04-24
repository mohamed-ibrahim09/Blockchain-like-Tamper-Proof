def gcd(a: int, b: int):
    while b:
        a, b = b, a % b
    return a


def mod_inverse(e: int, phi: int):
    for candidate in range(3, phi):
        if (candidate * e) % phi == 1:
            return candidate
    raise ValueError("No modular inverse found for the selected exponent.")


def generate_keys(prime_a=61, prime_b=53):
    modulus = prime_a * prime_b
    phi = (prime_a - 1) * (prime_b - 1)
    public_exponent = 17

    while gcd(public_exponent, phi) != 1:
        public_exponent += 2

    private_exponent = mod_inverse(public_exponent, phi)
    return (public_exponent, modulus), (private_exponent, modulus)

def encrypt(text: str, public_key):
    exponent, modulus = public_key
    return [pow(ord(character), exponent, modulus) for character in text]

def decrypt(cipher_values, private_key):
    exponent, modulus = private_key
    return "".join(chr(pow(value, exponent, modulus)) for value in cipher_values)

def get_public_key(p=61, q=53):
    pub, _ = generate_keys(p, q)
    return pub

def get_private_key(p=61, q=53):
    _, priv = generate_keys(p, q)
    return priv


def rsa_algorithm(text: str, p=61, q=53):
    try:
        pub_k, priv_k = generate_keys(p, q)
        encrypted = encrypt(text, pub_k)
        return "-".join(map(str, encrypted))
    except (TypeError, ValueError):
        return "[ERROR]"


def rsa_decrypt(text: str, p=61, q=53):
    try:
        if text == "":
            raise ValueError("Ciphertext is empty.")
        numbers = [int(value) for value in text.split("-") if value]
        pub_k, priv_k = generate_keys(p, q)
        return decrypt(numbers, priv_k)
    except (TypeError, ValueError):
        return "[ERROR]"
