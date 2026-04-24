import { SectionCard } from "../components/ui/SectionCard";

export function AboutPage() {
  return (
    <div className="page-stack">
      <section className="page-header">
        <p className="page-eyebrow">About</p>
        <h1 className="page-title">SecureLog — Blockchain-Powered Tamper-Proof Logging</h1>
        <p className="page-description">
          SecureLog is a modern full-stack web application designed to demonstrate how cryptography and hash chaining can be used to create tamper-evident logging systems.
        </p>
      </section>

      <section className="page-columns">
        <div className="note-card">
          <p>
            The platform allows users to encrypt sensitive data using multiple algorithms — RSA, Vigenère, Playfair, and Hybrid encryption — while automatically storing each operation in a blockchain-like log structure. Each log entry (block) is securely linked to the previous one using SHA-256 hashing, ensuring that any modification to stored data is immediately detectable.
          </p>
        </div>
        <div className="note-card">
          <p>
            Unlike traditional storage systems, SecureLog uses a file-based JSONL ledger, making it easy to inspect, test, and even simulate tampering scenarios. If any block is altered, the system detects the break and identifies all affected downstream blocks, providing full transparency and traceability.
          </p>
        </div>
      </section>

      <section className="section-card">
        <h2 className="section-eyebrow">Educational Focus</h2>
        <p className="page-description" style={{ marginBottom: '1rem' }}>
          The system is built for education, experimentation, and demonstration, helping users understand:
        </p>
        <ul className="plain-list">
          <li>How encryption works at the data level</li>
          <li>How hash chains ensure integrity</li>
          <li>How tampering propagates through a system</li>
          <li>How verification mechanisms detect inconsistencies</li>
        </ul>
        <p className="page-description" style={{ marginTop: '1rem' }}>
          SecureLog is not a distributed blockchain. It is a simplified, blockchain-inspired system focused on clarity and learning rather than decentralization or consensus.
        </p>
        <p className="page-description" style={{ marginTop: '1rem' }}>
          With a clean React frontend and a FastAPI backend, the platform provides an interactive experience where users can: 
          Create encrypted logs, Visualize the chain structure, Simulate tampering, Verify data integrity in real time.
        </p>
      </section>

      <section className="section-card">
        <h2 className="section-eyebrow">Contributors</h2>
        <ul className="plain-list">
          <li><strong>Mohamed Elfeky</strong> — Log Design & Core System (hashing, chaining, storage)</li>
          <li><strong>Mohamed Elhadad</strong> — Playfair Cipher & Frontend</li>
          <li><strong>Omar Abdelhamed</strong> — Playfair Cipher & Frontend</li>
          <li><strong>Zeyad Ashraf</strong> — Vigenère Cipher</li>
          <li><strong>Malak Ahmed</strong> — RSA Implementation</li>
          <li><strong>Menna Eldemerdash</strong> — RSA Implementation</li>
        </ul>
      </section>
    </div>
  );
}
