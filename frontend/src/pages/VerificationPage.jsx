import { useMutation, useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";

import { AlertBanner } from "../components/ui/AlertBanner";
import { MetricCard } from "../components/ui/MetricCard";
import { SectionCard } from "../components/ui/SectionCard";
import { StatusPill } from "../components/ui/StatusPill";
import { WarningHistoryList } from "../components/ui/WarningHistoryList";
import { fetchChainWarnings, verifyChain } from "../lib/api";
import { queryClient } from "../lib/queryClient";
import {
  formatBlockIdList,
  formatDate,
  getFirstBrokenBlockId,
  getAffectedBlockIds,
  getAlgorithmLabel,
  getChangedBlockIds,
  getStatusTone,
  getVerificationResults,
  normalizeWarnings,
  shortenHash,
} from "../lib/formatters";

export function VerificationPage() {
  const { data, isLoading } = useQuery({ queryKey: ["verification"], queryFn: verifyChain });
  const { data: warningsData } = useQuery({ queryKey: ["warnings"], queryFn: fetchChainWarnings });
  const mutation = useMutation({
    mutationFn: verifyChain,
    onSuccess: async (result) => {
      queryClient.setQueryData(["verification"], result);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["logs"] }),
        queryClient.invalidateQueries({ queryKey: ["warnings"] }),
      ]);
    },
  });

  const verificationResults = getVerificationResults(data);
  const changedBlockIds = getChangedBlockIds(data);
  const affectedBlockIds = getAffectedBlockIds(data);
  const firstBrokenBlockId = getFirstBrokenBlockId(data);
  const warnings = normalizeWarnings(warningsData);
  const hasIssues = verificationResults.length > 0 && !data?.is_valid;

  return (
    <div className="page-stack">
      <section className="page-hero page-hero-compact">
        <div className="hero-copy">
          <p className="page-eyebrow">Verification</p>
          <h1 className="page-title">Check the full chain and surface exactly where trust breaks.</h1>
          <p className="page-description">
            Verification recomputes every block hash, confirms the previous-hash links, and prepares the UI for changed
            and affected block states.
          </p>
        </div>

        <aside className="hero-aside">
          <StatusPill tone={getStatusTone(data?.is_valid ? "healthy" : "broken")}>
            {data?.is_valid ? "Chain healthy" : "Chain broken"}
          </StatusPill>
          <button className="primary-button" type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? <LoaderCircle className="spin" size={16} /> : null}
            Run verification
          </button>
          {data?.verified_at ? <p className="support-copy">Last checked {formatDate(data.verified_at)}</p> : null}
        </aside>
      </section>

      <AlertBanner
        tone={hasIssues ? "danger" : "success"}
        title={hasIssues ? "Verification found a broken chain." : "All stored blocks passed verification."}
        description={
          hasIssues
            ? "Changed blocks failed their own integrity checks, and later blocks may be marked as affected."
            : "No changed or affected blocks were found in the current ledger."
        }
        meta={[
          `First break: ${firstBrokenBlockId ? `#${firstBrokenBlockId}` : "Not identified"}`,
          `Changed: ${formatBlockIdList(changedBlockIds)}`,
          `Affected: ${formatBlockIdList(affectedBlockIds)}`,
        ]}
      />

      <div className="metric-row">
        <MetricCard
          label="Chain status"
          value={data?.is_valid ? "Healthy" : "Broken"}
          detail="Overall integrity result"
          tone={getStatusTone(data?.is_valid ? "healthy" : "broken")}
        />
        <MetricCard label="Total blocks" value={data?.total_blocks ?? 0} detail="Checked in order" tone="neutral" />
        <MetricCard
          label="Changed blocks"
          value={changedBlockIds.length}
          detail="Direct verification failures"
          tone={changedBlockIds.length ? "danger" : "neutral"}
        />
        <MetricCard
          label="First broken"
          value={firstBrokenBlockId ? `#${firstBrokenBlockId}` : "None"}
          detail="Earliest detected break"
          tone={hasIssues ? "warning" : "neutral"}
        />
      </div>

      <div className="page-columns">
        <SectionCard
          eyebrow="Impact"
          title="Changed and affected blocks"
          subtitle="These tags make the difference between the original break and downstream impact easy to explain."
        >
          <div className="stack-md">
            <div>
              <p className="label-muted">Changed blocks</p>
              <div className="tag-list">
                {changedBlockIds.length ? (
                  changedBlockIds.map((id) => (
                    <span className="tag tag-danger" key={id}>
                      #{id}
                    </span>
                  ))
                ) : (
                  <span className="empty-inline">No changed blocks</span>
                )}
              </div>
            </div>
            <div>
              <p className="label-muted">Affected blocks</p>
              <div className="tag-list">
                {affectedBlockIds.length ? (
                  affectedBlockIds.map((id) => (
                    <span className="tag tag-warning" key={id}>
                      #{id}
                    </span>
                  ))
                ) : (
                  <span className="empty-inline">No affected blocks</span>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Warnings"
          title="Warning history"
          subtitle="Each failed verification appends a warning event with the changed and affected block ids."
        >
          <WarningHistoryList warnings={[...warnings].reverse()} emptyMessage="No warning events have been recorded yet." />
        </SectionCard>
      </div>

      <SectionCard
        eyebrow="Per block"
        title="Verification results"
        subtitle="A block can be changed itself or only affected because an earlier block was already broken."
      >
        {isLoading ? (
          <div className="empty-state">Verification data is loading...</div>
        ) : verificationResults.length ? (
          <div className="verification-list">
            {verificationResults.map((result) => (
              <article key={result.id} className={`verification-row tone-${getStatusTone(result.status)}`}>
                <div className="verification-header">
                  <div className="verification-badges">
                    <StatusPill tone={getStatusTone(result.status)}>{result.status.toUpperCase()}</StatusPill>
                    <StatusPill tone="neutral">{getAlgorithmLabel(result.algorithm)}</StatusPill>
                  </div>
                  <div>
                    <h3>Block #{result.id}</h3>
                    <p className="support-copy">
                      Previous hash: {shortenHash(result.stored_previous_hash)} | Current hash: {shortenHash(result.stored_current_hash)}
                    </p>
                  </div>
                </div>
                <ul className="plain-list">
                  {result.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">Create a block to start verification.</div>
        )}
      </SectionCard>
    </div>
  );
}
