import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock data for development when backend is not ready
const mockData = {
  // Mock encryption response
  encryptResponse: {
    success: true,
    data: {
      encryptedData: 'U2FsdGVkX1+9l5js5A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6',
      hash: '0x7d3a8f9c2b5e6a1d4f8c3b9a7e2d5c8f1b4a6d9e3c7b2a5f8d1e4c7b0a3',
      previousHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
      blockId: 1,
      algorithm: 'rsa',
      timestamp: new Date().toISOString()
    }
  },
  
  // Mock blockchain data
  blockchainData: {
    success: true,
    data: {
      blocks: [
        {
          id: 1,
          data: 'Sample log data for demonstration',
          hash: '0x7d3a8f9c2b5e6a1d4f8c3b9a7e2d5c8f1b4a6d9e3c7b2a5f8d1e4c7b0a3',
          previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          algorithm: 'rsa'
        }
      ],
      chainLength: 1,
      isValid: true
    }
  },
  
  // Mock verification response
  verifyResponse: {
    success: true,
    data: {
      isValid: true,
      message: 'Blockchain integrity verified successfully',
      verifiedAt: new Date().toISOString()
    }
  }
};

// API Service functions
export const apiService = {
  // Encrypt data
  async encrypt(payload) {
    try {
      // Try actual API call first
      const response = await api.post('/encrypt', payload);
      return response.data.data;
    } catch (error) {
      console.warn('Backend not available, using mock data for encryption');
      // Fallback to mock data
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      return {
        ...mockData.encryptResponse.data,
        algorithm: payload.algorithm,
        blockId: Math.floor(Math.random() * 1000),
        hash: `0x${Math.random().toString(16).substr(2, 64)}`
      };
    }
  },

  // Verify blockchain integrity
  async verify() {
    try {
      const response = await api.post('/verify');
      return response.data.data;
    } catch (error) {
      console.warn('Backend not available, using mock data for verification');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      return {
        ...mockData.verifyResponse.data,
        isValid: Math.random() > 0.2 // 80% chance of being valid for demo
      };
    }
  },

  // Get blockchain data
  async getChain() {
    try {
      const response = await api.get('/chain');
      return response.data.data;
    } catch (error) {
      console.warn('Backend not available, using mock data for blockchain');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      return mockData.blockchainData.data;
    }
  },

  // Get algorithm information
  async getAlgorithmInfo(algorithm) {
    try {
      const response = await api.get(`/algorithms/${algorithm}`);
      return response.data.data;
    } catch (error) {
      console.warn('Backend not available, using mock data for algorithm info');
      const algorithmInfo = {
        rsa: {
          name: 'RSA',
          description: 'Rivest-Shamir-Adleman asymmetric encryption algorithm',
          keySize: '2048 bits',
          security: 'High',
          speed: 'Medium'
        },
        playfair: {
          name: 'Playfair Cipher',
          description: 'Classical digraph substitution cipher',
          keySize: 'Variable',
          security: 'Low',
          speed: 'Fast'
        },
        vigenere: {
          name: 'Vigenère Cipher',
          description: 'Polyalphabetic substitution cipher',
          keySize: 'Variable',
          security: 'Low',
          speed: 'Fast'
        }
      };
      return algorithmInfo[algorithm] || null;
    }
  }
};

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    // Don't show alerts for mock data fallbacks
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      console.warn('Network error - using mock data');
    }
    
    return Promise.reject(error);
  }
);

export default api;
