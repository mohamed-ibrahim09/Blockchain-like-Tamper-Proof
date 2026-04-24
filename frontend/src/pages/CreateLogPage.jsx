import { LogComposer } from "../components/forms/LogComposer";

export function CreateLogPage() {
  return (
    <div className="page-stack">
      <section className="page-header">
        <p className="page-eyebrow">Create and chain</p>
        <h1 className="page-title">Encrypt a message and add it as the next protected block.</h1>
        <p className="page-description">
          Choose an algorithm, submit the message, and let the backend attach the correct previous hash before storing
          the new block.
        </p>
      </section>
      <LogComposer />
    </div>
  );
}
