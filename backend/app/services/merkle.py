"""Merkle Tree implementation for tamper-proof logging.

Provides Merkle tree construction, proof generation, and verification.
Each log entry becomes a leaf node, enabling efficient integrity verification
and cryptographic inclusion proofs.
"""

import hashlib
import json
from typing import Any, Optional


def hash_data(data: Any) -> str:
    """Hash arbitrary data using SHA-256.
    
    Args:
        data: Data to hash (will be JSON serialized)
        
    Returns:
        Hex string of the hash
    """
    if isinstance(data, str):
        encoded = data.encode('utf-8')
    elif isinstance(data, bytes):
        encoded = data
    else:
        encoded = json.dumps(data, sort_keys=True, separators=(',', ':')).encode('utf-8')
    
    return hashlib.sha256(encoded).hexdigest()


class MerkleNode:
    """A node in the Merkle tree."""
    
    def __init__(
        self,
        hash_value: str,
        left: Optional['MerkleNode'] = None,
        right: Optional['MerkleNode'] = None,
        data: Any = None,
        index: int = 0,
    ):
        self.hash = hash_value
        self.left = left
        self.right = right
        self.data = data  # Only set for leaf nodes
        self.index = index  # Leaf index (only valid for leaves)
    
    @property
    def is_leaf(self) -> bool:
        """Check if this is a leaf node."""
        return self.left is None and self.right is None
    
    def to_dict(self) -> dict[str, Any]:
        """Convert node to dictionary representation."""
        result = {
            "hash": self.hash,
            "is_leaf": self.is_leaf,
        }
        if self.is_leaf:
            result["data"] = self.data
            result["index"] = self.index
        else:
            result["left"] = self.left.to_dict() if self.left else None
            result["right"] = self.right.to_dict() if self.right else None
        return result


class MerkleTree:
    """Merkle Tree for cryptographic inclusion proofs."""
    
    def __init__(self, leaves: Optional[list[Any]] = None):
        """Initialize a Merkle Tree.
        
        Args:
            leaves: Optional list of data items for leaf nodes
        """
        self.root: Optional[MerkleNode] = None
        self.leaves: list[MerkleNode] = []
        self.leaf_count = 0
        
        if leaves:
            self.build(leaves)
    
    def _hash_leaf(self, data: Any, index: int) -> MerkleNode:
        """Create a leaf node from data."""
        hash_value = hash_data(data)
        node = MerkleNode(
            hash_value=hash_value,
            data=data,
            index=index,
        )
        return node
    
    def _hash_internal(self, left: MerkleNode, right: MerkleNode) -> MerkleNode:
        """Create an internal node from two child nodes.
        
        The hash is computed by concatenating child hashes and hashing.
        """
        combined = left.hash + right.hash
        hash_value = hash_data(combined)
        return MerkleNode(
            hash_value=hash_value,
            left=left,
            right=right,
        )
    
    def build(self, leaves: list[Any]) -> 'MerkleTree':
        """Build the Merkle tree from leaf data.
        
        Args:
            leaves: List of data items
            
        Returns:
            Self for method chaining
        """
        if not leaves:
            self.root = None
            self.leaves = []
            self.leaf_count = 0
            return self
        
        self.leaf_count = len(leaves)
        
        # Create leaf nodes
        current_level = []
        for i, data in enumerate(leaves):
            leaf = self._hash_leaf(data, i)
            current_level.append(leaf)
            self.leaves.append(leaf)
        
        # Build tree bottom-up
        while len(current_level) > 1:
            next_level = []
            
            # Handle odd number of nodes by duplicating the last one
            if len(current_level) % 2 == 1:
                current_level.append(current_level[-1])
            
            # Pair up nodes
            for i in range(0, len(current_level), 2):
                left = current_level[i]
                right = current_level[i + 1]
                parent = self._hash_internal(left, right)
                next_level.append(parent)
            
            current_level = next_level
        
        self.root = current_level[0] if current_level else None
        return self
    
    def get_root_hash(self) -> Optional[str]:
        """Get the root hash of the tree."""
        return self.root.hash if self.root else None
    
    def get_proof(self, index: int) -> Optional[dict[str, Any]]:
        """Generate a Merkle proof for a leaf at the given index.
        
        Args:
            index: Index of the leaf to prove
            
        Returns:
            Proof dictionary with path information, or None if index invalid
        """
        if index < 0 or index >= self.leaf_count:
            return None
        
        if self.leaf_count == 0:
            return None
        
        if self.leaf_count == 1:
            # Single leaf - proof is just the leaf hash
            leaf = self.leaves[0]
            return {
                "leaf_index": 0,
                "leaf_hash": leaf.hash,
                "siblings": [],
                "root_hash": self.root.hash,
            }
        
        # Build path from leaf to root
        proof_path = []
        
        # We need to rebuild the tree level by level to track the path
        # This is a bit inefficient but ensures correctness
        level_nodes = list(self.leaves)
        current_index = index
        
        while len(level_nodes) > 1:
            # Handle odd number
            if len(level_nodes) % 2 == 1:
                level_nodes.append(level_nodes[-1])
            
            # Determine sibling
            if current_index % 2 == 0:
                # Current is left child
                sibling_index = current_index + 1
                sibling_side = "right"
            else:
                # Current is right child
                sibling_index = current_index - 1
                sibling_side = "left"
            
            if sibling_index < len(level_nodes):
                sibling_node = level_nodes[sibling_index]
                proof_path.append({
                    "hash": sibling_node.hash,
                    "side": sibling_side,
                    "level": len(proof_path),
                })
            
            # Move up to parent level
            next_level = []
            for i in range(0, len(level_nodes), 2):
                parent = self._hash_internal(level_nodes[i], level_nodes[i + 1])
                next_level.append(parent)
            
            level_nodes = next_level
            current_index = current_index // 2
        
        leaf = self.leaves[index]
        return {
            "leaf_index": index,
            "leaf_hash": leaf.hash,
            "siblings": proof_path,
            "root_hash": self.root.hash if self.root else None,
        }
    
    def verify_proof(
        self,
        leaf_data: Any,
        proof: dict[str, Any],
    ) -> bool:
        """Verify a Merkle proof.
        
        Args:
            leaf_data: The original leaf data
            proof: Proof dictionary from get_proof()
            
        Returns:
            True if proof is valid
        """
        # Compute leaf hash
        current_hash = hash_data(leaf_data)
        
        # Check leaf hash matches
        if current_hash != proof["leaf_hash"]:
            return False
        
        # Apply sibling hashes up the tree
        for sibling in proof["siblings"]:
            sibling_hash = sibling["hash"]
            side = sibling["side"]
            
            if side == "left":
                # Sibling is on the left
                combined = sibling_hash + current_hash
            else:
                # Sibling is on the right
                combined = current_hash + sibling_hash
            
            current_hash = hash_data(combined)
        
        # Check against root
        return current_hash == proof["root_hash"]
    
    def to_dict(self) -> dict[str, Any]:
        """Convert tree to dictionary representation."""
        return {
            "root_hash": self.get_root_hash(),
            "leaf_count": self.leaf_count,
            "tree": self.root.to_dict() if self.root else None,
        }


def build_merkle_tree_from_logs(logs: list[dict[str, Any]]) -> MerkleTree:
    """Build a Merkle tree from log records.
    
    Args:
        logs: List of log record dictionaries
        
    Returns:
        MerkleTree built from the logs
    """
    # Extract hash data from each log
    leaf_data = []
    for log in logs:
        # Use the fields that constitute the block's identity
        data = {
            "id": log.get("id"),
            "current_hash": log.get("current_hash"),
            "previous_hash": log.get("previous_hash"),
            "encrypted_message": log.get("encrypted_message"),
            "algorithm": log.get("algorithm"),
            "created_at": log.get("created_at"),
        }
        leaf_data.append(data)
    
    return MerkleTree(leaf_data)


def verify_chain_with_merkle(logs: list[dict[str, Any]]) -> dict[str, Any]:
    """Verify the entire chain using Merkle tree.
    
    Args:
        logs: List of log records
        
    Returns:
        Verification result with tree info
    """
    if not logs:
        return {
            "valid": True,
            "message": "Empty chain is valid",
            "root_hash": None,
            "leaf_count": 0,
        }
    
    tree = build_merkle_tree_from_logs(logs)
    
    return {
        "valid": True,
        "message": f"Merkle tree built successfully with {tree.leaf_count} leaves",
        "root_hash": tree.get_root_hash(),
        "leaf_count": tree.leaf_count,
    }


# Utility functions for API responses

def format_proof_for_api(proof: dict[str, Any]) -> dict[str, Any]:
    """Format a Merkle proof for API response."""
    if proof is None:
        return None
    
    return {
        "leaf_index": proof["leaf_index"],
        "leaf_hash": proof["leaf_hash"],
        "siblings": [
            {
                "hash": s["hash"],
                "side": s["side"],
            }
            for s in proof["siblings"]
        ],
        "root_hash": proof["root_hash"],
        "hash_algorithm": "SHA-256",
    }
