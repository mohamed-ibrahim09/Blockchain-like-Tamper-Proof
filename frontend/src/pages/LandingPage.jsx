import { Link } from "react-router-dom";
import { Shield, Lock, Layers, Zap } from "lucide-react";
import { motion } from "framer-motion";

import { MetricCard } from "../components/ui/MetricCard";
import { SectionCard } from "../components/ui/SectionCard";
import { BlockchainScene } from "../components/ui/BlockchainScene";

export function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div
      className="page-stack"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.section className="page-hero" variants={itemVariants}>
        <div className="hero-copy">
          <p className="page-eyebrow">Welcome to SecureLog</p>
          <h1 className="page-title-display">Secure. Immutable. Transparent.</h1>
          <p className="page-description">
            Experience the next generation of data integrity. This university project demonstrates a blockchain-inspired, tamper-evident logging system. Encrypt, chain, and verify your data with absolute cryptographic certainty.
          </p>
          <div className="hero-actions">
            <Link to="/dashboard" className="primary-button">
              Launch Dashboard
            </Link>
            <Link to="/create" className="secondary-button">
              Create a Log
            </Link>
          </div>
        </div>

        <aside className="hero-aside">
          <h3>Why use SecureLog?</h3>
          <p>
            Whether you need to securely audit sensitive changes or learn about cryptographic principles, our system provides a visual and interactive demonstration of modern tamper-proof ledgers.
          </p>
          <div className="hero-stat-list">
            <div>
              <strong>Immutable Chaining</strong>
              <span className="support-copy">Cryptographic hashes link every block</span>
            </div>
            <div>
              <strong>Multi-Algorithm</strong>
              <span className="support-copy">Support for Vigenere, Playfair, and RSA</span>
            </div>
          </div>
        </aside>
      </motion.section>

      <motion.div className="metric-row" variants={itemVariants}>
        <MetricCard
          label="Security"
          value={<Shield size={32} strokeWidth={1.5} />}
          detail="End-to-End Cryptography"
          tone="success"
        />
        <MetricCard
          label="Privacy"
          value={<Lock size={32} strokeWidth={1.5} />}
          detail="Data Privacy First"
          tone="neutral"
        />
        <MetricCard
          label="Architecture"
          value={<Layers size={32} strokeWidth={1.5} />}
          detail="Blockchain-inspired"
          tone="neutral"
        />
        <MetricCard
          label="Performance"
          value={<Zap size={32} strokeWidth={1.5} />}
          detail="Lighting Fast Verification"
          tone="neutral"
        />
      </motion.div>


      <motion.div className="section-card" variants={itemVariants} style={{ padding: 0, overflow: 'hidden', position: 'relative', minHeight: '400px' }}>
        <div style={{ position: 'absolute', top: '1.6rem', left: '1.6rem', zIndex: 10 }}>
          <p className="page-eyebrow">Visualization</p>
          <h2 className="section-eyebrow" style={{ color: "var(--text-strong)", fontSize: "1.5rem", marginTop: "0.5rem" }}>Blockchain Architecture</h2>
          <p className="page-description" style={{ maxWidth: '400px', marginTop: '0.5rem' }}>
            Interact with the 3D cryptographic chain representation below.
          </p>
        </div>
        <BlockchainScene />
      </motion.div>

      <motion.div className="page-columns" variants={itemVariants}>
        <SectionCard
          eyebrow="Features"
          title="Interactive Verification"
          subtitle="Real-time tampering detection"
        >
          <p className="page-description">
            Explore the Verification page to automatically re-calculate block hashes and instantly detect if any data in the sequence has been subtly altered since creation. Trust, verified seamlessly.
          </p>
        </SectionCard>

        <SectionCard
          eyebrow="Decryption"
          title="Advanced Data Access"
          subtitle="Selective logic and retrieval"
        >
          <p className="page-description">
            Store encrypted payloads dynamically, keeping metadata transparent over the chain. Selectively reveal logs using proper keys.
          </p>
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}
