export function StatusPill({ tone = "neutral", children }) {
  return <span className={`status-pill tone-${tone}`}>{children}</span>;
}
