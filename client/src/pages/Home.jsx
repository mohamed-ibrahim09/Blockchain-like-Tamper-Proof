import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UploadSection from '../components/UploadSection';
import EncryptionPanel from '../components/EncryptionPanel';
import BlockchainViewer from '../components/BlockchainViewer';
import ResultDisplay from '../components/ResultDisplay';
import Loader from '../components/Loader';
import { apiService } from '../services/api';

const Home = () => {
  const [uploadedData, setUploadedData] = useState(null);
  const [encryptionResult, setEncryptionResult] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [activeSection, setActiveSection] = useState('upload');

  // Load initial blockchain data
  useEffect(() => {
    loadBlockchainData();
  }, []);

  const loadBlockchainData = async () => {
    try {
      const chainData = await apiService.getChain();
      setBlocks(chainData.blocks || []);
    } catch (error) {
      console.error('Failed to load blockchain data:', error);
      // Set empty blocks for demo
      setBlocks([]);
    }
  };

  const handleFileUpload = async (file) => {
    const text = await file.text();
    setUploadedData({
      type: 'file',
      name: file.name,
      content: text,
      size: file.size
    });
    setActiveSection('encryption');
  };

  const handleTextUpload = (text) => {
    setUploadedData({
      type: 'text',
      content: text
    });
    setActiveSection('encryption');
  };

  const handleEncrypt = async (config) => {
    if (!uploadedData) return;

    setIsEncrypting(true);
    try {
      const result = await apiService.encrypt({
        data: uploadedData.content,
        algorithm: config.algorithm,
        hybridMode: config.hybridMode
      });

      setEncryptionResult(result);
      
      // Add new block to the chain
      const newBlock = {
        id: blocks.length + 1,
        data: uploadedData.content,
        hash: result.hash,
        previousHash: blocks.length > 0 ? blocks[blocks.length - 1].hash : '0',
        timestamp: new Date().toISOString(),
        algorithm: config.algorithm
      };

      setBlocks([...blocks, newBlock]);
      setActiveSection('blockchain');
    } catch (error) {
      console.error('Encryption failed:', error);
      // Show error notification (could be enhanced with toast)
      alert('Encryption failed. Please try again.');
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const result = await apiService.verify();
      setVerificationResult(result);
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationResult({
        isValid: false,
        message: 'Verification failed'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const clearResults = () => {
    setEncryptionResult(null);
    setVerificationResult(null);
  };

  const resetFlow = () => {
    setUploadedData(null);
    setEncryptionResult(null);
    setVerificationResult(null);
    setActiveSection('upload');
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-20 px-6"
      >
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-cyber-green to-cyber-blue bg-clip-text text-transparent">
              Blockchain Logging System
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto"
          >
            Secure your logs with advanced encryption algorithms and blockchain integrity verification.
            Tamper-proof logging for the modern age.
          </motion.p>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            {['upload', 'encryption', 'blockchain'].map((section, index) => (
              <React.Fragment key={section}>
                <motion.button
                  onClick={() => section !== 'blockchain' && setActiveSection(section)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeSection === section
                      ? 'bg-cyber-green text-dark-bg'
                      : uploadedData && ['encryption', 'blockchain'].includes(section)
                      ? 'bg-cyber-blue text-dark-bg'
                      : 'bg-dark-border text-gray-500'
                  }`}
                  disabled={section === 'blockchain'}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </motion.button>
                {index < 2 && (
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Main Content */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Interactive Components */}
            <div className="space-y-8">
              <AnimatePresence mode="wait">
                {activeSection === 'upload' && (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <UploadSection
                      onFileUpload={handleFileUpload}
                      onTextUpload={handleTextUpload}
                    />
                  </motion.div>
                )}

                {activeSection === 'encryption' && uploadedData && (
                  <motion.div
                    key="encryption"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <EncryptionPanel
                      onEncrypt={handleEncrypt}
                      isEncrypting={isEncrypting}
                    />
                    
                    {/* Uploaded Data Preview */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="glass-card p-6 mt-8"
                    >
                      <h3 className="text-lg font-medium mb-4 text-cyber-green">Data Preview</h3>
                      <div className="bg-dark-bg/50 p-4 rounded-lg">
                        <p className="text-sm text-gray-400 mb-2">
                          {uploadedData.type === 'file' ? `File: ${uploadedData.name}` : 'Manual Entry'}
                        </p>
                        <p className="text-sm text-gray-300 break-all">
                          {uploadedData.content.substring(0, 200)}
                          {uploadedData.content.length > 200 ? '...' : ''}
                        </p>
                      </div>
                      <button
                        onClick={resetFlow}
                        className="mt-4 cyber-button-secondary text-sm"
                      >
                        Change Data
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Column - Results and Blockchain */}
            <div className="space-y-8">
              <BlockchainViewer
                blocks={blocks}
                onVerify={handleVerify}
                isVerifying={isVerifying}
                verificationResult={verificationResult}
              />

              <ResultDisplay
                result={encryptionResult}
                onClear={clearResults}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Loading Overlay */}
      <AnimatePresence>
        {(isEncrypting || isVerifying) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <Loader
              size="large"
              text={isEncrypting ? 'Encrypting data...' : 'Verifying chain...'}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
