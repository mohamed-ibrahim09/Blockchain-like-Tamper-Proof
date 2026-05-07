import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  RefreshCw,
  AlertTriangle,
  Check,
  X,
  Clock,
  Shield,
  Archive,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  fetchKeyStatus,
  rotateSigningKey,
  checkKeyHealth,
} from "../../lib/api";

export function KeyRotationPanel({ showToast }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [rotationReason, setRotationReason] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [expandedArchive, setExpandedArchive] = useState({});

  const loadStatus = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchKeyStatus();
      setStatus(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load key status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRotate = async () => {
    if (!rotationReason.trim()) {
      setError("Please provide a reason for key rotation");
      return;
    }

    setRotating(true);
    setError("");
    try {
      const data = await rotateSigningKey(rotationReason);
      setResult(data);
      setShowModal(false);
      setRotationReason("");
      if (showToast) showToast("Signing key rotated successfully");
      await loadStatus();
    } catch (err) {
      setError(err.response?.data?.detail || "Key rotation failed");
    } finally {
      setRotating(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "Unknown";
    return new Date(isoString).toLocaleString();
  };

  const formatExpiryDate = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getKeyAgeDays = () => {
    if (!status?.current_key?.created_at) return null;
    const created = new Date(status.current_key.created_at);
    return Math.floor((new Date() - created) / (1000 * 60 * 60 * 24));
  };

  const getExpiryDays = () => {
    return status?.rotation_info?.days_until_expiry ?? null;
  };

  const isExpiringSoon = () => {
    const days = getExpiryDays();
    return days !== null && days <= 14;
  };

  if (loading && !status) {
    return (
      <div className="section-card" style={{ textAlign: "center", padding: "2rem" }}>
        <RefreshCw size={32} className="spin" style={{ opacity: 0.5 }} />
        <p style={{ marginTop: "1rem", color: "var(--muted)" }}>Loading key status...</p>
      </div>
    );
  }

  return (
    <div className="section-card">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "10px",
          background: "var(--accent-gradient)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#ffffff",
        }}>
          <Key size={20} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Signing Key Management</h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
            ECDSA P-256 cryptographic key rotation
          </p>
        </div>
      </div>

      {/* Key Status Cards */}
      {status && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "1rem",
          }}>
            {/* Current Key Card */}
            <div style={{ padding: "1rem", background: "var(--surface-2)", borderRadius: "10px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-strong)" }}>
                <Shield size={16} />
                Current Key
              </div>
              {status.current_key.exists ? (
                <div style={{ fontSize: "0.85rem" }}>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <strong>Algorithm:</strong> {status.current_key.algorithm}
                  </div>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <strong>Fingerprint:</strong>{" "}
                    <code style={{ fontSize: "0.8rem" }}>{status.current_key.fingerprint}</code>
                  </div>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <strong>Created:</strong> {formatDate(status.current_key.created_at)}
                  </div>
                  {getKeyAgeDays() !== null && (
                    <div style={{ marginBottom: "0.5rem" }}>
                      <strong>Age:</strong> {getKeyAgeDays()} days old
                    </div>
                  )}
                  {status.rotation_info.current_key_expires_at && (
                    <div style={{ marginBottom: "0.5rem" }}>
                      <strong>Expires on:</strong>{" "}
                      <span style={{ color: isExpiringSoon() ? "var(--warning)" : "var(--text)" }}>
                        {formatExpiryDate(status.rotation_info.current_key_expires_at)}
                      </span>
                    </div>
                  )}
                  {/* Key age progress bar */}
                  {getKeyAgeDays() !== null && status.rotation_info.ttl_days && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <div style={{
                        height: "4px",
                        borderRadius: "var(--radius-pill)",
                        background: "var(--border)",
                        overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${Math.min(100, (getKeyAgeDays() / status.rotation_info.ttl_days) * 100)}%`,
                          background: "var(--accent-gradient)",
                          borderRadius: "var(--radius-pill)",
                          transition: "width 0.3s ease",
                        }} />
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                        {Math.round((getKeyAgeDays() / status.rotation_info.ttl_days) * 100)}% of TTL
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="inline-feedback tone-warning" style={{ fontSize: "0.85rem" }}>
                  <AlertTriangle size={16} />
                  No signing key exists
                </div>
              )}
            </div>

            {/* Rotation Info Card */}
            <div style={{ padding: "1rem", background: "var(--surface-2)", borderRadius: "10px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-strong)" }}>
                <Clock size={16} />
                Rotation Schedule
              </div>
              <div style={{ fontSize: "0.85rem" }}>
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>TTL:</strong> {status.rotation_info.ttl_days} days
                </div>
                {status.rotation_info.days_until_expiry !== null && (
                  <div style={{ marginBottom: "0.5rem" }}>
                    <strong>Days Until Expiry:</strong>{" "}
                    <span style={{
                      color: status.rotation_info.days_until_expiry < 7
                        ? "var(--danger)"
                        : status.rotation_info.days_until_expiry < 30
                          ? "var(--warning)"
                          : "var(--success)",
                      fontWeight: 600,
                    }}>
                      {status.rotation_info.days_until_expiry}
                    </span>
                  </div>
                )}
                {status.rotation_info.current_key_expires_at && (
                  <div>
                    <strong>Expires:</strong> {formatDate(status.rotation_info.current_key_expires_at)}
                  </div>
                )}
              </div>
            </div>

            {/* Archived Keys Card */}
            <div style={{ padding: "1rem", background: "var(--surface-2)", borderRadius: "10px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-strong)" }}>
                <Archive size={16} />
                Archived Keys
                <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--muted)" }}>
                  {status.archived_count}
                </span>
              </div>
              {status.archived_count === 0 ? (
                <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>No archived keys</div>
              ) : (
                <div style={{ fontSize: "0.8rem" }}>
                  {status.archived_keys.slice(0, 5).map((key) => (
                    <div
                      key={key.key_id}
                      style={{
                        padding: "0.5rem 0",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <code style={{ fontSize: "0.7rem", flex: 1 }}>{key.key_id}</code>
                        <button
                          type="button"
                          onClick={() => setExpandedArchive(prev => ({ ...prev, [key.key_id]: !prev[key.key_id] }))}
                          className="ghost-button"
                          style={{ minHeight: 0, padding: "0.15rem 0.4rem", fontSize: "0.7rem" }}
                        >
                          View
                        </button>
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                        Archived: {formatDate(key.archived_at)}
                      </div>
                      <AnimatePresence>
                        {expandedArchive[key.key_id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: "ease" }}
                            style={{ overflow: "hidden" }}
                          >
                            <div style={{ marginTop: "0.25rem", fontSize: "0.7rem", color: "var(--muted)" }}>
                              <div>File: <code>{key.path}</code></div>
                              <div>Type: {key.type}</div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                  {status.archived_count > 5 && (
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", paddingTop: "0.25rem" }}>
                      +{status.archived_count - 5} more
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Rotation Warning */}
          {status.rotation_info.should_rotate && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "ease" }}
              className="alert-banner tone-danger"
              style={{ marginBottom: "1rem" }}
            >
              <AlertTriangle size={20} />
              <div>
                <strong>Key Rotation Required</strong>
                <p style={{ margin: "0.25rem 0 0" }}>{status.rotation_info.reason}</p>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Rotation Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: "ease" }}
            className="alert-banner tone-success"
            style={{ marginBottom: "1rem" }}
          >
            <Check size={20} />
            <div>
              <strong>Key Rotation Successful</strong>
              <p style={{ margin: "0.25rem 0 0" }}>
                New key created with fingerprint: {result.new_key.fingerprint}
              </p>
            </div>
            <button type="button" onClick={() => setResult(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "0.25rem" }}>
              <X size={18} />
            </button>
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
            transition={{ duration: 0.28, ease: "ease" }}
            className="inline-feedback tone-danger"
            style={{ marginBottom: "1rem" }}
          >
            <AlertTriangle size={16} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons Row */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={loadStatus}
          disabled={loading}
          className="ghost-button"
        >
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          Refresh Status
        </button>
        {status?.current_key?.exists && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            disabled={rotating}
            className="danger-button"
          >
            <RefreshCw size={16} className={rotating ? "spin" : ""} />
            Rotate Signing Key
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowModal(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="section-eyebrow">Key Management</p>
                <h2>Rotate Signing Key?</h2>
              </div>
              <AlertTriangle size={20} color="var(--danger)" />
            </div>
            <p className="page-description">
              This will generate a new ECDSA P-256 key pair. The current key will
              be archived. All future blocks will use the new key. Previously signed
              blocks remain verifiable using the archived key.
            </p>
            {getKeyAgeDays() !== null && (
              <p style={{ fontSize: "0.85rem", color: "var(--warning)", marginBottom: "0.75rem" }}>
                Current key is {getKeyAgeDays()} days old
              </p>
            )}
            <label className="field" style={{ marginBottom: "1rem" }}>
              <span className="field-label">Reason for rotation</span>
              <input
                type="text"
                value={rotationReason}
                onChange={(e) => setRotationReason(e.target.value)}
                placeholder="e.g., Scheduled rotation, suspected compromise"
                autoFocus
              />
            </label>
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => { setShowModal(false); setRotationReason(""); setError(""); }} disabled={rotating}>
                Cancel
              </button>
              <button
                className="danger-button"
                type="button"
                onClick={handleRotate}
                disabled={rotating || !rotationReason.trim()}
              >
                <RefreshCw size={16} className={rotating ? "spin" : ""} />
                {rotating ? "Rotating..." : "Confirm Rotation"}
              </button>
            </div>
            {error && (
              <div className="inline-feedback tone-danger" style={{ marginTop: "0.75rem" }}>
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
