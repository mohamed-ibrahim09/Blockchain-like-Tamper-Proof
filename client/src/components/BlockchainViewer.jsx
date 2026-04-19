import React, { useState } from 'react';
import { motion } from 'framer-motion';

const BlockchainViewer = ({ blocks, onVerify, isVerifying, verificationResult }) => {
  const [selectedBlock, setSelectedBlock] = useState(null);

  const handleVerify = () => {
    onVerify();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-cyber-green">Blockchain Integrity</h2>
        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="cyber-button-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isVerifying ? (
            <>
              <div className="w-4 h-4 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Verify Chain</span>
            </>
          )}
        </button>
      </div>

      {/* Verification Result */}
      {verificationResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-lg mb-6 ${
            verificationResult.isValid
              ? 'bg-green-500/20 border border-green-500/50'
              : 'bg-red-500/20 border border-red-500/50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              verificationResult.isValid
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}>
              {verificationResult.isValid ? '!' : 'X'}
            </div>
            <div>
              <p className={`font-bold ${
                verificationResult.isValid ? 'text-green-400' : 'text-red-400'
              }`}>
                Chain is {verificationResult.isValid ? 'Valid' : 'Tampered'}
              </p>
              <p className="text-sm text-gray-400">
                {verificationResult.isValid
                  ? 'All blocks are cryptographically linked and secure'
                  : 'Chain integrity has been compromised'
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Blockchain Visualization */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-300">Chain Visualization</h3>
        
        {blocks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-dark-border rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p>No blocks in chain yet</p>
            <p className="text-sm">Upload and encrypt logs to start building the chain</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map((block, index) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedBlock(selectedBlock?.id === block.id ? null : block)}
                className="block-card cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-lg flex items-center justify-center font-bold text-dark-bg">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-cyber-green">Block #{block.id}</h4>
                      <p className="text-sm text-gray-400">
                        {new Date(block.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Hash</p>
                      <p className="text-xs font-mono text-cyber-blue">
                        {block.hash.substring(0, 10)}...
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded Block Details */}
                {selectedBlock?.id === block.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 pt-4 border-t border-dark-border space-y-3"
                  >
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Previous Hash</p>
                      <p className="text-sm font-mono text-gray-300 break-all">
                        {block.previousHash || 'Genesis Block'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Data</p>
                      <p className="text-sm text-gray-300 break-all">
                        {block.data.substring(0, 100)}{block.data.length > 100 ? '...' : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Algorithm</p>
                      <p className="text-sm text-cyber-blue">{block.algorithm}</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BlockchainViewer;
