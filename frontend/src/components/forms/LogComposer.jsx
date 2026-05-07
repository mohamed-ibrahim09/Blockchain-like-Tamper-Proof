import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { LoaderCircle, Sparkles } from "lucide-react";

import { createLog } from "../../lib/api";
import { getAlgorithmLabel } from "../../lib/formatters";
import { SectionCard } from "../ui/SectionCard";
import { StatusPill } from "../ui/StatusPill";

const algorithmOptions = ["vigenere", "playfair", "rsa", "hybrid"];

const algorithmInfo = {
  vigenere: {
    name: "Vigenère Cipher",
    description: "A classical polyalphabetic substitution cipher. It uses a keyword to shift letters based on a repeating sequence.",
    keyInfo: "The key must be alphabetical. It dictates the shifting offsets."
  },
  playfair: {
    name: "Playfair Cipher",
    description: "A manual symmetric encryption technique that encrypts pairs of letters (digraphs) using a 5x5 key matrix.",
    keyInfo: "The key is used to generate the 5x5 alphabet grid, excluding duplicates."
  },
  rsa: {
    name: "RSA Algorithm",
    description: "An asymmetric cryptographic algorithm based on the difficulty of factoring large prime numbers.",
    keyInfo: "Dynamic P and Q primes are used to generate the public/private key pairs."
  },
  hybrid: {
    name: "Hybrid Pipeline",
    description: "A sequenced approach combining multiple algorithms to increase security.",
    keyInfo: "Combines Playfair, Vigenère, and RSA sequentially managed by the backend engine."
  }
};

export function LogComposer() {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState({
    original_message: "",
    algorithm: "vigenere",
    key: "",
    p: "61",
    q: "53",
  });
  const [entryType, setEntryType] = useState("manual");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormState((current) => ({ ...current, original_message: e.target.result }));
    };
    reader.readAsText(file);
  };

  const mutation = useMutation({
    mutationFn: createLog,
    onSuccess: async (data) => {
      setResult(data);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["logs"] }),
        queryClient.invalidateQueries({ queryKey: ["verification"] }),
        queryClient.invalidateQueries({ queryKey: ["warnings"] }),
        queryClient.invalidateQueries({ queryKey: ["comparison"] }),
      ]);
    },
  });

  function handleSubmit(event) {
    event.preventDefault();

    let finalKey = formState.key;
    if (formState.algorithm === "rsa") {
      finalKey = `${formState.p},${formState.q}`;
    }

    const payload = {
      original_message: formState.original_message,
      algorithm: formState.algorithm,
      key: finalKey,
    };

    mutation.mutate(payload);
  }

  return (
    <div className="composer-grid">
      <SectionCard
        eyebrow="Create"
        title="Add a new protected log"
        subtitle="Encrypt the message, chain it to the previous block, and store a deterministic hash for verification."
      >
        <form className="form-stack" onSubmit={handleSubmit}>
          <div className="field">
            <span className="field-label">Entry Method</span>
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <button 
                type="button" 
                className={entryType === "manual" ? "primary-button" : "secondary-button"} 
                onClick={() => setEntryType("manual")}
                style={{ flex: 1, padding: "0.5rem" }}
              >
                Manual Entry
              </button>
              <button 
                type="button" 
                className={entryType === "file" ? "primary-button" : "secondary-button"} 
                onClick={() => setEntryType("file")}
                style={{ flex: 1, padding: "0.5rem" }}
              >
                Upload File (.txt)
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {entryType === "manual" ? (
              <motion.label 
                key="manual"
                className="field"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <span className="field-label">Original message</span>
                <span className="field-help">Use a short event description or audit note for the demo chain.</span>
                <textarea
                  rows={6}
                  placeholder="Enter the log message to protect..."
                  value={formState.original_message}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, original_message: event.target.value }))
                  }
                  required
                />
              </motion.label>
            ) : (
              <motion.label 
                key="file"
                className="field"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <span className="field-label">Upload Log File</span>
                <span className="field-help">Upload a text file to read its contents directly into the ledger.</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input
                      type="file"
                      accept=".txt,.json,.csv,.log"
                      onChange={handleFileUpload}
                      required={!formState.original_message}
                    />
                    {fileName && <span className="support-copy" style={{ color: 'var(--success)' }}>Loaded: {fileName} ({formState.original_message.length} characters)</span>}
                </div>
              </motion.label>
            )}
          </AnimatePresence>

          <div className="field-row" style={{ gridTemplateColumns: '1fr' }}>
            <div className="field">
              <span className="field-label">Algorithm</span>
              <span className="field-help">Choose the encryption method that will protect this block.</span>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                {algorithmOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={formState.algorithm === option ? "tag tag-warning" : "tag"}
                    style={{ cursor: 'pointer', padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
                    onClick={() => setFormState((current) => ({ ...current, algorithm: option }))}
                  >
                    {getAlgorithmLabel(option)}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {formState.algorithm === "rsa" ? (
                <motion.div
                  key="rsa-inputs"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}
                >
                  <label className="field">
                    <span className="field-label">Prime P</span>
                    <span className="field-help">First prime number.</span>
                    <input
                      type="number"
                      placeholder="e.g. 61"
                      value={formState.p}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, p: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label className="field">
                    <span className="field-label">Prime Q</span>
                    <span className="field-help">Second prime number.</span>
                    <input
                      type="number"
                      placeholder="e.g. 53"
                      value={formState.q}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, q: event.target.value }))
                      }
                      required
                    />
                  </label>
                </motion.div>
              ) : (
                <motion.label
                  key="key-input"
                  className="field"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="field-label">Key</span>
                  <span className="field-help">Required to encrypt and decrypt the message.</span>
                  <input
                    placeholder={["vigenere", "playfair"].includes(formState.algorithm) ? "Enter the required key" : "Optional for this algorithm"}
                    value={formState.key}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, key: event.target.value }))
                    }
                    required={["vigenere", "playfair"].includes(formState.algorithm)}
                  />
                </motion.label>
              )}
            </AnimatePresence>
          </div>



          <button className="primary-button" disabled={mutation.isPending} type="submit">
            {mutation.isPending ? <LoaderCircle className="spin" size={18} /> : <Sparkles size={18} />}
            Create protected log
          </button>

          {mutation.error ? (
            <div className="inline-feedback tone-danger">
              {mutation.error.response?.data?.detail || "Request failed."}
            </div>
          ) : null}
        </form>
      </SectionCard>

      <div className="stack-md">
        <SectionCard
          eyebrow="Result"
          title="Latest stored block"
          subtitle="The next block preview appears here after a successful create request."
        >
          {result ? (
            <motion.div className="result-stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="block-badges">
                <StatusPill tone="success">Stored as block #{result.id}</StatusPill>
                <StatusPill tone="neutral">{getAlgorithmLabel(result.algorithm)}</StatusPill>
              </div>
              <div className="mono-block">
                {isExpanded || result.encrypted_message.length <= 200 
                  ? result.encrypted_message 
                  : `${result.encrypted_message.slice(0, 200)}...`}
                {result.encrypted_message.length > 200 && (
                  <button 
                    type="button"
                    className="ghost-button" 
                    style={{ display: 'block', marginTop: '0.8rem', fontSize: '0.85rem' }}
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? "Show less" : "See more"}
                  </button>
                )}
              </div>
              <div className="hash-stack">
                <div>
                  <span className="label-muted">Previous hash</span>
                  <code>{result.previous_hash}</code>
                </div>
                <div>
                  <span className="label-muted">Current hash</span>
                  <code>{result.current_hash}</code>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="empty-state">
              The first block becomes the genesis-style record with a default previous hash.
            </div>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="Algorithm Insights"
          title={algorithmInfo[formState.algorithm].name}
          subtitle={algorithmInfo[formState.algorithm].description}
        >
          <AnimatePresence mode="wait">
            <motion.ul
              key={formState.algorithm}
              className="plain-list"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <li><strong>Key Mechanism:</strong> {algorithmInfo[formState.algorithm].keyInfo}</li>
              <li><strong>Data Logged:</strong> Encrypted message output</li>
              <li><strong>Chaining:</strong> Previous block's hash link</li>
              <li><strong>Integrity:</strong> Current SHA-256 hash for tamper detection</li>
            </motion.ul>
          </AnimatePresence>
        </SectionCard>
      </div>
    </div>
  );
}
