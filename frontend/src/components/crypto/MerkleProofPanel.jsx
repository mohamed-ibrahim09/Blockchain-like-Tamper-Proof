import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Copy, Check, ChevronDown, ChevronUp, FileSignature, Lock } from "lucide-react";
import { fetchMerkleProof, verifyMerkleProof } from "../../lib/api";
import { shortenHash } from "../../lib/formatters";

export function MerkleProofPanel({ log }) {
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const fetchProof = async () => {
    if (proof) {
      setExpanded(!expanded);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await fetchMerkleProof(log.id);
      setProof(data);
      setExpanded(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to fetch Merkle proof");
    } finally {
      setLoading(false);
    }
  };

  const verifyProof = async () => {
    if (!proof) return;

    setLoading(true);
    try {
      const payload = {
        log_id: log.id,
        leaf_hash: proof.leaf_hash,
        siblings: proof.siblings,
        root_hash: proof.root_hash,
      };
      const result = await verifyMerkleProof(payload);
      setVerificationResult(result.valid);
    } catch (err) {
      setVerificationResult(false);
    } finally {
      setLoading(false);
    }
  };

  const copyProof = () => {
    if (!proof) return;
    const proofText = JSON.stringify(proof, null, 2);
    navigator.clipboard.writeText(proofText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasSignature = log.signature && log.signature.signature;

  return (
    <div className="merkle-panel" style={{ marginTop: "1rem" }}>
      {/* Header */}
      <button
        type="button"
        onClick={fetchProof}
        disabled={loading}
        className="section-header"
        style={{
          width: "100%",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: loading ? "wait" : "pointer",
          color: "var(--text)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
            }}
          >
            <Shield size={16} />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
              Cryptographic Proofs
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              {hasSignature ? "Digital Signature + Merkle Proof" : "Merkle Proof"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {verificationResult !== null && (
            <span
              className={`status-pill tone-${verificationResult ? "success" : "danger"}`}
              style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
            >
              {verificationResult ? "Verified" : "Failed"}
            </span>
          )}
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && proof && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="proof-content"
            style={{
              overflow: "hidden",
              border: "1px solid var(--border)",
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              background: "var(--surface)",
            }}
          >
            <div style={{ padding: "1.25rem" }}>
              {/* Signature Section */}
              {hasSignature && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.75rem",
                      color: "var(--text-strong)",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                    }}
                  >
                    <FileSignature size={16} />
                    Digital Signature (ECDSA-P256)
                  </div>
                  <div
                    className="hash-pill"
                    style={{
                      fontSize: "0.8rem",
                      wordBreak: "break-all",
                      background: "var(--surface-2)",
                      padding: "0.75rem",
                      borderRadius: "8px",
                    }}
                  >
                    <strong>Algorithm:</strong> {log.signature.algorithm}
                    <br />
                    <strong>Signature:</strong> {shortenHash(log.signature.signature, 32)}
                  </div>
                </div>
              )}

              {/* Merkle Proof Section */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.75rem",
                    color: "var(--text-strong)",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  <Lock size={16} />
                  Merkle Inclusion Proof (SHA-256)
                </div>

                {/* Root Hash */}
                <div
                  style={{
                    background: "var(--surface-2)",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    marginBottom: "0.75rem",
                    fontSize: "0.85rem",
                  }}
                >
                  <strong>Merkle Root:</strong>
                  <div className="hash-pill" style={{ marginTop: "0.25rem" }}>
                    {shortenHash(proof.root_hash)}
                  </div>
                </div>

                {/* Leaf Info */}
                <div
                  style={{
                    background: "var(--surface-2)",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    marginBottom: "0.75rem",
                    fontSize: "0.85rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>
                      <strong>Leaf Index:</strong> {proof.leaf_index}
                    </span>
                    <span>
                      <strong>Siblings:</strong> {proof.siblings.length}
                    </span>
                  </div>
                  <div style={{ marginTop: "0.5rem" }}>
                    <strong>Leaf Hash:</strong>
                    <div className="hash-pill" style={{ marginTop: "0.25rem" }}>
                      {shortenHash(proof.leaf_hash)}
                    </div>
                  </div>
                </div>

                {/* Proof Path */}
                {proof.siblings.length > 0 && (
                  <div
                    style={{
                      background: "var(--surface-2)",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      marginBottom: "1rem",
                    }}
                  >
                    <strong style={{ fontSize: "0.85rem" }}>Proof Path:</strong>
                    <div style={{ marginTop: "0.5rem" }}>
                      {proof.siblings.map((sibling, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.5rem",
                            background: "var(--surface)",
                            borderRadius: "6px",
                            marginBottom: "0.35rem",
                            fontSize: "0.8rem",
                          }}
                        >
                          <span
                            className={`status-pill tone-${sibling.side === "left" ? "warning" : "info"}`}
                            style={{ padding: "0.15rem 0.4rem", fontSize: "0.7rem" }}
                          >
                            {sibling.side}
                          </span>
                          <span className="hash-pill">
                            {shortenHash(sibling.hash)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={verifyProof}
                    disabled={loading}
                    className="primary-button"
                    style={{ flex: 1 }}
                  >
                    <Shield size={16} />
                    Verify Proof
                  </button>
                  <button
                    type="button"
                    onClick={copyProof}
                    className="ghost-button"
                    style={{ minWidth: "44px" }}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="inline-feedback tone-danger"
            style={{ marginTop: "0.75rem" }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
