import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { ChainTimeline } from "../components/chain/ChainTimeline";
import { AlertBanner } from "../components/ui/AlertBanner";
import { MetricCard } from "../components/ui/MetricCard";
import { SectionCard } from "../components/ui/SectionCard";
import { StatusPill } from "../components/ui/StatusPill";
import { WarningHistoryList } from "../components/ui/WarningHistoryList";
import { fetchChainWarnings, fetchComparisonMetrics, fetchLogs, fetchChainStatus } from "../lib/api";
import {
  formatBlockIdList,
  getAffectedBlockIds,
  getChangedBlockIds,
  getFirstBrokenBlockId,
  getStatusTone,
  getVerificationResults,
  normalizeWarnings,
} from "../lib/formatters";

export function DashboardPage() {
  const { data: logsData } = useQuery({
    queryKey: ["logs"],
    queryFn: fetchLogs,
    refetchInterval: 5000,
  });
  const { data: verificationData } = useQuery({
    queryKey: ["chain-status"],
    queryFn: fetchChainStatus,
    refetchInterval: 5000,   // re-checks chain health every 5 s
  });
  const { data: comparisonData } = useQuery({ queryKey: ["comparison"], queryFn: fetchComparisonMetrics });
  const { data: warningsData } = useQuery({
    queryKey: ["warnings"],
    queryFn: fetchChainWarnings,
    refetchInterval: 5000,
  });

  const logs = logsData?.items || [];
  const verificationResults = getVerificationResults(verificationData);
  const changedBlockIds = getChangedBlockIds(verificationData);
  const affectedBlockIds = getAffectedBlockIds(verificationData);
  const firstBrokenBlockId = getFirstBrokenBlockId(verificationData);
  const warnings = normalizeWarnings(warningsData);
  const latestWarning = warnings[warnings.length - 1];
  const hasIssues = verificationResults.length > 0 && !verificationData?.is_valid;

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div className="hero-copy">
          <p className="page-eyebrow">University project dashboard</p>
          <h1 className="page-title page-title-display">One changed log should be enough to expose a broken chain.</h1>
          <p className="page-description">
            Walk through the full demo flow: create encrypted logs, store them as connected blocks, and see exactly
            how verification reacts when one record is changed.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/create">
              Create a log
              <ArrowRight size={16} />
            </Link>
            <Link className="secondary-button" to="/verification">
              Open verification
            </Link>
          </div>
        </div>

        <aside className="hero-aside">
          <StatusPill tone={getStatusTone(verificationData?.is_valid ? "healthy" : "broken")}>
            {verificationData?.is_valid ? "Chain healthy" : "Integrity warning"}
          </StatusPill>
          <div className="hero-stat-list">
            <div>
              <span className="label-muted">Current ledger</span>
              <strong>{logs.length ? `${logs.length} blocks stored` : "No blocks yet"}</strong>
            </div>
            <div>
              <span className="label-muted">Detection model</span>
              <strong>Encrypted message + previous hash + current hash</strong>
            </div>
            <div>
              <span className="label-muted">Tracked algorithms</span>
              <strong>{comparisonData?.metrics?.length ?? 4} modes ready for comparison</strong>
            </div>
          </div>
        </aside>
      </section>

      <AlertBanner
        tone={hasIssues ? "danger" : "success"}
        title={hasIssues ? "Verification has detected a broken chain." : "The chain is currently healthy."}
        description={
          hasIssues
            ? latestWarning?.summary || "Verification found changed blocks and downstream effects in the ledger."
            : "Every stored block still matches its own hash and previous-hash link."
        }
        meta={
          hasIssues
            ? [
                `First break: ${firstBrokenBlockId ? `#${firstBrokenBlockId}` : "Not identified"}`,
                `Changed: ${formatBlockIdList(changedBlockIds)}`,
                `Affected: ${formatBlockIdList(affectedBlockIds)}`,
              ]
            : [`Checked blocks: ${logs.length}`, `Warnings recorded: ${warnings.length}`]
        }
      />

      <div className="metric-row">
        <MetricCard label="Stored blocks" value={logs.length} detail="Current chain size" tone="neutral" />
        <MetricCard
          label="Valid blocks"
          value={verificationData?.valid_blocks ?? 0}
          detail="Passed verification"
          tone="success"
        />
        <MetricCard
          label="Changed blocks"
          value={changedBlockIds.length}
          detail="Direct hash mismatches"
          tone={hasIssues ? "danger" : "neutral"}
        />
        <MetricCard
          label="Affected blocks"
          value={affectedBlockIds.length}
          detail="Downstream impact"
          tone={affectedBlockIds.length ? "warning" : "neutral"}
        />
      </div>

      <SectionCard
        eyebrow="Chain preview"
        title="Recent blocks"
        subtitle="Each block stores encrypted output, a previous hash pointer, and its own current hash."
        aside={
          <Link className="ghost-button" to="/chain">
            Open full viewer
          </Link>
        }
      >
        <ChainTimeline
          logs={logs.slice(-3)}
          verificationResults={verificationResults}
          changedBlockIds={changedBlockIds}
          affectedBlockIds={affectedBlockIds}
        />
      </SectionCard>

      <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
        <SectionCard
          eyebrow="Warnings"
          title="Warning history"
          subtitle="Every invalid verification writes a persistent warning entry to the warning ledger."
        >
          <WarningHistoryList
            warnings={[...warnings].reverse().slice(0, 3)}
            emptyMessage="No warning history yet. The chain is currently clean."
          />
        </SectionCard>
      </div>
    </div>
  );
}
