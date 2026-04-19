import React from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <motion.footer 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card mt-20 px-6 py-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold text-cyber-green mb-4">About</h3>
            <p className="text-gray-400 text-sm">
              A blockchain-inspired tamper-proof logging system with advanced encryption algorithms.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-cyber-blue mb-4">Features</h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>Multiple encryption algorithms</li>
              <li>Blockchain integrity verification</li>
              <li>Real-time visualization</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-cyber-green mb-4">Technologies</h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>React & Vite</li>
              <li>TailwindCSS</li>
              <li>Framer Motion</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-dark-border mt-8 pt-6 text-center">
          <p className="text-gray-500 text-sm">
            © 2024 BlockChain Logger. Built with cybersecurity in mind.
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
