from flask import Blueprint, request, jsonify
from app.services.encryption_service import encrypt_data, run_all_algorithms, decrypt_data

bp = Blueprint("encryption", __name__)


@bp.route("/encrypt", methods=["POST"])
def encrypt():
    """Encrypt data using specified algorithm."""
    try:
        data = request.json

        if not data or "text" not in data:
            return jsonify({"error": "Missing 'text' field"}), 400

        if "algorithm" not in data:
            return jsonify({"error": "Missing 'algorithm' field"}), 400

        # Extract optional parameters
        key = data.get("key", "")
        p = data.get("p")
        q = data.get("q")

        # Convert p and q to integers if provided
        if p is not None:
            try:
                p = int(p)
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid 'p' value. Must be an integer."}), 400
        if q is not None:
            try:
                q = int(q)
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid 'q' value. Must be an integer."}), 400

        result = encrypt_data(
            data["text"],
            data["algorithm"],
            key=key,
            p=p,
            q=q
        )
        result["input_size"] = len(data["text"])
        result["output_size"] = len(result["encrypted_data"])
        result["throughput"] = round(
            result["input_size"] / (result["execution_time"] + 1e-6), 2
        )

        return jsonify(result)

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Encryption failed: {str(e)}"}), 500


@bp.route("/run-all", methods=["POST"])
def run_all():
    """Run all encryption algorithms on the data."""
    try:
        data = request.json

        if not data or "text" not in data:
            return jsonify({"error": "Missing 'text' field"}), 400

        result = run_all_algorithms(data["text"])
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": f"Run all failed: {str(e)}"}), 500


@bp.route("/decrypt", methods=["POST"])
def decrypt():
    """Decrypt data using specified algorithm."""
    data = request.json
    if not data or "encrypted_data" not in data:
        return jsonify({"error": "Missing 'encrypted_data' field"}), 400
    if "algorithm" not in data:
        return jsonify({"error": "Missing 'algorithm' field"}), 400

    try:
        # Extract key parameters
        key = data.get("key", "")

        # Extract RSA parameters - can be p/q or d/n
        p = data.get("p")
        q = data.get("q")
        d = data.get("d")
        n = data.get("n")

        # Convert to integers if provided
        if p is not None:
            try:
                p = int(p)
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid 'p' value. Must be an integer."}), 400
        if q is not None:
            try:
                q = int(q)
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid 'q' value. Must be an integer."}), 400
        if d is not None:
            try:
                d = int(d)
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid 'd' value. Must be an integer."}), 400
        if n is not None:
            try:
                n = int(n)
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid 'n' value. Must be an integer."}), 400

        result = decrypt_data(
            cipher=data["encrypted_data"],
            algorithm=data["algorithm"],
            key=key,
            p=p,
            q=q,
            d=d,
            n=n
        )
        print(f"[Decrypt Route] Returning: {result}")
        return jsonify(result)

    except ValueError as e:
        print(f"[Decrypt Route] ValueError: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"[Decrypt Route] Exception: {e}")
        return jsonify({"error": f"Decryption failed: {str(e)}"}), 500