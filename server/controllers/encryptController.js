const crypto = require('crypto');

// In-memory blockchain storage (in production, use a proper database)
let blockchain = [];
let blockIdCounter = 1;

// Mock encryption implementations
const mockEncryption = {
  rsa: (data) => {
    // Simulate RSA encryption with base64 encoding
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    const encrypted = Buffer.from(data).toString('base64');
    return { encrypted, hash };
  },
  
  playfair: (data) => {
    // Simplified Playfair simulation
    const hash = crypto.createHash('sha256').update(data + 'playfair').digest('hex');
    const encrypted = Buffer.from(data).toString('base64').replace(/=/g, '');
    return { encrypted, hash };
  },
  
  vigenere: (data) => {
    // Simplified Vigenère simulation
    const hash = crypto.createHash('sha256').update(data + 'vigenere').digest('hex');
    const encrypted = Buffer.from(data).toString('base64').replace(/[AEIOU]/g, 'X');
    return { encrypted, hash };
  }
};

const encryptController = {
  encryptData: async (req, res) => {
    try {
      const { data, algorithm, hybridMode } = req.body;

      // Validate input
      if (!data || !algorithm) {
        return res.status(400).json({
          success: false,
          message: 'Data and algorithm are required'
        });
      }

      // Validate algorithm
      const validAlgorithms = ['rsa', 'playfair', 'vigenere'];
      if (!validAlgorithms.includes(algorithm)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid algorithm. Use: rsa, playfair, or vigenere'
        });
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Perform encryption
      const encryptionResult = mockEncryption[algorithm](data);
      
      // Create new block
      const previousHash = blockchain.length > 0 
        ? blockchain[blockchain.length - 1].hash 
        : '0x0000000000000000000000000000000000000000000000000000000000000000';
      
      const newBlock = {
        id: blockIdCounter++,
        data: data,
        encryptedData: encryptionResult.encrypted,
        hash: encryptionResult.hash,
        previousHash: previousHash,
        timestamp: new Date().toISOString(),
        algorithm: algorithm,
        hybridMode: hybridMode || false
      };

      // Add to blockchain
      blockchain.push(newBlock);

      // Return result
      res.json({
        success: true,
        data: {
          encryptedData: newBlock.encryptedData,
          hash: newBlock.hash,
          previousHash: newBlock.previousHash,
          blockId: newBlock.id,
          algorithm: newBlock.algorithm,
          timestamp: newBlock.timestamp
        }
      });

    } catch (error) {
      console.error('Encryption error:', error);
      res.status(500).json({
        success: false,
        message: 'Encryption failed',
        error: error.message
      });
    }
  }
};

module.exports = encryptController;
