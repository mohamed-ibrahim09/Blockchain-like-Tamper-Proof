from flask import Blueprint, request, jsonify
from app.services.encryption_service import encrypt_data, run_all_algorithms

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
        
        result = encrypt_data(data["text"], data["algorithm"])
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
