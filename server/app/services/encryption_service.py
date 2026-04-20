from .playfair import encrypt_playfair
from .vigenere import encrypt_vigenere
from .rsa import encrypt_rsa


def encrypt_data(data: str, algorithm: str) -> dict:
    """Encrypt data using the specified algorithm."""
    algorithm = algorithm.lower()
    
    if algorithm == "playfair":
        return encrypt_playfair(data)
    elif algorithm == "vigenere":
        return encrypt_vigenere(data)
    elif algorithm == "rsa":
        return encrypt_rsa(data)
    else:
        raise ValueError(f"Unsupported algorithm: {algorithm}")


def run_all_algorithms(data: str) -> dict:
    """Run all encryption algorithms on the data and return results."""
    results = []
    
    for algo in ["rsa", "playfair", "vigenere"]:
        result = encrypt_data(data, algo)
        
        # Add statistics
        result["input_size"] = len(data)
        result["output_size"] = len(result["encrypted_data"])
        result["throughput"] = round(
            result["input_size"] / (result["execution_time"] + 1e-6), 2
        )
        
        results.append(result)
    
    # Sort by execution time to identify fastest
    sorted_results = sorted(results, key=lambda x: x["execution_time"])
    
    # Mark fastest and most efficient
    if sorted_results:
        sorted_results[0]["fastest"] = True
    
    # Find most efficient (highest throughput)
    most_efficient = max(results, key=lambda x: x["throughput"])
    for r in results:
        if r["algorithm"] == most_efficient["algorithm"]:
            r["most_efficient"] = True
    
    return {"results": results}
