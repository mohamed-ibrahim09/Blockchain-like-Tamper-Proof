import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronDown, KeyRound, ShieldAlert, User, ShieldCheck } from "lucide-react";

import { decryptLog, tamperLog, verifyBlockSignature } from "../../lib/api";
import { formatDate, getAlgorithmLabel, getStatusTone, shortenHash } from "../../lib/formatters";
import { MerkleProofPanel } from "../crypto/MerkleProofPanel";
import { StatusPill } from "../ui/StatusPill";

export function BlockCard({ log, verification, expanded = false, onExpandedChange }) {
  const queryClient = useQueryClient();
  const [tamperValue, setTamperValue] = useState("");
  const [decryptKey, setDecryptKey] = useState("");
  const [decryptionResult, setDecryptionResult] = useState(null);
  const [signatureStatus, setSignatureStatus] = useState(null);

  const tamperMutation = useMutation({
    mutationFn: (payload) => tamperLog(log.id, payload),
    onSuccess: async () => {
      onExpandedChange?.(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["logs"] }),
        queryClient.invalidateQueries({ queryKey: ["verification"] }),
        queryClient.invalidateQueries({ queryKey: ["warnings"] }),
        queryClient.invalidateQueries({ queryKey: ["comparison"] }),
      ]);
    },
  });

  const decryptMutation = useMutation({
    mutationFn: (payload) => decryptLog(log.id, payload),
    onSuccess: (data) => setDecryptionResult(data),
  });

  const verifySigMutation = useMutation({
    mutationFn: () => verifyBlockSignature(log.id),
    onSuccess: (data) => setSignatureStatus(data),
  });

  const status = verification?.status || (log.tampered ? "tampered" : "valid");
  const statusTone = getStatusTone(status);

  return (
    <motion.article
      className={`block-card block-${status} ${expanded ? "is-open" : ""}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <div className="block-top">
        <div>
          <div className="block-badges">
            <StatusPill tone={statusTone}>{status.toUpperCase()}</StatusPill>
            <StatusPill tone="neutral">{getAlgorithmLabel(log.algorithm)}</StatusPill>
            {log.signature && (
              <StatusPill tone="success" title="Block is digitally signed (ECDSA P-256)">
                <ShieldCheck size={12} style={{ display: "inline", marginRight: "0.25rem" }} />
                Signed
              </StatusPill>
            )}
          </div>
          <h3>Block #{log.id}</h3>
          <p className="support-copy">
            {formatDate(log.created_at)}
            {log.created_by_username && (
              <span style={{ marginLeft: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--accent)" }}>
                <User size={12} />
                {log.created_by_username}
              </span>
            )}
          </p>
        </div>

        <button
          className="icon-button"
          type="button"
          aria-expanded={expanded}
          onClick={() => onExpandedChange?.(!expanded)}
        >
          <ChevronDown className={expanded ? "rotated" : ""} size={18} />
        </button>
      </div>

      <div className="block-summary-grid">
        <div className="summary-chip">
          <span className="label-muted">Previous hash</span>
          <code>{shortenHash(log.previous_hash)}</code>
        </div>
        <div className="summary-chip">
          <span className="label-muted">Current hash</span>
          <code>{shortenHash(log.current_hash)}</code>
        </div>
        <div className="summary-chip summary-chip-wide">
          <span className="label-muted">Encrypted preview</span>
          <p>
            {log.encrypted_message.slice(0, 140)}
            {log.encrypted_message.length > 140 ? "..." : ""}
          </p>
        </div>
      </div>

      {expanded ? (
        <div className="details-stack">
          {verification ? (
            <div className={`detail-card tone-${statusTone}`}>
              <div className="detail-head">
                <div>
                  <p className="label-muted">Verification state</p>
                  <strong>{verification.status.toUpperCase()}</strong>
                </div>
              </div>
              <ul className="plain-list">
                {verification.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="detail-grid">
            <div className="detail-card">
              <p className="label-muted">Original message</p>
              <div className="mono-block">{log.original_message}</div>
            </div>
            <div className="detail-card">
              <p className="label-muted">Encrypted payload</p>
              <div className="mono-block">{log.encrypted_message}</div>
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-card">
              <p className="label-muted">
                Encryption metadata
                {log.created_by_username && (
                  <span style={{ float: "right", display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", color: "var(--accent)", fontFamily: "inherit" }}>
                    <User size={11} />
                    Created by <strong>{log.created_by_username}</strong>
                  </span>
                )}
              </p>
              <div className="mono-block">{JSON.stringify(log.key_metadata, null, 2)}</div>
            </div>
            <div className="detail-card">
              <p className="label-muted">Hash relationship</p>
              <div className="hash-stack">
                <div>
                  <span className="label-muted">Stored previous hash</span>
                  <code>{log.previous_hash}</code>
                </div>
                <div>
                  <span className="label-muted">Stored current hash</span>
                  <code>{log.current_hash}</code>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-grid">
            <form
              className="detail-card form-panel"
              onSubmit={(event) => {
                event.preventDefault();
                decryptMutation.mutate(log.algorithm === "hybrid" ? {} : { key: decryptKey.trim() || undefined });
              }}
            >
              <div className="detail-head">
                <div>
                  <h4>Decrypt block</h4>
                  <p className="support-copy">Use the stored metadata or override the key for a quick demo.</p>
                </div>
                <KeyRound size={18} />
              </div>

              {log.algorithm !== "hybrid" && log.algorithm !== "rsa" ? (
                <input
                  placeholder="Optional override key"
                  value={decryptKey}
                  onChange={(event) => setDecryptKey(event.target.value)}
                />
              ) : log.algorithm === "rsa" ? (
                <p className="label-muted">RSA decryption uses the built-in generated keypair from the repo-local rsa.py module.</p>
              ) : (
                <p className="label-muted">Hybrid blocks use the stored step metadata by default.</p>
              )}

              <button className="secondary-button" type="submit" disabled={decryptMutation.isPending}>
                Reveal decrypted message
              </button>

              {decryptionResult ? (
                <div className="inline-feedback">
                  <strong>Decrypted output</strong>
                  <p>{decryptionResult.decrypted_message}</p>
                  {decryptionResult.pipeline?.length ? (
                    <p className="support-copy">Path: {decryptionResult.pipeline.join(" -> ")}</p>
                  ) : null}
                </div>
              ) : null}
              {decryptMutation.error ? (
                <div className="inline-feedback tone-danger">
                  {decryptMutation.error.response?.data?.detail || "Decryption failed."}
                </div>
              ) : null}
            </form>

            <form
              className="detail-card form-panel danger-surface"
              onSubmit={(event) => {
                event.preventDefault();
                tamperMutation.mutate({
                  field: "encrypted_message",
                  new_value: tamperValue || `${log.encrypted_message}-TAMPERED`,
                  note: "Manual demo tamper from the chain viewer.",
                });
              }}
            >
              <div className="detail-head">
                <div>
                  <h4>Simulate tampering</h4>
                  <p className="support-copy">Update stored ciphertext without recalculating the block hash.</p>
                </div>
                <ShieldAlert size={18} />
              </div>
              <textarea
                rows={4}
                placeholder="Optional replacement encrypted value"
                value={tamperValue}
                onChange={(event) => setTamperValue(event.target.value)}
              />
              <button className="danger-button" type="submit" disabled={tamperMutation.isPending}>
                Tamper this block
              </button>
              {tamperMutation.error ? (
                <div className="inline-feedback tone-danger">
                  {tamperMutation.error.response?.data?.detail || "Tamper action failed."}
                </div>
              ) : null}
            </form>
          </div>

          {log.signature && (
            <div className="detail-card form-panel">
              <div className="detail-head">
                <div>
                  <h4>Verify Digital Signature</h4>
                  <p className="support-copy">Check if the block's ECDSA signature is valid and hasn't been tampered with.</p>
                </div>
                <ShieldCheck size={18} />
              </div>
              <button
                className="secondary-button"
                type="button"
                disabled={verifySigMutation.isPending}
                onClick={() => verifySigMutation.mutate()}
              >
                {verifySigMutation.isPending ? "Verifying..." : "Verify Signature"}
              </button>
              
              {signatureStatus && (
                <div className={`inline-feedback tone-${signatureStatus.valid ? 'success' : 'danger'}`} style={{ marginTop: "1rem" }}>
                  <strong>{signatureStatus.valid ? "Signature is Valid" : "Signature Verification Failed"}</strong>
                  <p>{signatureStatus.message}</p>
                </div>
              )}
              {verifySigMutation.error && (
                <div className="inline-feedback tone-danger" style={{ marginTop: "1rem" }}>
                  {verifySigMutation.error.response?.data?.detail || "Verification failed."}
                </div>
              )}
            </div>
          )}

          {/* Cryptographic Proofs Panel */}
          <MerkleProofPanel log={log} />
        </div>
      ) : null}
    </motion.article>
  );
}
