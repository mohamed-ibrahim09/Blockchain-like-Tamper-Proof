import hashlib
import time
from datetime import datetime
from typing import List, Optional


class Block:
    """A single block in the blockchain."""
    
    def __init__(self, index: int, data: str, previous_hash: str, timestamp: Optional[str] = None):
        self.index = index
        self.timestamp = timestamp or datetime.now().isoformat()
        self.data = data
        self.previous_hash = previous_hash
        self.hash = self.calculate_hash()
    
    def calculate_hash(self) -> str:
        """Calculate SHA-256 hash of the block."""
        block_string = f"{self.index}{self.timestamp}{self.data}{self.previous_hash}"
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def to_dict(self) -> dict:
        """Convert block to dictionary."""
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "hash": self.hash,
        }


class Blockchain:
    """A simple blockchain implementation for tamper-proof logging."""
    
    def __init__(self):
        self.chain: List[Block] = []
        self.create_genesis_block()
    
    def create_genesis_block(self):
        """Create the first block in the chain."""
        genesis_block = Block(0, "Genesis Block", "0")
        self.chain.append(genesis_block)
    
    def get_latest_block(self) -> Block:
        """Get the most recent block."""
        return self.chain[-1]
    
    def add_block(self, data: str) -> dict:
        """Add a new block to the chain."""
        start = time.perf_counter()
        
        previous_block = self.get_latest_block()
        new_block = Block(
            index=len(self.chain),
            data=data,
            previous_hash=previous_block.hash
        )
        self.chain.append(new_block)
        
        end = time.perf_counter()
        
        return {
            "block": new_block.to_dict(),
            "execution_time": round((end - start) * 1000, 3),
        }
    
    def is_chain_valid(self) -> dict:
        """Verify the integrity of the blockchain."""
        start = time.perf_counter()
        
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            
            # Check if current block's hash is correct
            if current_block.hash != current_block.calculate_hash():
                end = time.perf_counter()
                return {
                    "valid": False,
                    "tampered_block": i,
                    "message": f"Block {i} has been tampered with",
                    "execution_time": round((end - start) * 1000, 3),
                }
            
            # Check if current block points to correct previous hash
            if current_block.previous_hash != previous_block.hash:
                end = time.perf_counter()
                return {
                    "valid": False,
                    "tampered_block": i,
                    "message": f"Block {i} has invalid previous hash",
                    "execution_time": round((end - start) * 1000, 3),
                }
        
        end = time.perf_counter()
        return {
            "valid": True,
            "message": "Blockchain integrity verified",
            "blocks_verified": len(self.chain),
            "execution_time": round((end - start) * 1000, 3),
        }
    
    def get_chain(self) -> List[dict]:
        """Get the entire chain as a list of dictionaries."""
        return [block.to_dict() for block in self.chain]


# Global blockchain instance
blockchain = Blockchain()
