import { useQuery } from "@tanstack/react-query";

import { ComparisonCharts } from "../components/charts/ComparisonCharts";
import { MetricCard } from "../components/ui/MetricCard";
import { SectionCard } from "../components/ui/SectionCard";
import { StatusPill } from "../components/ui/StatusPill";
import { fetchComparisonMetrics } from "../lib/api";
import { getStatusTone } from "../lib/formatters";

export function StatisticsPage() {
  const { data } = useQuery({ queryKey: ["comparison"], queryFn: fetchComparisonMetrics });

  return (
    <div className="page-stack">
      <section className="page-header">
        <p className="page-eyebrow">Statistics</p>
        <h1 className="page-title">Analyze algorithm performance and metrics.</h1>
        <p className="page-description">
          Detailed metrics showing timing, ciphertext growth, and performance trends across different encryption modes.
        </p>
      </section>

      <div className="metric-row">
        <MetricCard label="Sample text" value={data?.sample_message ? "Loaded" : "Pending"} detail="Shared benchmark input" />
        <MetricCard
          label="Chain status"
          value={data?.current_chain_status || "healthy"}
          detail="Global integrity status"
          tone={getStatusTone(data?.current_chain_status || "healthy")}
        />
        <MetricCard label="Total blocks" value={data?.log_count ?? 0} detail="Ledger size" />
      </div>

      <SectionCard
        eyebrow="Overview"
        title="Algorithm Statistics Dashboard"
        subtitle="Visualizing performance metrics and cryptographic overhead for the selected algorithms."
        aside={
          <StatusPill tone={getStatusTone(data?.current_chain_status || "healthy")}>
            {data?.current_chain_status || "healthy"}
          </StatusPill>
        }
      />

      {data?.metrics?.length ? <ComparisonCharts metrics={data.metrics} /> : null}

      
    </div>
  );
}
