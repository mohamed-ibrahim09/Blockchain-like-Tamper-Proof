import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ResultDisplay = ({ result, onClear }) => {
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadResult = () => {
    const content = `
Encrypted Result
================
Algorithm: ${result?.algorithm || 'N/A'}
Timestamp: ${new Date(result?.timestamp).toLocaleString()}

Encrypted Data:
${result?.encryptedData || 'N/A'}

Hash:
${result?.hash || 'N/A'}

Previous Hash:
${result?.previousHash || 'Genesis Block'}

Block ID: ${result?.blockId || 'N/A'}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `block_${result?.blockId || 'result'}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-card p-6"
      >
        <h2 className="text-2xl font-bold mb-6 text-cyber-blue">Results</h2>
        <div className="text-center py-12 text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-dark-border rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p>No results yet</p>
          <p className="text-sm">Upload logs and encrypt them to see results here</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-cyber-blue">Results</h2>
        <button
          onClick={onClear}
          className="text-gray-400 hover:text-red-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        {/* Algorithm Info */}
        <div className="p-4 bg-dark-bg/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Algorithm Used</h3>
            <span className="px-3 py-1 bg-cyber-blue/20 text-cyber-blue rounded-full text-sm">
              {result.algorithm}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {result.timestamp && `Processed at ${new Date(result.timestamp).toLocaleString()}`}
          </p>
        </div>

        {/* Encrypted Data */}
        <div className="p-4 bg-dark-bg/50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Encrypted Data</h3>
            <button
              onClick={() => copyToClipboard(result.encryptedData, 'encrypted')}
              className="text-xs cyber-button-secondary px-3 py-1"
            >
              {copiedField === 'encrypted' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="bg-dark-bg p-3 rounded border border-dark-border">
            <p className="text-sm font-mono text-cyber-green break-all">
              {result.encryptedData}
            </p>
          </div>
        </div>

        {/* Hash Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-dark-bg/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-400">Current Hash</h3>
              <button
                onClick={() => copyToClipboard(result.hash, 'hash')}
                className="text-xs cyber-button-secondary px-3 py-1"
              >
                {copiedField === 'hash' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-dark-bg p-3 rounded border border-dark-border">
              <p className="text-xs font-mono text-cyber-blue break-all">
                {result.hash}
              </p>
            </div>
          </div>

          <div className="p-4 bg-dark-bg/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-400">Previous Hash</h3>
              <button
                onClick={() => copyToClipboard(result.previousHash || 'Genesis Block', 'previous')}
                className="text-xs cyber-button-secondary px-3 py-1"
              >
                {copiedField === 'previous' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-dark-bg p-3 rounded border border-dark-border">
              <p className="text-xs font-mono text-gray-300 break-all">
                {result.previousHash || 'Genesis Block'}
              </p>
            </div>
          </div>
        </div>

        {/* Block Info */}
        <div className="p-4 bg-dark-bg/50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Block Information</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Block ID</p>
              <p className="text-lg font-bold text-cyber-green">#{result.blockId}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Chain Position</p>
              <p className="text-sm text-cyber-blue">Block #{result.blockId}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={downloadResult}
            className="flex-1 cyber-button-primary flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download Result</span>
          </button>
          <button
            onClick={onClear}
            className="cyber-button-secondary"
          >
            Clear
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ResultDisplay;
