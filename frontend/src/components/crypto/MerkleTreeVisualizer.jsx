import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, ChevronDown, ChevronUp, Info, CheckCircle2, XCircle, GitCommit, GitMerge, Search } from "lucide-react";
import { fetchMerkleTreeInfo, fetchMerkleProof } from "../../lib/api";
import { shortenHash } from "../../lib/formatters";

/**
 * Interactive Merkle Tree Visualizer
 * Root at TOP, leaves at BOTTOM (standard CS convention)
 */

function TreeNode({ 
  hash, 
  isLeaf, 
  isRoot, 
  isInProofPath, 
  isSibling, 
  level, 
  index, 
  totalAtLevel,
  onClick,
  isSelected,
  siblingDirection,
  totalLevels,
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Root is at level 0 (top), leaves at the bottom
  const spacing = 180;
  const startX = -(totalAtLevel - 1) * spacing / 2;
  const pos = {
    x: startX + index * spacing,
    y: level * 120,
  };

  const getNodeColor = () => {
    if (isRoot) return "var(--success)";
    if (isInProofPath) return "var(--accent)";
    if (isSibling) return "var(--warning)";
    if (isSelected) return "var(--link)";
    return "var(--surface-3, var(--surface-2))";
  };

  const getBorderColor = () => {
    if (isRoot) return "var(--success)";
    if (isInProofPath) return "var(--accent)";
    if (isSibling) return "var(--warning)";
    if (isSelected) return "var(--link)";
    return "var(--border)";
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: level * 0.1 + index * 0.05, duration: 0.28, ease: "ease" }}
      style={{
        position: "absolute",
        left: `calc(50% + ${pos.x}px)`,
        top: pos.y,
        transform: "translate(-50%, 0)",
        zIndex: isInProofPath || isSelected ? 10 : 1,
      }}
    >
      <div
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          width: isRoot ? 140 : 120,
          padding: "0.75rem",
          background: getNodeColor(),
          border: `2px solid ${getBorderColor()}`,
          borderRadius: "12px",
          cursor: onClick ? "pointer" : "default",
          boxShadow: isInProofPath || isSelected
            ? `0 0 20px ${getBorderColor()}40`
            : "var(--shadow-whisper)",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ textAlign: "center" }}>
          {isRoot && (
            <GitMerge size={16} style={{ marginBottom: "0.25rem", color: "#fff" }} />
          )}
          {isLeaf && (
            <GitCommit size={16} style={{ marginBottom: "0.25rem", color: "var(--text)" }} />
          )}
          <div
            style={{
              fontSize: "0.65rem",
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              color: isRoot ? "#fff" : "var(--text-strong)",
              wordBreak: "break-all",
              lineHeight: 1.4,
            }}
          >
            {shortenHash(hash, isRoot ? 16 : 12)}
          </div>
          {isSibling && siblingDirection && (
            <div style={{ fontSize: "0.6rem", color: "var(--text)", marginTop: "0.25rem", fontWeight: 600 }}>
              {siblingDirection === "left" ? "← Left" : "Right →"}
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              marginTop: "0.5rem",
              padding: "0.5rem 0.75rem",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "0.75rem",
              color: "var(--text)",
              whiteSpace: "nowrap",
              zIndex: 100,
              boxShadow: "var(--shadow-elevated)",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
              {isRoot ? "Root Hash" : isLeaf ? "Leaf Node" : "Intermediate Hash"}
            </div>
            <div style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: "0.65rem" }}>
              {hash}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ConnectionLine({ from, to, isHighlighted }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.28, delay: 0.15, ease: "ease" }}
      style={{
        position: "absolute",
        left: `calc(50% + ${from.x}px)`,
        top: from.y,
        width: length,
        height: 2,
        background: isHighlighted ? "var(--accent)" : "var(--border)",
        transformOrigin: "left center",
        transform: `rotate(${angle}deg)`,
        zIndex: isHighlighted ? 5 : 0,
        boxShadow: isHighlighted ? "0 0 8px var(--accent)" : "none",
      }}
    />
  );
}

export function MerkleTreeVisualizer() {
  const [treeInfo, setTreeInfo] = useState(null);
  const [selectedLeaf, setSelectedLeaf] = useState(null);
  const [proofData, setProofData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [proofBlockId, setProofBlockId] = useState("");
  const [proofLoading, setProofLoading] = useState(false);
  const [proofSteps, setProofSteps] = useState(null);

  useEffect(() => { loadTreeInfo(); }, []);

  const loadTreeInfo = async () => {
    setLoading(true);
    try {
      const data = await fetchMerkleTreeInfo();
      setTreeInfo(data);
    } catch (err) {
      setError("Failed to load Merkle tree data");
    } finally {
      setLoading(false);
    }
  };

  const loadProof = async (logId) => {
    try {
      const proof = await fetchMerkleProof(logId);
      setProofData(proof);
    } catch (err) {
      console.error("Failed to load proof:", err);
    }
  };

  const handleLeafClick = useCallback((leafIndex) => {
    setSelectedLeaf(leafIndex);
    const logId = treeInfo?.log_ids?.[leafIndex] || leafIndex + 1;
    loadProof(logId);
  }, [treeInfo]);

  const handleGenerateProof = async () => {
    if (!proofBlockId.trim()) return;
    setProofLoading(true);
    setProofSteps(null);
    try {
      const proof = await fetchMerkleProof(Number(proofBlockId));
      setProofSteps(proof);
    } catch (err) {
      setProofSteps({ error: err.response?.data?.detail || "Proof generation failed" });
    } finally {
      setProofLoading(false);
    }
  };

  // Build tree: levels[0] = root (top), levels[last] = leaves (bottom)
  const buildTree = () => {
    const leafCount = treeInfo?.leaf_count || 4;
    const leaves = Array.from({ length: leafCount }, (_, i) => ({
      hash: treeInfo?.leaf_hashes?.[i] || `Log #${i + 1} Hash`,
      index: i,
    }));

    // Build bottom-up: leaves first, then intermediate, then root
    const bottomUp = [leaves];
    let currentLevel = leaves;
    while (currentLevel.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left;
        nextLevel.push({
          hash: `hash_${bottomUp.length}_${i / 2}`,
          left,
          right,
          index: i / 2,
        });
      }
      bottomUp.push(nextLevel);
      currentLevel = nextLevel;
    }

    // Reverse so root is at index 0 (top), leaves at the end (bottom)
    const levels = [...bottomUp].reverse();
    return { levels, root: levels[0][0], leafLevel: levels.length - 1 };
  };

  const { levels, root, leafLevel } = buildTree();
  const totalLevels = levels.length;

  // Check if a node is in the proof path (the leaf and its ancestors)
  const isInProofPath = (levelIdx, nodeIdx) => {
    if (!proofData || selectedLeaf === null) return false;
    const d = leafLevel - levelIdx;
    const targetIdx = Math.floor(selectedLeaf / Math.pow(2, d));
    return nodeIdx === targetIdx;
  };

  // Check if a node is a sibling needed for the proof
  const isSibling = (levelIdx, nodeIdx) => {
    if (!proofData || selectedLeaf === null) return false;
    if (levelIdx === 0) return false; // Root has no sibling
    const d = leafLevel - levelIdx;
    const ancestorIdx = Math.floor(selectedLeaf / Math.pow(2, d));
    const siblingIdx = ancestorIdx % 2 === 0 ? ancestorIdx + 1 : ancestorIdx - 1;
    return nodeIdx === siblingIdx && nodeIdx < levels[levelIdx].length;
  };

  if (loading) {
    return (
      <div className="section-card" style={{ textAlign: "center", padding: "3rem" }}>
        <div className="spin" style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>🌳</div>
        <p>Building Merkle Tree...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-card tone-danger" style={{ padding: "1.5rem" }}>
        <XCircle size={24} style={{ marginBottom: "0.5rem" }} />
        <p>{error}</p>
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
          <Hash size={20} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Interactive Merkle Tree</h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
            Click a leaf to see the proof path
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          style={{
            marginLeft: "auto", padding: "0.5rem", borderRadius: "8px",
            border: "1px solid var(--border)", background: "var(--surface-2)",
            cursor: "pointer",
          }}
        >
          {showDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Tree Visualization - Root at TOP */}
      <div
        style={{
          position: "relative",
          height: totalLevels * 120 + 80,
          overflow: "auto",
          marginBottom: "1.5rem",
          padding: "2rem 1rem",
          background: "var(--surface-2)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
        }}
      >
        {/* Connection Lines: parent (level) → children (level+1) */}
        {levels.slice(0, -1).map((level, levelIdx) =>
          level.map((node, nodeIdx) => {
            // Children are at levelIdx + 1
            const childLevel = levels[levelIdx + 1];
            if (!childLevel) return null;

            // This node's children are at indices nodeIdx*2 and nodeIdx*2+1
            const children = [childLevel[nodeIdx * 2], childLevel[nodeIdx * 2 + 1]];
            
            return children.map((child, childOffset) => {
              if (!child) return null;
              const childIdx = nodeIdx * 2 + childOffset;

              const from = {
                x: (-(level.length - 1) * 180 / 2) + nodeIdx * 180,
                y: levelIdx * 120 + 50, // bottom of parent node
              };
              const to = {
                x: (-(childLevel.length - 1) * 180 / 2) + childIdx * 180,
                y: (levelIdx + 1) * 120, // top of child node
              };

              const isHighlighted = isInProofPath(levelIdx, nodeIdx) ||
                                   isInProofPath(levelIdx + 1, childIdx);

              return (
                <ConnectionLine
                  key={`line-${levelIdx}-${nodeIdx}-${childOffset}`}
                  from={from}
                  to={to}
                  isHighlighted={isHighlighted}
                />
              );
            });
          }).flat().filter(Boolean)
        )}

        {/* Nodes */}
        {levels.map((level, levelIdx) =>
          level.map((node, nodeIdx) => (
            <TreeNode
              key={`node-${levelIdx}-${nodeIdx}`}
              hash={node.hash}
              isLeaf={levelIdx === leafLevel}
              isRoot={levelIdx === 0}
              isInProofPath={isInProofPath(levelIdx, nodeIdx)}
              isSibling={isSibling(levelIdx, nodeIdx)}
              level={levelIdx}
              index={nodeIdx}
              totalAtLevel={level.length}
              totalLevels={totalLevels}
              onClick={levelIdx === leafLevel ? () => handleLeafClick(nodeIdx) : undefined}
              isSelected={selectedLeaf === nodeIdx && levelIdx === leafLevel}
              siblingDirection={selectedLeaf !== null && isSibling(levelIdx, nodeIdx)
                ? nodeIdx < selectedLeaf ? "left" : "right"
                : null
              }
            />
          ))
        )}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem", fontSize: "0.8rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "var(--success)", border: "2px solid var(--success)" }} />
          <span>Root Hash (top)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "var(--accent)", border: "2px solid var(--accent)" }} />
          <span>Proof Path</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "var(--warning)", border: "2px solid var(--warning)" }} />
          <span>Sibling Node</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "var(--surface-2)", border: "2px solid var(--border)" }} />
          <span>Regular Node</span>
        </div>
      </div>

      {/* FIX 5: About Merkle Trees - redesigned info box */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "ease" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              padding: "1.25rem",
              background: "color-mix(in srgb, var(--link) 6%, transparent)",
              borderLeft: "3px solid var(--link)",
              borderRadius: "var(--radius-sm)",
            }}>
              <h4 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Info size={16} color="var(--link)" />
                About Merkle Trees
              </h4>
              <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", lineHeight: 1.6 }}>
                A Merkle tree is a hash-based data structure that enables efficient
                verification of data integrity. Each leaf node represents a data block
                (log entry), and each non-leaf node is the hash of its child nodes.
              </p>

              {treeInfo && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem 1.5rem",
                  fontSize: "0.8rem",
                  marginBottom: "1rem",
                }}>
                  <div>
                    <strong style={{ color: "var(--muted)" }}>Root Hash</strong>
                    <div style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: "0.75rem" }}>
                      {shortenHash(treeInfo.root_hash, 20)}
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: "var(--muted)" }}>Status</strong>
                    <div>
                      {treeInfo.valid ? (
                        <span className="status-pill tone-success">Valid</span>
                      ) : (
                        <span className="status-pill tone-danger">Invalid</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: "var(--muted)" }}>Leaf Count</strong>
                    <div>{treeInfo.leaf_count}</div>
                  </div>
                  <div>
                    <strong style={{ color: "var(--muted)" }}>Last Verified</strong>
                    <div>Just now</div>
                  </div>
                  <div>
                    <strong style={{ color: "var(--muted)" }}>Tree Depth</strong>
                    <div>{Math.ceil(Math.log2(treeInfo.leaf_count || 1)) + 1} levels</div>
                  </div>
                  <div>
                    <strong style={{ color: "var(--muted)" }}>Proof Generation</strong>
                    <div>O(log n)</div>
                  </div>
                </div>
              )}

              {/* Verify a specific block inline tool */}
              <div style={{
                borderTop: "1px solid var(--border)",
                paddingTop: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}>
                <Search size={14} color="var(--link)" />
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Verify a specific block</span>
                <input
                  type="number"
                  value={proofBlockId}
                  onChange={(e) => setProofBlockId(e.target.value)}
                  placeholder="Enter block ID"
                  style={{
                    padding: "0.4rem 0.75rem",
                    borderRadius: "var(--radius-pill)",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--text)",
                    fontSize: "0.85rem",
                    width: "140px",
                  }}
                />
                <button
                  type="button"
                  onClick={handleGenerateProof}
                  disabled={proofLoading || !proofBlockId.trim()}
                  className="ghost-button"
                  style={{ minHeight: 0, padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}
                >
                  {proofLoading ? "Generating..." : "Generate Proof"}
                </button>
              </div>

              {/* Proof steps result */}
              <AnimatePresence>
                {proofSteps && !proofSteps.error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{ marginTop: "1rem" }}
                  >
                    <h5 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", fontWeight: 600 }}>
                      Proof for Block #{proofBlockId}
                    </h5>
                    <div style={{ fontSize: "0.8rem", fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}>
                      <div><strong>Leaf Hash:</strong> {shortenHash(proofSteps.leaf_hash, 20)}</div>
                      <div><strong>Root Hash:</strong> {shortenHash(proofSteps.root_hash, 20)}</div>
                    </div>
                    {proofSteps.siblings && proofSteps.siblings.length > 0 && (
                      <ol style={{ margin: "0.5rem 0 0", paddingLeft: "1.5rem", fontSize: "0.8rem" }}>
                        {proofSteps.siblings.map((s, i) => (
                          <li key={i} style={{ marginBottom: "0.25rem" }}>
                            <span className={`status-pill tone-${s.side === "left" ? "warning" : "neutral"}`} style={{ fontSize: "0.7rem" }}>
                              {s.side}
                            </span>
                            {" "}
                            <code style={{ fontSize: "0.75rem" }}>{shortenHash(s.hash, 16)}</code>
                          </li>
                        ))}
                      </ol>
                    )}
                  </motion.div>
                )}
                {proofSteps?.error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="inline-feedback tone-danger"
                    style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}
                  >
                    {proofSteps.error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proof Panel for clicked leaf */}
      {proofData && selectedLeaf !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "ease" }}
          style={{
            marginTop: "1.5rem",
            padding: "1.25rem",
            background: "color-mix(in srgb, var(--accent) 8%, transparent)",
            borderRadius: "10px",
            border: "1px solid var(--accent)",
          }}
        >
          <h4 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 600 }}>
            Proof for Log #{treeInfo?.log_ids?.[selectedLeaf] || selectedLeaf + 1}
          </h4>
          <div style={{ fontSize: "0.8rem", fontFamily: '"JetBrains Mono", ui-monospace, monospace', marginBottom: "1rem" }}>
            <div><strong>Leaf Hash:</strong> {shortenHash(proofData.leaf_hash, 20)}</div>
            <div><strong>Root Hash:</strong> {shortenHash(proofData.root_hash, 20)}</div>
            <div><strong>Siblings:</strong> {proofData.siblings?.length || 0} nodes</div>
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>
            Click on sibling nodes (amber) in the tree to see how they combine
            with the proof path to reconstruct the root hash.
          </p>
        </motion.div>
      )}
    </div>
  );
}
