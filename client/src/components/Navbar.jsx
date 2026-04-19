import React from 'react';
import { motion } from 'framer-motion';

const Navbar = () => {
  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-card sticky top-0 z-50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-cyber-green to-cyber-blue rounded-lg animate-glow"></div>
          <h1 className="text-xl font-bold neon-text text-cyber-green">
            BlockChain Logger
          </h1>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          <a href="#home" className="text-gray-300 hover:text-cyber-green transition-colors">Home</a>
          <a href="#dashboard" className="text-gray-300 hover:text-cyber-green transition-colors">Dashboard</a>
          <a href="#about" className="text-gray-300 hover:text-cyber-green transition-colors">About</a>
        </div>
        
        <button className="cyber-button-primary text-sm">
          Get Started
        </button>
      </div>
    </motion.nav>
  );
};

export default Navbar;
