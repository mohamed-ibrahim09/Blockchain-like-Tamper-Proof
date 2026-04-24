import { motion } from "framer-motion";

export function AlertBanner({ tone = "neutral", title, description, meta = [], action = null }) {
  return (
    <motion.section
      className={`alert-banner tone-${tone}`}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="alert-copy">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
        {meta.length ? (
          <div className="alert-meta">
            {meta.map((item) => (
              <span className="alert-chip" key={item}>
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {action ? <div className="alert-action">{action}</div> : null}
    </motion.section>
  );
}
