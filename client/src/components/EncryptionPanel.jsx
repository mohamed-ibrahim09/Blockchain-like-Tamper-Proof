import React, { useState } from 'react';
import { motion } from 'framer-motion';

const algorithms = [
  { id: 'rsa', name: 'RSA', description: 'Modern asymmetric encryption', icon: 'R' },
  { id: 'playfair', name: 'Playfair', description: 'Classical digraph cipher', icon: 'P' },
  { id: 'vigenere', name: 'Vigenère', description: 'Polyalphabetic substitution', icon: 'V' }
];

const EncryptionPanel = ({ onEncrypt, isEncrypting }) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('rsa');
  const [hybridMode, setHybridMode] = useState(false);

  const handleEncrypt = () => {
    const config = {
      algorithm: selectedAlgorithm,
      hybridMode
    };
    onEncrypt(config);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-card p-6"
    >
      <h2 className="text-2xl font-bold mb-6 text-cyber-blue">Encryption</h2>
      
      {/* Algorithm Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4 text-gray-300">Choose Algorithm</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {algorithms.map((algo) => (
            <motion.div
              key={algo.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedAlgorithm(algo.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedAlgorithm === algo.id
                  ? 'border-cyber-blue bg-cyber-blue/10'
                  : 'border-dark-border hover:border-cyber-blue/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                  selectedAlgorithm === algo.id
                    ? 'bg-cyber-blue text-dark-bg'
                    : 'bg-dark-bg text-cyber-blue'
                }`}>
                  {algo.icon}
                </div>
                <div>
                  <h4 className="font-medium">{algo.name}</h4>
                  <p className="text-xs text-gray-400">{algo.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Hybrid Mode Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 border border-dark-border rounded-lg">
          <div>
            <h4 className="font-medium text-cyber-green">Hybrid Mode</h4>
            <p className="text-sm text-gray-400">Combine multiple algorithms for enhanced security</p>
          </div>
          <button
            onClick={() => setHybridMode(!hybridMode)}
            className={`w-12 h-6 rounded-full transition-colors ${
              hybridMode ? 'bg-cyber-green' : 'bg-dark-border'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              hybridMode ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>

      {/* Encrypt Button */}
      <button
        onClick={handleEncrypt}
        disabled={isEncrypting}
        className="w-full cyber-button-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isEncrypting ? (
          <>
            <div className="w-4 h-4 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
            <span>Encrypting...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Encrypt</span>
          </>
        )}
      </button>

      {/* Performance Metrics Placeholder */}
      <div className="mt-6 p-4 bg-dark-bg/50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-400 mb-2">Performance Metrics</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Speed</p>
            <p className="text-lg font-bold text-cyber-green">-- ms</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Security</p>
            <p className="text-lg font-bold text-cyber-blue">--%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Efficiency</p>
            <p className="text-lg font-bold text-cyber-green">--%</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EncryptionPanel;
