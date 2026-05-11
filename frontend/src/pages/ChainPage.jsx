import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, TriangleAlert } from "lucide-react";

import { ChainTimeline } from "../components/chain/ChainTimeline";
import { AlertBanner } from "../components/ui/AlertBanner";
import { SectionCard } from "../components/ui/SectionCard";
import { fetchChainWarnings, fetchLogs, resetChainData, verifyChain, fetchChainStatus } from "../lib/api";
import {
  formatBlockIdList,
  getAffectedBlockIds,
  getChangedBlockIds,
  getFirstBrokenBlockId,
  getVerificationResults,
  normalizeWarnings,
} from "../lib/formatters";

export function ChainPage() {
  const queryClient = useQueryClient();
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetFeedback, setResetFeedback] = useState(null);
  const { data: logsData } = useQuery({
    queryKey: ["logs"],
    queryFn: fetchLogs,
    refetchInterval: 5000,
  });
  const { data: verificationData } = useQuery({
    queryKey: ["chain-status"],
    queryFn: fetchChainStatus,
    refetchInterval: 5000,
  });
  const { data: warningsData } = useQuery({
    queryKey: ["warnings"],
    queryFn: fetchChainWarnings,
    refetchInterval: 5000,
  });
  const resetMutation = useMutation({
    mutationFn: resetChainData,
    onSuccess: async (data) => {
      setResetFeedback(data.message);
      setShowResetModal(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["logs"] }),
        queryClient.invalidateQueries({ queryKey: ["chain-status"] }),
        queryClient.invalidateQueries({ queryKey: ["warnings"] }),
        queryClient.invalidateQueries({ queryKey: ["comparison"] }),
      ]);
    },
  });

  const verificationResults = getVerificationResults(verificationData);
  const changedBlockIds = getChangedBlockIds(verificationData);
  const affectedBlockIds = getAffectedBlockIds(verificationData);
  const firstBrokenBlockId = getFirstBrokenBlockId(verificationData);
  const latestWarning = normalizeWarnings(warningsData).slice(-1)[0];
  const logs = logsData?.items || [];
  const hasIssues = verificationResults.length > 0 && !verificationData?.is_valid;

  return (
    <div className="page-stack">
      <section className="page-header">
        <p className="page-eyebrow">Log chain viewer</p>
        <h1 className="page-title">Inspect each encrypted block in order.</h1>
        <p className="page-description">
          Expand a block to review hashes, decrypt it with the matching path, or simulate tampering for the demo.
        </p>
      </section>

      {resetFeedback ? (
        <AlertBanner
          tone="success"
          title="Demo data cleared."
          description={resetFeedback}
          meta={["Ledger reset", "Warning history reset"]}
        />
      ) : null}

      {hasIssues ? (
        <AlertBanner
          tone="warning"
          title="Some blocks need attention."
          description={latestWarning?.summary || "Verification reports changed and affected blocks in this ledger."}
          meta={[
            `First break: ${firstBrokenBlockId ? `#${firstBrokenBlockId}` : "Not identified"}`,
            `Changed: ${formatBlockIdList(changedBlockIds)}`,
            `Affected: ${formatBlockIdList(affectedBlockIds)}`,
          ]}
        />
      ) : null}

      <SectionCard
        eyebrow="Ledger"
        title="Connected block timeline"
        subtitle="The viewer keeps one clear card per block so the previous-hash relationship stays readable."
        aside={
          <button className="danger-button" type="button" onClick={() => setShowResetModal(true)}>
            <RotateCcw size={16} />
            Clear data
          </button>
        }
      >
        <div className="support-banner">
          Use <strong>Clear data</strong> to empty both the ledger and warning history, then add fresh blocks manually
          from <strong>Create Log</strong>.
        </div>
        <ChainTimeline
          logs={logs}
          verificationResults={verificationResults}
          changedBlockIds={changedBlockIds}
          affectedBlockIds={affectedBlockIds}
        />
      </SectionCard>

      {showResetModal ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowResetModal(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="section-eyebrow">Reset demo data</p>
                <h2 id="reset-modal-title">Clear the JSON ledger and warnings?</h2>
              </div>
              <TriangleAlert size={20} />
            </div>
            <p className="page-description">
              This will erase all blocks from <code>log_chain.jsonl</code> and all warning events from
              <code> tamper_warnings.jsonl</code>. The app will stay empty until you add logs manually again.
            </p>
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setShowResetModal(false)}>
                Cancel
              </button>
              <button
                className="danger-button"
                type="button"
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
              >
                <RotateCcw size={16} />
                {resetMutation.isPending ? "Clearing..." : "Confirm clear"}
              </button>
            </div>
            {resetMutation.error ? (
              <div className="inline-feedback tone-danger">
                {resetMutation.error.response?.data?.detail || "Reset failed."}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
