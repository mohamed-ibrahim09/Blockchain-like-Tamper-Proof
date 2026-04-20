from flask import Blueprint, request, jsonify
from app.services.blockchain import blockchain

bp = Blueprint("blockchain", __name__)


@bp.route("/chain", methods=["GET"])
def get_chain():
    """Get the entire blockchain."""
    try:
        chain = blockchain.get_chain()
        return jsonify({
            "chain": chain,
            "length": len(chain),
        })
    except Exception as e:
        return jsonify({"error": f"Failed to get chain: {str(e)}"}), 500


@bp.route("/add-block", methods=["POST"])
def add_block():
    """Add a new block to the blockchain."""
    try:
        data = request.json
        
        if not data or "data" not in data:
            return jsonify({"error": "Missing 'data' field"}), 400
        
        result = blockchain.add_block(data["data"])
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": f"Failed to add block: {str(e)}"}), 500


@bp.route("/verify", methods=["POST"])
def verify_chain():
    """Verify the integrity of the blockchain."""
    try:
        result = blockchain.is_chain_valid()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Verification failed: {str(e)}"}), 500


@bp.route("/latest", methods=["GET"])
def get_latest():
    """Get the latest block."""
    try:
        latest = blockchain.get_latest_block()
        return jsonify(latest.to_dict())
    except Exception as e:
        return jsonify({"error": f"Failed to get latest block: {str(e)}"}), 500
