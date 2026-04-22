from typing import Optional
from .playfair import encrypt_playfair, decrypt_playfair
from .vigenere import encrypt_vigenere, decrypt_vigenere
from .rsa import encrypt_rsa, decrypt_rsa


def encrypt_data(
    data: str,
    algorithm: str,
    key: str = "",
    p: Optional[int] = None,
    q: Optional[int] = None
) -> dict:
    """
    Encrypt data using the specified algorithm.

    Args:
        data: Text to encrypt
        algorithm: Encryption algorithm (rsa, playfair, vigenere, hybrid)
        key: Encryption key for symmetric ciphers (Playfair, Vigenere)
        p: First prime factor for RSA (optional, auto-generated if not provided)
        q: Second prime factor for RSA (optional, auto-generated if not provided)
    """
    algorithm = algorithm.lower()

    if algorithm == "playfair":
        result = encrypt_playfair(data, key or "BLOCKCHAIN")
        result["key_used"] = key or "BLOCKCHAIN"
        return result

    elif algorithm == "vigenere":
        result = encrypt_vigenere(data, key or "TAMPERPROOF")
        result["key_used"] = key or "TAMPERPROOF"
        return result

    elif algorithm == "rsa":
        # Use provided p and q if available, otherwise generate random primes
        if p is not None and q is not None:
            result = encrypt_rsa(data, p=p, q=q)
        else:
            result = encrypt_rsa(data)
        return result

    elif algorithm == "hybrid":
        # Hybrid encryption: Playfair → Vigenere → RSA (layered encryption)
        # This order ensures maximum security through multiple transformation layers
        k = key or "HYBRID"

        # Layer 1: Playfair cipher (classical substitution)
        p_result = encrypt_playfair(data, k)

        # Layer 2: Vigenere cipher (polyalphabetic substitution on Playfair output)
        v_result = encrypt_vigenere(p_result["encrypted_data"], k)

        # Layer 3: RSA encryption (asymmetric encryption on combined output)
        if p is not None and q is not None:
            rsa_result = encrypt_rsa(v_result["encrypted_data"], p=p, q=q)
        else:
            rsa_result = encrypt_rsa(v_result["encrypted_data"])

        return {
            "algorithm": "Hybrid",
            "encrypted_data": rsa_result["encrypted_data"],
            "public_key": rsa_result["public_key"],
            "private_key": rsa_result["private_key"],
            "p": rsa_result["p"],
            "q": rsa_result["q"],
            "vigenere_key": k,
            "playfair_key": k,
            "execution_time": round(
                p_result["execution_time"] +
                v_result["execution_time"] +
                rsa_result["execution_time"], 3
            ),
        }

    else:
        raise ValueError(f"Unsupported algorithm: {algorithm}")


def decrypt_data(
    cipher: str,
    algorithm: str,
    key: str = "",
    p: Optional[int] = None,
    q: Optional[int] = None,
    d: Optional[int] = None,
    n: Optional[int] = None
) -> dict:
    """
    Decrypt data using the specified algorithm.

    Args:
        cipher: Encrypted text
        algorithm: Encryption algorithm used
        key: Decryption key for symmetric ciphers
        p: First prime factor (for RSA)
        q: Second prime factor (for RSA)
        d: Private exponent (for RSA, alternative to p/q)
        n: Modulus (for RSA, required if d is provided)
    """
    import time
    start = time.perf_counter()
    algorithm = algorithm.lower()

    if algorithm == "playfair":
        result = {"algorithm": "Playfair", "decrypted_data": decrypt_playfair(cipher, key or "BLOCKCHAIN")}

    elif algorithm == "vigenere":
        result = {"algorithm": "Vigenere", "decrypted_data": decrypt_vigenere(cipher, key or "TAMPERPROOF")}

    elif algorithm == "rsa":
        # Prefer (d, n) to avoid key regeneration issues
        # Only fall back to (p, q) if d, n not provided
        if d is not None and n is not None:
            print(f"[RSA Decrypt] Using provided d={d}, n={n}")
            decrypted = decrypt_rsa(cipher, d=d, n=n)
        elif p is not None and q is not None:
            print(f"[RSA Decrypt] Computing from p={p}, q={q} - REGENERATING KEYS")
            decrypted = decrypt_rsa(cipher, p=p, q=q)
        else:
            raise ValueError("RSA decryption requires either (d, n) or (p, q) parameters")
        result = {"algorithm": "RSA", "decrypted_data": decrypted}

    elif algorithm == "hybrid":
        # Hybrid decryption: Reverse of encryption (RSA → Vigenere → Playfair)
        k = key or "HYBRID"

        # Layer 3: Decrypt RSA layer first - prefer d,n over p,q
        if d is not None and n is not None:
            print(f"[Hybrid Decrypt] Using provided d={d}, n={n}")
            step1 = decrypt_rsa(cipher, d=d, n=n)
        elif p is not None and q is not None:
            print(f"[Hybrid Decrypt] Computing from p={p}, q={q} - REGENERATING KEYS")
            step1 = decrypt_rsa(cipher, p=p, q=q)
        else:
            raise ValueError("Hybrid decryption requires either (d, n) or (p, q) for RSA layer")

        # Layer 2: Decrypt Vigenere layer
        step2 = decrypt_vigenere(step1, k)

        # Layer 1: Decrypt Playfair layer (removes X padding automatically)
        step3 = decrypt_playfair(step2, k)

        result = {"algorithm": "Hybrid", "decrypted_data": step3}

    else:
        raise ValueError(f"Unsupported algorithm: {algorithm}")

    end = time.perf_counter()
    result["execution_time"] = round((end - start) * 1000, 3)
    return result


def run_all_algorithms(data: str) -> dict:
    """Run all encryption algorithms and return comparison results."""
    results = []

    for algo in ["rsa", "playfair", "vigenere"]:
        result = encrypt_data(data, algo)
        result["input_size"] = len(data)
        result["output_size"] = len(result["encrypted_data"])
        result["throughput"] = round(
            result["input_size"] / (result["execution_time"] + 1e-6), 2
        )
        results.append(result)

    sorted_results = sorted(results, key=lambda x: x["execution_time"])
    if sorted_results:
        sorted_results[0]["fastest"] = True

    most_efficient = max(results, key=lambda x: x["throughput"])
    for r in results:
        if r["algorithm"] == most_efficient["algorithm"]:
            r["most_efficient"] = True

    return {"results": results}