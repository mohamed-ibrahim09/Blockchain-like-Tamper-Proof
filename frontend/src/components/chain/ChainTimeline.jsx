import { useState } from "react";
import { motion } from "framer-motion";

import { BlockCard } from "./BlockCard";

export function ChainTimeline({
  logs,
  verificationResults = [],
  changedBlockIds = [],
  affectedBlockIds = [],
}) {
  const [expandedBlockId, setExpandedBlockId] = useState(null);
  const verificationMap = new Map(verificationResults.map((item) => [item.id, item]));
  const changedSet = new Set(changedBlockIds);
  const affectedSet = new Set(affectedBlockIds);

  if (!logs.length) {
    return <div className="empty-state">No blocks yet. Create your first encrypted log to start the chain.</div>;
  }

  return (
    <div className="timeline">
      {logs.map((log, index) => {
        const fallbackVerification = changedSet.has(log.id)
          ? {
              id: log.id,
              status: "tampered",
              reasons: ["This block is listed as changed by the verification summary."],
            }
          : affectedSet.has(log.id)
            ? {
                id: log.id,
                status: "affected",
                reasons: ["This block is listed as affected by an earlier chain break."],
              }
            : undefined;

        return (
          <div className="timeline-item" key={log.id}>
            <div className="timeline-rail">
              <motion.span
                className="timeline-node"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              />
              {index < logs.length - 1 ? <span className="timeline-line" /> : null}
            </div>
            <BlockCard
              log={log}
              verification={verificationMap.get(log.id) || fallbackVerification}
              expanded={expandedBlockId === log.id}
              onExpandedChange={(nextExpanded) => setExpandedBlockId(nextExpanded ? log.id : null)}
            />
          </div>
        );
      })}
    </div>
  );
}
