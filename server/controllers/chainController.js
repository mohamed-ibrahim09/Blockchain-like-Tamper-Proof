const blockchain = require('../services/blockchainService');

const chainController = {
  getChain: async (req, res) => {
    try {
      const chain = blockchain.getChain();
      
      res.json({
        success: true,
        data: {
          blocks: chain,
          chainLength: chain.length,
          isValid: true // In production, this would be calculated
        }
      });

    } catch (error) {
      console.error('Get chain error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve blockchain',
        error: error.message
      });
    }
  },

  getBlock: async (req, res) => {
    try {
      const blockId = parseInt(req.params.id);
      const chain = blockchain.getChain();
      
      const block = chain.find(b => b.id === blockId);
      
      if (!block) {
        return res.status(404).json({
          success: false,
          message: 'Block not found'
        });
      }

      res.json({
        success: true,
        data: block
      });

    } catch (error) {
      console.error('Get block error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve block',
        error: error.message
      });
    }
  }
};

module.exports = chainController;
