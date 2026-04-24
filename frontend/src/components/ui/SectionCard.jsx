import { motion } from "framer-motion";

export function SectionCard({ eyebrow, title, subtitle, aside, children, className = "" }) {
  return (
    <motion.section
      className={`section-card ${className}`.trim()}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      {(eyebrow || title || subtitle || aside) && (
        <div className="section-head">
          <div className="section-copy">
            {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
            {title ? <h2>{title}</h2> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {aside ? <div className="section-actions">{aside}</div> : null}
        </div>
      )}
      {children}
    </motion.section>
  );
}
