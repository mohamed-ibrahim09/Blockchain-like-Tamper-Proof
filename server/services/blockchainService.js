// In-memory blockchain storage service
// In production, this would be replaced with a proper database

let blockchain = [];

const blockchainService = {
  // Add a new block to the chain
  addBlock: (block) => {
    blockchain.push(block);
    return block;
  },

  // Get the entire blockchain
  getChain: () => {
    return blockchain;
  },

  // Get a specific block by ID
  getBlock: (blockId) => {
    return blockchain.find(block => block.id === blockId);
  },

  // Get the latest block
  getLatestBlock: () => {
    return blockchain[blockchain.length - 1] || null;
  },

  // Clear the blockchain (for testing/reset)
  clearChain: () => {
    blockchain = [];
  },

  // Get chain statistics
  getStats: () => {
    return {
      totalBlocks: blockchain.length,
      lastUpdated: blockchain.length > 0 ? blockchain[blockchain.length - 1].timestamp : null,
      algorithms: [...new Set(blockchain.map(block => block.algorithm))]
    };
  }
};

module.exports = blockchainService;
