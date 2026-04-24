import { motion } from "framer-motion";

export function MetricCard({ label, value, detail, tone = "neutral" }) {
  return (
    <motion.article
      className={`metric-card tone-${tone}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <p className="metric-label">{label}</p>
      <strong className="metric-value">{value}</strong>
      {detail ? <span className="metric-detail">{detail}</span> : null}
    </motion.article>
  );
}
