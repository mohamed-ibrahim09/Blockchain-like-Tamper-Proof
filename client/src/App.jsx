import React from 'react';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import AnimatedBackground from './components/AnimatedBackground';

function App() {
  return (
    <div className="min-h-screen bg-dark-bg relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyber-green/5 via-transparent to-cyber-blue/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      </div>
      <AnimatedBackground />
      
      {/* Main content */}
      <div className="relative z-10">
        <Navbar />
        <main>
          <Home />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default App;
