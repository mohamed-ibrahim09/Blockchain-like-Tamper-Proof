import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const UploadSection = ({ onFileUpload, onTextUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [manualText, setManualText] = useState('');
  const [activeTab, setActiveTab] = useState('file');

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/plain' || file.name.endsWith('.log')) {
        onFileUpload(file);
      } else {
        alert('Please upload .txt or .log files only');
      }
    }
  }, [onFileUpload]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleTextSubmit = () => {
    if (manualText.trim()) {
      onTextUpload(manualText);
      setManualText('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6"
    >
      <h2 className="text-2xl font-bold mb-6 text-cyber-green">Upload Logs</h2>
      
      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('file')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'file'
              ? 'bg-cyber-green text-dark-bg'
              : 'border border-dark-border text-gray-400 hover:text-cyber-green'
          }`}
        >
          File Upload
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'text'
              ? 'bg-cyber-green text-dark-bg'
              : 'border border-dark-border text-gray-400 hover:text-cyber-green'
          }`}
        >
          Manual Entry
        </button>
      </div>

      {/* File Upload Tab */}
      {activeTab === 'file' && (
        <motion.div
          key="file-tab"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              isDragging
                ? 'border-cyber-green bg-cyber-green/10'
                : 'border-dark-border hover:border-cyber-green/50'
            }`}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-dark-bg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium mb-2">
                  {isDragging ? 'Drop your file here' : 'Drag & drop your log file'}
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  Supports .txt and .log files
                </p>
                <input
                  type="file"
                  accept=".txt,.log"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="cyber-button-secondary cursor-pointer inline-block"
                >
                  Browse Files
                </label>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Manual Text Tab */}
      {activeTab === 'text' && (
        <motion.div
          key="text-tab"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Enter your log text here..."
            className="w-full h-32 bg-dark-bg border border-dark-border rounded-lg p-4 text-white placeholder-gray-500 focus:border-cyber-green focus:outline-none resize-none"
          />
          <button
            onClick={handleTextSubmit}
            disabled={!manualText.trim()}
            className="cyber-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Text
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default UploadSection;
