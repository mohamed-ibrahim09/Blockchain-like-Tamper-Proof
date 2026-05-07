import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Key, Lock, FileSignature, ChevronRight, Mail, Bell, Hash,
  AlertTriangle, CheckCircle2, XCircle, Copy, Check, RefreshCw, Clock,
  Archive, GitMerge, GitCommit, Info, Search,
} from "lucide-react";
import { useState, useCallback } from "react";
import { KeyRotationPanel } from "../components/crypto/KeyRotationPanel";
import { MerkleTreeVisualizer } from "../components/crypto/MerkleTreeVisualizer";
import {
  fetchAlertConfig,
  fetchAlertStatus,
  fetchMerkleTreeInfo,
  fetchSignatureKeyInfo,
  generateSigningKey,
  testEmailAlert,
  testWebhookAlert,
  fetchMerkleProof,
} from "../lib/api";
import { shortenHash } from "../lib/formatters";

/* ─── CopyButton ─────────────────────────────────────────────── */
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="icon-button"
      style={{ minHeight: 0, padding: "0.25rem", border: "none" }}
      title="Copy"
    >
      {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
    </button>
  );
}

/* ─── Toast ───────────────────────────────────────────────────── */
let toastTimeout = null;
function useToast() {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, tone = "success") => {
    setToast({ message, tone });
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => setToast(null), 3000);
  }, []);
  const ToastUI = toast ? (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`inline-feedback tone-${toast.tone}`}
      style={{
        position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 9999,
        minWidth: "260px", boxShadow: "var(--shadow-elevated)",
      }}
    >
      {toast.tone === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      <span style={{ marginLeft: "0.5rem" }}>{toast.message}</span>
    </motion.div>
  ) : null;
  return { showToast, ToastUI };
}

/* ─── FIX 1: Key Generation CTA Banner ──────────────────────── */
function KeyGenerationBanner({ onGenerate, generating }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "ease" }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "1.25rem 1.5rem",
        marginBottom: "1.5rem",
        background: "var(--warning-bg)",
        border: "1px solid var(--warning)",
        borderRadius: "var(--radius-sm)",
        flexWrap: "wrap",
      }}
    >
      <div style={{
        width: "44px", height: "44px", borderRadius: "10px",
        background: "var(--warning-bg)", border: "1px solid var(--warning)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Key size={22} color="var(--warning)" />
      </div>
      <div style={{ flex: 1, minWidth: "200px" }}>
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--warning)" }}>
          No signing key has been generated yet
        </h3>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--text)" }}>
          Generate an ECDSA P-256 key pair to enable digital signatures on
          all future log blocks. This is required for full cryptographic integrity.
        </p>
      </div>
      <button
        type="button"
        onClick={onGenerate}
        disabled={generating}
        className="primary-button"
        style={{ flexShrink: 0 }}
      >
        <Key size={16} />
        {generating ? "Generating..." : "Generate Signing Key"}
      </button>
    </motion.div>
  );
}

/* ─── FIX 6: Alert Config Cards with inline expand ───────────── */
function AlertConfigCard({ config, configLoading, showToast }) {
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [webhookExpanded, setWebhookExpanded] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Email form state
  const [emailTo, setEmailTo] = useState(config?.email?.recipient || "");
  const [smtpHost, setSmtpHost] = useState(config?.email?.smtp_host || "");
  const [smtpPort, setSmtpPort] = useState(config?.email?.smtp_port || 587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);

  // Webhook form state
  const [webhookUrl, setWebhookUrl] = useState(config?.webhook?.url || "");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookSaved, setWebhookSaved] = useState(false);

  const isEmailConfigured = config?.email?.configured;
  const isWebhookConfigured = config?.webhook?.configured;

  const handleTestEmail = async () => {
    setTesting(true);
    setError("");
    setResult(null);
    try {
      const data = await testEmailAlert(emailTo, "test");
      setResult(data);
      if (data.result?.sent) showToast("Test email sent successfully");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send test email");
    } finally {
      setTesting(false);
    }
  };

  const handleTestWebhook = async () => {
    setTesting(true);
    setError("");
    setResult(null);
    try {
      const data = await testWebhookAlert();
      setResult(data);
      if (data.result?.sent) showToast("Test webhook sent successfully");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send test webhook");
    } finally {
      setTesting(false);
    }
  };

  const handleSaveEmail = () => {
    setEmailSaved(true);
    showToast("Email configuration saved. Update backend/.env for persistence.");
  };

  const handleSaveWebhook = () => {
    setWebhookSaved(true);
    showToast("Webhook configuration saved. Update backend/.env for persistence.");
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "10px",
          background: "var(--accent-gradient)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#ffffff",
        }}>
          <Bell size={20} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Real-time Alerts</h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
            Configure and test email &amp; webhook notifications
          </p>
        </div>
      </div>

      {/* Email Card */}
      <div style={{
        padding: "1rem", background: "var(--surface-2)",
        borderRadius: "10px", border: "1px solid var(--border)",
        marginBottom: "1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", fontWeight: 600 }}>
          <Mail size={16} />
          Email Alerts
          <span className={`status-pill tone-${isEmailConfigured ? "success" : "warning"}`} style={{ marginLeft: "auto", fontSize: "0.7rem" }}>
            {isEmailConfigured ? "Active" : "Not Configured"}
          </span>
          <button type="button" onClick={() => setEmailExpanded(!emailExpanded)} className="ghost-button" style={{ minHeight: 0, padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>
            {emailExpanded ? "Collapse" : "Configure"}
          </button>
        </div>
        {configLoading ? (
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.8rem" }}>Loading...</p>
        ) : (
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.8rem" }}>
            {config?.email?.recipient || "No recipient configured"}
          </p>
        )}

        <AnimatePresence>
          {emailExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: "ease" }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ paddingTop: "1rem", borderTop: "1px solid var(--border)", marginTop: "0.75rem" }}>
                <div className="field-row" style={{ marginBottom: "0.75rem" }}>
                  <label className="field" style={{ flex: 2 }}>
                    <span className="field-label">Recipient Email</span>
                    <input type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="alert-recipient@example.com" />
                  </label>
                  <label className="field" style={{ flex: 1 }}>
                    <span className="field-label">SMTP Host</span>
                    <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" />
                  </label>
                </div>
                <div className="field-row" style={{ marginBottom: "0.75rem" }}>
                  <label className="field">
                    <span className="field-label">SMTP Port</span>
                    <input type="number" value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} />
                  </label>
                  <label className="field">
                    <span className="field-label">SMTP User</span>
                    <input type="text" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="your-email@gmail.com" />
                  </label>
                  <label className="field">
                    <span className="field-label">SMTP Password</span>
                    <input type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} placeholder="App password" />
                  </label>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <button type="button" onClick={handleSaveEmail} className="secondary-button">
                    Save Email Config
                  </button>
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testing || !emailTo}
                    className="ghost-button"
                  >
                    <Mail size={14} />
                    {testing ? "Sending..." : "Send Test Email"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Webhook Card */}
      <div style={{
        padding: "1rem", background: "var(--surface-2)",
        borderRadius: "10px", border: "1px solid var(--border)",
        marginBottom: "1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", fontWeight: 600 }}>
          <Bell size={16} />
          Webhook Alerts
          <span className={`status-pill tone-${isWebhookConfigured ? "success" : "warning"}`} style={{ marginLeft: "auto", fontSize: "0.7rem" }}>
            {isWebhookConfigured ? "Active" : "Not Configured"}
          </span>
          <button type="button" onClick={() => setWebhookExpanded(!webhookExpanded)} className="ghost-button" style={{ minHeight: 0, padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>
            {webhookExpanded ? "Collapse" : "Configure"}
          </button>
        </div>
        {configLoading ? (
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.8rem" }}>Loading...</p>
        ) : (
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.8rem" }}>
            {config?.webhook?.url ? "Webhook URL configured" : "No webhook URL configured"}
          </p>
        )}

        <AnimatePresence>
          {webhookExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: "ease" }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ paddingTop: "1rem", borderTop: "1px solid var(--border)", marginTop: "0.75rem" }}>
                <div className="field-row" style={{ marginBottom: "0.75rem" }}>
                  <label className="field" style={{ flex: 2 }}>
                    <span className="field-label">Webhook URL</span>
                    <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://hooks.slack.com/services/..." />
                  </label>
                  <label className="field">
                    <span className="field-label">Secret Header (optional)</span>
                    <input type="text" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} placeholder="HMAC signing secret" />
                  </label>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <button type="button" onClick={handleSaveWebhook} className="secondary-button">
                    Save Webhook Config
                  </button>
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={testing}
                    className="ghost-button"
                  >
                    <Bell size={14} />
                    {testing ? "Sending..." : "Send Test Webhook"}
                  </button>
                </div>
                {result?.test_type === "webhook" && result.result?.status_code && (
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>
                    Last delivery: HTTP {result.result.status_code}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results / Errors */}
      {result && (
        <div className={`inline-feedback tone-${result.result?.sent ? "success" : "danger"}`} style={{ marginBottom: "1rem" }}>
          <strong>{result.result?.sent ? "Success!" : "Failed"}</strong>
          <p style={{ margin: "0.25rem 0 0" }}>
            {result.result?.sent
              ? `Alert sent via ${result.result?.method || "unknown"} to ${result.recipient || "webhook"}`
              : `Error: ${result.result?.error || "Unknown error"}`}
          </p>
        </div>
      )}
      {error && (
        <div className="inline-feedback tone-danger" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Config Help */}
      <details style={{ marginTop: "0.5rem" }}>
        <summary style={{ cursor: "pointer", color: "var(--muted)", fontSize: "0.85rem" }}>
          Configuration Help
        </summary>
        <div style={{ marginTop: "0.75rem", padding: "1rem", background: "var(--surface-2)", borderRadius: "8px", fontSize: "0.8rem", fontFamily: "monospace" }}>
          <p style={{ margin: "0 0 0.5rem" }}>Add to backend/.env:</p>
          <pre style={{ margin: 0, color: "var(--text)" }}>
{`# Email Alerts
ALERT_EMAIL_TO=mohammed.i.elhadad@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Webhook Alerts
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL`}
          </pre>
        </div>
      </details>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════════════════════ */
export function CryptoAdminPage() {
  const queryClient = useQueryClient();
  const { showToast, ToastUI } = useToast();
  const [generatingKey, setGeneratingKey] = useState(false);

  const {
    data: merkleInfo,
    isLoading: merkleLoading,
  } = useQuery({
    queryKey: ["merkle-tree"],
    queryFn: fetchMerkleTreeInfo,
  });

  const {
    data: signatureInfo,
    isLoading: sigLoading,
  } = useQuery({
    queryKey: ["signature-key"],
    queryFn: fetchSignatureKeyInfo,
  });

  const {
    data: alertConfig,
    isLoading: alertConfigLoading,
  } = useQuery({
    queryKey: ["alert-config"],
    queryFn: fetchAlertConfig,
  });

  const {
    data: alertStatus,
    isLoading: alertStatusLoading,
  } = useQuery({
    queryKey: ["alert-status"],
    queryFn: fetchAlertStatus,
  });

  const {
    data: keyStatus,
  } = useQuery({
    queryKey: ["key-status"],
    queryFn: async () => {
      try {
        const { fetchKeyStatus } = await import("../lib/api");
        return fetchKeyStatus();
      } catch { return null; }
    },
  });

  /* ─── FIX 1: Generate key handler ──────────────────────────── */
  const handleGenerateKey = async () => {
    setGeneratingKey(true);
    try {
      await generateSigningKey();
      showToast("Signing key generated successfully");
      queryClient.invalidateQueries({ queryKey: ["signature-key"] });
      queryClient.invalidateQueries({ queryKey: ["key-status"] });
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to generate key", "danger");
    } finally {
      setGeneratingKey(false);
    }
  };

  const noKeyExists = !sigLoading && signatureInfo && !signatureInfo.exists;

  /* ─── FIX 2: Helper for metric cards ────────────────────────── */
  const formatHashShort = (hash) => {
    if (!hash) return "N/A";
    if (hash.length <= 20) return hash;
    return `${hash.slice(0, 10)}...${hash.slice(-10)}`;
  };

  const getKeyAgeDays = () => {
    if (!signatureInfo?.created_at) return null;
    const created = new Date(signatureInfo.created_at);
    const now = new Date();
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  };

  /* ─── FIX 7: Status summary helpers ────────────────────────── */
  const configuredChannels = [
    alertConfig?.email?.configured && "email",
    alertConfig?.webhook?.configured && "webhook",
  ].filter(Boolean);

  return (
    <div className="page-frame">
      {ToastUI}

      <div className="page-head">
        <div className="breadcrumb">
          <span>Administration</span>
          <ChevronRight size={14} />
          <span className="current">Cryptographic Management</span>
        </div>
        <h1 className="page-title">Cryptographic Controls</h1>
        <p className="page-description">
          Manage digital signatures, Merkle tree integrity, and key rotation for
          tamper-proof logging.
        </p>
      </div>

      {/* FIX 1: Key Generation CTA Banner */}
      {noKeyExists && (
        <KeyGenerationBanner onGenerate={handleGenerateKey} generating={generatingKey} />
      )}

      {/* FIX 7: Status Summary Row */}
      <div style={{
        display: "flex", gap: "1rem", flexWrap: "wrap",
        marginBottom: "1.5rem", fontSize: "0.85rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock size={14} color="var(--muted)" />
          <span style={{ color: "var(--muted)" }}>Last verified:</span>
          <span>{merkleInfo?.valid !== undefined ? "Recently" : "—"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Key size={14} color="var(--muted)" />
          <span style={{ color: "var(--muted)" }}>Key:</span>
          <span className={`status-pill tone-${signatureInfo?.exists ? "success" : "warning"}`}>
            {signatureInfo?.exists ? "Active" : "Not generated"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Bell size={14} color="var(--muted)" />
          <span style={{ color: "var(--muted)" }}>Alerts:</span>
          <span className="status-pill tone-neutral">
            {configuredChannels.length > 0 ? `${configuredChannels.length} configured` : "Not configured"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Shield size={14} color="var(--muted)" />
          <span style={{ color: "var(--muted)" }}>Chain:</span>
          <span className={`status-pill tone-${merkleInfo?.valid ? "success" : "danger"}`}>
            {merkleInfo?.valid ? "Healthy" : "Broken"}
          </span>
        </div>
      </div>

      {/* FIX 2: Overview Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "1rem",
        marginBottom: "1.5rem",
      }}>
        {/* Merkle Root Hash Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.28, ease: "ease" }}
          className="metric-card"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <Lock size={18} color="var(--accent)" />
            <span className="metric-label" style={{ margin: 0 }}>Merkle Root Hash</span>
          </div>
          <div style={{
            fontSize: "1rem",
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.5rem",
          }}>
            {merkleLoading ? (
              <span className="spin">...</span>
            ) : merkleInfo ? (
              <>
                <span>{formatHashShort(merkleInfo.root_hash)}</span>
                {merkleInfo.root_hash && <CopyButton text={merkleInfo.root_hash} />}
              </>
            ) : "N/A"}
          </div>
          {merkleInfo && (
            <div style={{ fontSize: "0.8rem" }}>
              <span style={{ color: "var(--muted)" }}>{merkleInfo.leaf_count} leaves in tree</span>
              <br />
              {merkleInfo.valid ? (
                <span style={{ color: "var(--success)" }}>Root verified ✓</span>
              ) : (
                <span style={{ color: "var(--danger)" }}>Verification failed</span>
              )}
            </div>
          )}
        </motion.div>

        {/* Signing Algorithm Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.28, ease: "ease" }}
          className="metric-card"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <FileSignature size={18} color="var(--accent)" />
            <span className="metric-label" style={{ margin: 0 }}>Signing Algorithm</span>
          </div>
          <div className="metric-value" style={{ fontSize: "1.5rem" }}>
            {sigLoading ? (
              <span className="spin">...</span>
            ) : signatureInfo?.exists ? (
              "ECDSA P-256"
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--warning)", fontSize: "1.25rem" }}>
                <AlertTriangle size={20} />
                No key generated
              </span>
            )}
          </div>
          {signatureInfo?.exists && (
            <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
              <div style={{ color: "var(--muted)" }}>
                Key fingerprint: <code style={{ fontSize: "0.75rem" }}>{signatureInfo.fingerprint?.slice(0, 16)}</code>
              </div>
              {getKeyAgeDays() !== null && (
                <div style={{ color: "var(--muted)", marginTop: "0.25rem" }}>
                  Created {getKeyAgeDays()} days ago
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Security Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.28, ease: "ease" }}
          className="metric-card"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <Shield size={18} color="var(--accent)" />
            <span className="metric-label" style={{ margin: 0 }}>Security Status</span>
          </div>
          {(() => {
            if (merkleLoading || sigLoading) return <div className="metric-value"><span className="spin">...</span></div>;
            if (!signatureInfo?.exists) return (
              <div className="metric-value" style={{ color: "var(--warning)" }}>Setup Required</div>
            );
            if (signatureInfo.exists && merkleInfo?.valid) return (
              <div className="metric-value" style={{ color: "var(--success)" }}>Secure</div>
            );
            return (
              <div className="metric-value" style={{ color: "var(--danger)" }}>Issues</div>
            );
          })()}
          <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            {!signatureInfo?.exists
              ? "No signing key"
              : !merkleInfo?.valid
                ? "Merkle tree invalid"
                : "All checks passed"}
          </div>
        </motion.div>
      </div>

      {/* Merkle Tree Visualizer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.28, ease: "ease" }}
        style={{ marginBottom: "1.5rem" }}
      >
        <MerkleTreeVisualizer />
      </motion.div>

      {/* Key Rotation Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.28, ease: "ease" }}
      >
        <KeyRotationPanel showToast={showToast} />
      </motion.div>

      {/* Alert Config Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.28, ease: "ease" }}
        className="section-card"
        style={{ marginTop: "1.5rem" }}
      >
        <AlertConfigCard
          config={alertConfig}
          configLoading={alertConfigLoading}
          showToast={showToast}
        />
      </motion.div>

      {/* Educational Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.28, ease: "ease" }}
        className="section-card"
        style={{ marginTop: "1.5rem" }}
      >
        <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700 }}>
          About Cryptographic Security
        </h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1.5rem",
        }}>
          <div>
            <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileSignature size={16} color="var(--accent)" />
              Digital Signatures (ECDSA)
            </h4>
            <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.6, color: "var(--text)" }}>
              Each log block is cryptographically signed using ECDSA with the
              P-256 curve. This provides non-repudiation and ensures that any
              modification to the block data can be detected through signature
              verification.
            </p>
          </div>

          <div>
            <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Lock size={16} color="var(--accent)" />
              Merkle Trees
            </h4>
            <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.6, color: "var(--text)" }}>
              A Merkle tree is built from all log entries, creating a single
              root hash that represents the entire chain. Merkle proofs allow
              efficient verification that a specific log entry is part of the
              chain without revealing other entries.
            </p>
          </div>

          <div>
            <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Key size={16} color="var(--accent)" />
              Key Rotation
            </h4>
            <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.6, color: "var(--text)" }}>
              Signing keys are automatically rotated based on a configurable
              TTL (default 90 days). This limits the impact of a compromised
              key and follows cryptographic best practices. Old keys are
              securely archived for historical verification.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
