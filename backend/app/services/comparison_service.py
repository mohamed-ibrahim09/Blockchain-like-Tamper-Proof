from collections import Counter
from time import perf_counter

from app.services.crypto_service import crypto_service
from app.services.log_service import get_logs, verify_chain


def build_comparison_metrics() -> dict:
    logs = get_logs()
    verification = verify_chain(write_warning=False)
    counts = Counter(log["algorithm"] for log in logs)
    sample_message = "Tamper-proof logging demo event for university coursework."

    benchmarks = [
        {
            "algorithm": "playfair",
            "label": "Playfair Cipher",
            "key": "CAMPUSKEY",
            "hybrid_steps": None,
            "qualitative_note": "Digraph substitution gives compact uppercase output and highlights preprocessing rules clearly.",
        },
        {
            "algorithm": "vigenere",
            "label": "Vigenere Cipher",
            "key": "SECURITY",
            "hybrid_steps": None,
            "qualitative_note": "Classic polyalphabetic substitution is the easiest algorithm for students to compare against plaintext.",
        },
        {
            "algorithm": "rsa",
            "label": "RSA",
            "key": "RSA-DEMO",
            "hybrid_steps": None,
            "qualitative_note": "RSA shows a public-key style transformation and produces numeric ciphertext in the repo-local implementation.",
        },
        {
            "algorithm": "hybrid",
            "label": "Hybrid (Playfair + Vigenere + RSA)",
            "key": None,
            "hybrid_steps": None,
            "qualitative_note": "The repaired hybrid pipeline layers Playfair, then Vigenere, then RSA for a fuller classroom demo of sequential protection.",
        },
    ]

    metrics = []
    for item in benchmarks:
        encrypt_started = perf_counter()
        result = crypto_service.encrypt(
            algorithm=item["algorithm"],
            message=sample_message,
            key=item["key"],
            hybrid_steps=item["hybrid_steps"],
        )
        encryption_time_ms = (perf_counter() - encrypt_started) * 1000

        decrypt_started = perf_counter()
        crypto_service.decrypt(
            algorithm=item["algorithm"],
            encrypted_message=result.encrypted_message,
            key_metadata=result.key_metadata,
            hybrid_steps=result.hybrid_steps,
        )
        decryption_time_ms = (perf_counter() - decrypt_started) * 1000
        metrics.append(
            {
                "algorithm": item["algorithm"],
                "label": item["label"],
                "encryption_time_ms": round(encryption_time_ms, 4),
                "decryption_time_ms": round(decryption_time_ms, 4),
                "output_length": len(result.encrypted_message),
                "verification_behavior": (
                    "Hash verification will detect any modified ciphertext or metadata immediately, "
                    "and downstream blocks become affected after the first break."
                ),
                "qualitative_note": item["qualitative_note"],
                "observed_logs": counts.get(item["algorithm"], 0),
            }
        )

    return {
        "sample_message": sample_message,
        "current_chain_status": "healthy" if verification.is_valid else "broken",
        "log_count": len(logs),
        "metrics": metrics,
    }
