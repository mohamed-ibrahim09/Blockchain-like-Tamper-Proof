const crypto = require('crypto');

// Import blockchain storage (shared with encryptController)
const blockchain = require('../services/blockchainService');

const verifyController = {
  verifyChain: async (req, res) => {
    try {
      // Simulate verification processing time
      await new Promise(resolve => setTimeout(resolve, 800));

      const chain = blockchain.getChain();
      
      if (chain.length === 0) {
        return res.json({
          success: true,
          data: {
            isValid: true,
            message: 'Empty chain is valid',
            verifiedAt: new Date().toISOString(),
            blocksChecked: 0
          }
        });
      }

      // Verify chain integrity
      let isValid = true;
      let tamperedBlock = null;

      for (let i = 0; i < chain.length; i++) {
        const block = chain[i];
        
        // Verify hash
        const expectedHash = crypto.createHash('sha256')
          .update(block.data + block.previousHash + block.algorithm)
          .digest('hex');
        
        if (block.hash !== expectedHash) {
          isValid = false;
          tamperedBlock = block.id;
          break;
        }

        // Verify previous hash linkage
        if (i > 0 && block.previousHash !== chain[i - 1].hash) {
          isValid = false;
          tamperedBlock = block.id;
          break;
        }
      }

      // Simulate occasional tampering for demo purposes (10% chance)
      if (Math.random() < 0.1 && chain.length > 2) {
        isValid = false;
        tamperedBlock = Math.floor(Math.random() * chain.length) + 1;
      }

      res.json({
        success: true,
        data: {
          isValid: isValid,
          message: isValid 
            ? 'Blockchain integrity verified successfully'
            : `Chain integrity compromised at block #${tamperedBlock}`,
          verifiedAt: new Date().toISOString(),
          blocksChecked: chain.length,
          tamperedBlock: tamperedBlock || null
        }
      });

    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Verification failed',
        error: error.message
      });
    }
  }
};

module.exports = verifyController;
