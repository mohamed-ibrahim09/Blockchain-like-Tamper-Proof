import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Lock, Link2, ShieldCheck, GitMerge, Database,
  ChevronRight, Code2, Server, Layers, Cpu, Globe,
} from "lucide-react";

/* ── Journey steps ─────────────────────────────────── */
const journeySteps = [
  {
    icon: FileText,
    label: "Plain Text",
    sublabel: "User input",
    color: "#6366f1",
    description:
      "The user types a log message or uploads a text file. The original message is captured and held in memory — never stored in plain text on disk.",
  },
  {
    icon: Lock,
    label: "Encryption",
    sublabel: "Vigenère / Playfair / RSA / Hybrid",
    color: "#8b5cf6",
    description:
      "The message is passed through the chosen cipher. Vigenère and Playfair are classical substitution ciphers; RSA uses modular exponentiation; Hybrid layers all three for maximum educational depth.",
  },
  {
    icon: Cpu,
    label: "SHA-256 Hash",
    sublabel: "Block fingerprint",
    color: "#a855f7",
    description:
      "A deterministic SHA-256 hash is computed over the encrypted message, algorithm, key metadata, previous block's hash, and creation timestamp — any change to any field produces a completely different hash.",
  },
  {
    icon: Link2,
    label: "Chain Link",
    sublabel: "Previous hash pointer",
    color: "#d946ef",
    description:
      "The new block stores the previous block's hash as its own field, forming an immutable chain. Altering any earlier block invalidates every subsequent hash — making tampering immediately visible.",
  },
  {
    icon: ShieldCheck,
    label: "ECDSA Signature",
    sublabel: "P-256 digital signature",
    color: "#ec4899",
    description:
      "The entire block is cryptographically signed using an ECDSA P-256 private key. The signature proves the block was created by a trusted signer and has not been altered since signing.",
  },
  {
    icon: GitMerge,
    label: "Merkle Tree",
    sublabel: "Inclusion proof",
    color: "#f43f5e",
    description:
      "All block hashes are arranged into a Merkle tree. The resulting root hash represents the entire ledger in a single value, and a Merkle proof can verify any single block's inclusion without revealing others.",
  },
  {
    icon: Database,
    label: "JSONL Storage",
    sublabel: "Atomic append to ledger",
    color: "#ef4444",
    description:
      "The complete block record is atomically appended to the JSONL ledger on disk. A temporary file + rename strategy ensures no partial writes can corrupt the chain, even on unexpected shutdown.",
  },
];

/* ── Tech stack ─────────────────────────────────────── */
const techStack = [
  {
    category: "Frontend",
    icon: Globe,
    color: "#6366f1",
    items: ["React 18 + Vite", "Framer Motion", "TanStack Query", "Lucide Icons", "React Router v6"],
  },
  {
    category: "Backend",
    icon: Server,
    color: "#8b5cf6",
    items: ["FastAPI", "Uvicorn (ASGI)", "Pydantic v2", "python-jose (JWT)", "cryptography (ECDSA)"],
  },
  {
    category: "Storage",
    icon: Database,
    color: "#a855f7",
    items: ["SQLite (users & auth)", "JSONL append-only ledger", "PEM key files (ECDSA)", "File-based Merkle tree"],
  },
  {
    category: "Cryptography",
    icon: Layers,
    color: "#d946ef",
    items: ["Playfair Cipher", "Vigenère Cipher", "RSA (educational)", "Hybrid Pipeline", "ECDSA P-256", "SHA-256"],
  },
];

const contributors = [
  {
    name: "Mohamed Elfeky",
    roles: ["Log Design", "Core System — hashing, chaining, storage"],
  },
  {
    name: "Mohamed Elhadad",
    roles: [
      "Playfair Cipher",
      "Frontend — React/Vite UI, chain viewer, crypto admin",
      "Backend — FastAPI routes, encryption service, ECDSA signing, Merkle tree",
      "Deployment — Vercel frontend, uvicorn backend, environment configuration",
    ],
  },
  {
    name: "Omar Abdelhamed",
    roles: ["Playfair Cipher", "Frontend & Backend"],
  },
  {
    name: "Zeyad Ashraf",
    roles: ["Vigenère Cipher"],
  },
  {
    name: "Malak Ahmed",
    roles: ["RSA Implementation"],
  },
  {
    name: "Menna Eldemerdash",
    roles: ["RSA Implementation"],
  },
];

/* ── Journey Step Component ─────────────────────────── */
function JourneyStep({ step, index, isLast, isActive, onClick }) {
  const Icon = step.icon;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 0 }}>
      {/* Node */}
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.96 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.07, duration: 0.35 }}
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          border: `2px solid ${isActive ? step.color : step.color + "55"}`,
          background: isActive ? step.color + "28" : "var(--surface-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "relative",
          zIndex: 1,
          transition: "all 0.25s ease",
          boxShadow: isActive ? `0 0 20px ${step.color}44` : "none",
        }}
      >
        <Icon size={22} color={isActive ? step.color : step.color + "99"} />
      </motion.button>

      {/* Label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.07 + 0.15 }}
        style={{ textAlign: "center", marginTop: "0.5rem", padding: "0 0.25rem" }}
      >
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: isActive ? step.color : "var(--text)", lineHeight: 1.2, transition: "color 0.2s" }}>
          {step.label}
        </div>
        <div style={{ fontSize: "0.65rem", color: "var(--muted)", marginTop: "0.15rem", lineHeight: 1.2 }}>
          {step.sublabel}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────── */
export function AboutPage() {
  const [activeStep, setActiveStep] = useState(0);
  const step = journeySteps[activeStep];
  const StepIcon = step.icon;

  return (
    <div className="page-stack">
      {/* Header */}
      <section className="page-header">
        <p className="page-eyebrow">About</p>
        <h1 className="page-title">SecureLog — Blockchain-Powered Tamper-Proof Logging</h1>
        <p className="page-description">
          SecureLog demonstrates how cryptography and hash chaining create tamper-evident logging
          systems — built with React, FastAPI, ECDSA digital signatures, and Merkle inclusion proofs.
        </p>
      </section>

      {/* Intro cards */}
      <section className="page-columns">
        <div className="note-card">
          <p>
            The platform encrypts sensitive data using multiple algorithms — RSA, Vigenère,
            Playfair, and a multi-layer Hybrid pipeline — while automatically storing each operation
            in a blockchain-like log structure. Each block is linked via SHA-256 and signed with
            ECDSA P-256, so any modification is immediately detectable.
          </p>
        </div>
        <div className="note-card">
          <p>
            A file-based JSONL ledger backed by a SQLite user database powers the system.
            A Merkle tree is rebuilt from all log entries on every read, providing cryptographic
            inclusion proofs. If any block is altered, all downstream blocks are flagged.
          </p>
        </div>
      </section>

      {/* ══ CRYPTOGRAPHIC JOURNEY ══════════════════════════════ */}
      <section className="section-card" style={{ overflow: "hidden" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 className="section-eyebrow">The Cryptographic Journey</h2>
          <p className="page-description" style={{ marginTop: "0.4rem" }}>
            Tap any stage to trace the full lifecycle of a single log entry — from plain text to tamper-proof ledger record.
          </p>
        </div>

        {/* Step rail */}
        <div style={{ position: "relative", marginBottom: "1.5rem" }}>
          {/* Connector line */}
          <div style={{
            position: "absolute",
            top: "27px",
            left: "calc(100% / 14)",
            right: "calc(100% / 14)",
            height: "2px",
            background: "linear-gradient(90deg, #6366f1, #f43f5e)",
            opacity: 0.3,
            zIndex: 0,
          }} />
          <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
            {journeySteps.map((s, i) => (
              <JourneyStep
                key={s.label}
                step={s}
                index={i}
                isLast={i === journeySteps.length - 1}
                isActive={i === activeStep}
                onClick={() => setActiveStep(i)}
              />
            ))}
          </div>
        </div>

        {/* Active step detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            style={{
              display: "flex",
              gap: "1.25rem",
              padding: "1.25rem",
              borderRadius: "var(--radius-sm)",
              border: `1px solid ${step.color}44`,
              background: `${step.color}10`,
              alignItems: "flex-start",
            }}
          >
            <div style={{
              flexShrink: 0,
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: step.color + "22",
              border: `1px solid ${step.color}55`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <StepIcon size={22} color={step.color} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                <strong style={{ fontSize: "1rem", color: step.color }}>{step.label}</strong>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>— {step.sublabel}</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.65, color: "var(--text)" }}>
                {step.description}
              </p>
              {/* Step navigation */}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                {activeStep > 0 && (
                  <button type="button" className="ghost-button" style={{ fontSize: "0.8rem" }} onClick={() => setActiveStep(prev => prev - 1)}>
                    ← Previous
                  </button>
                )}
                {activeStep < journeySteps.length - 1 && (
                  <button type="button" className="secondary-button" style={{ fontSize: "0.8rem" }} onClick={() => setActiveStep(prev => prev + 1)}>
                    Next <ChevronRight size={13} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ══ TECH STACK ══════════════════════════════════════════ */}
      <section className="section-card">
        <h2 className="section-eyebrow">Technology Stack</h2>
        <p className="page-description" style={{ marginBottom: "1.25rem" }}>
          Every layer of the system — from UI animations to cryptographic signing — is built on
          well-chosen, purpose-fit technology.
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "1rem",
        }}>
          {techStack.map((t) => {
            const TIcon = t.icon;
            return (
              <motion.div
                key={t.category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: "1rem",
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${t.color}44`,
                  background: `${t.color}0c`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <TIcon size={16} color={t.color} />
                  <strong style={{ fontSize: "0.85rem", color: t.color }}>{t.category}</strong>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  {t.items.map((item) => (
                    <li key={item} style={{ fontSize: "0.78rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Code2 size={10} color={t.color + "88"} style={{ flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ══ EDUCATIONAL FOCUS ══════════════════════════════════ */}
      <section className="section-card">
        <h2 className="section-eyebrow">Educational Focus</h2>
        <p className="page-description" style={{ marginBottom: "1rem" }}>
          The system is built for education, experimentation, and demonstration — helping users understand:
        </p>
        <ul className="plain-list">
          <li>How classical ciphers (Playfair, Vigenère) and RSA work at the data level</li>
          <li>How SHA-256 hash chains ensure block-level integrity</li>
          <li>How ECDSA P-256 digital signatures prove block authenticity</li>
          <li>How Merkle trees provide cryptographic inclusion proofs</li>
          <li>How tampering propagates through a chain and is detected downstream</li>
          <li>How real-time verification mechanisms surface inconsistencies</li>
        </ul>
        <p className="page-description" style={{ marginTop: "1rem" }}>
          SecureLog is not a distributed blockchain. It is a simplified, blockchain-inspired
          system focused on clarity and learning rather than decentralization or consensus.
        </p>
      </section>

      {/* ══ CONTRIBUTORS ═══════════════════════════════════════ */}
      <section className="section-card">
        <h2 className="section-eyebrow">Contributors</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.75rem" }}>
          {contributors.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
              }}
            >
              <strong style={{ fontSize: "0.95rem" }}>{c.name}</strong>
              <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: "0.18rem" }}>
                {c.roles.map((r) => (
                  <li key={r} style={{ fontSize: "0.81rem", color: "var(--muted)" }}>{r}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
