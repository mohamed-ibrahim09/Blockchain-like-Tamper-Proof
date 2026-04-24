import { formatBlockIdList, formatDate } from "../../lib/formatters";

export function WarningHistoryList({ warnings = [], emptyMessage }) {
  if (!warnings.length) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <div className="warning-list">
      {warnings.map((warning) => (
        <article className="warning-entry" key={warning.id}>
          <div className="warning-entry-head">
            <div>
              <p className="label-muted">{formatDate(warning.timestamp)}</p>
              <h3>{warning.summary}</h3>
            </div>
          </div>
          <div className="warning-entry-body">
            <p>
              <strong>Changed:</strong> {formatBlockIdList(warning.changed_block_ids)}
            </p>
            <p>
              <strong>Affected:</strong> {formatBlockIdList(warning.affected_block_ids)}
            </p>
            {warning.first_broken_block_id ? (
              <p>
                <strong>First broken:</strong> #{warning.first_broken_block_id}
              </p>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
