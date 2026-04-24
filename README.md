# Blockchain-like Tamper-Proof Logging System

This project is a fullstack university demo that explains tamper-evident logging with a blockchain-like hash chain. Each block stores the original message, encrypted output, `previous_hash`, and a deterministic SHA-256 `current_hash`. If someone edits the stored ledger later, verification identifies the changed block and any downstream blocks affected by that break.

## Project Structure

```text
blockchain-tamper-proof-logging-system/
|-- backend/
|   |-- app/
|   |   |-- core/
|   |   |-- routers/
|   |   |-- schemas/
|   |   `-- services/
|   |-- .env.example
|   |-- main.py
|   `-- requirements.txt
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- lib/
|   |   `-- pages/
|   |-- .env.example
|   `-- package.json
|-- storage/
|   |-- log_chain.jsonl
|   `-- tamper_warnings.jsonl
|-- DESIGN.md
|-- IMPLEMENTATION_PLAN.md
|-- enhancement.py
|-- hyprid.py
|-- playfair.py
|-- rsa.py
`-- vignere.py
```

## Core Idea

This is not a distributed blockchain. It is a chained log demo for teaching:

- encryption at the block level
- deterministic hashing
- previous-hash linking
- tamper detection
- downstream chain impact after the first break

## Crypto Integration

The backend uses the repo-local crypto files as the canonical source:

- `playfair.py`
- `vignere.py`
- `rsa.py`
- `hyprid.py`
- `enhancement.py`

They are loaded through `backend/app/services/legacy_crypto_loader.py`, but the source directory now defaults to the project root. The runtime no longer depends on an external desktop crypto folder.

### Hybrid Mode

`hyprid.py` is the canonical hybrid implementation. The repaired sequence is:

- `Playfair -> Vigenere -> RSA`

`enhancement.py` is kept only as a compatibility wrapper around the repaired hybrid file.

## File-Backed Storage

This app no longer uses SQLite or SQLAlchemy for runtime storage.

Instead, it writes plain text JSONL files under `storage/`:

- `storage/log_chain.jsonl`
  Stores one log block per line.
- `storage/tamper_warnings.jsonl`
  Stores one warning event per line whenever verification finds a broken chain.

This keeps the demo simple and also makes local file edits easy to simulate. If someone edits `log_chain.jsonl` manually, the next verification run can identify which block changed and which later blocks are affected.

## How Hash Chaining Works

For each block, the backend computes:

- `previous_hash`
- `current_hash = SHA-256(encrypted_message + algorithm + key_metadata + previous_hash + created_at + hybrid_steps)`

Because the hash input is deterministic, any change to ciphertext, metadata, timestamps, or chain links produces a different recalculated hash during verification.

## Features

- Create encrypted log blocks with Playfair, Vigenere, RSA, or Hybrid mode
- Store the chain in a text-based JSONL ledger
- View the chain as connected timeline cards
- Decrypt individual blocks
- Verify the full chain and classify blocks as `valid`, `tampered`, or `affected`
- Simulate tampering safely from the UI
- Persist warning events when the chain is broken
- Compare algorithms with benchmark charts and short educational notes

## Backend Stack

- FastAPI
- Pydantic
- JSONL file storage

### Main API Endpoints

- `POST /api/logs`
- `GET /api/logs`
- `GET /api/logs/{id}`
- `POST /api/logs/{id}/decrypt`
- `POST /api/logs/{id}/tamper`
- `POST /api/chain/verify`
- `GET /api/chain/warnings`
- `GET /api/comparison/metrics`

## Frontend Stack

- React
- Vite
- TanStack Query
- Axios
- Framer Motion
- Recharts

## Running The App

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

You can also run from inside `backend/app` with:

```bash
uvicorn main:app --reload
```

The API starts on `http://localhost:8000`.

### 2. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

The frontend starts on `http://localhost:5173`.

## Environment Variables

### Backend

- `APP_NAME`
- `API_PREFIX`
- `FRONTEND_ORIGIN`
- `CRYPTO_SOURCE_DIR`
- `STORAGE_DIR`
- `LOG_CHAIN_FILE`
- `TAMPER_WARNING_FILE`
- `SEED_DEMO_DATA`

### Frontend

- `VITE_API_BASE_URL`

## Demo Flow

### Create A Block

1. Open `Create Log`.
2. Enter a message.
3. Choose Playfair, Vigenere, RSA, or Hybrid.
4. Provide a key for Playfair or Vigenere.
5. Submit to create the next linked block.

### Test Tampering

1. Open `Chain Viewer`.
2. Expand a block.
3. Use `Tamper this block`.
4. Open `Verification`.
5. The UI will show the changed block, the first broken block, and any downstream affected blocks.
6. A warning event is appended to `storage/tamper_warnings.jsonl`.

### Manual File Edit Test

1. Open `storage/log_chain.jsonl`.
2. Modify one block locally without recalculating its hash.
3. Reload the app or run verification.
4. The backend will detect the change and record a warning event with the changed block ids.

### Decrypt A Block

1. Open `Chain Viewer`.
2. Expand a block.
3. Use the decrypt panel.
4. For Playfair and Vigenere, you can provide an override key.
5. RSA and Hybrid use their repaired repo-local implementations.

## Verification Behavior

The backend verifies:

- whether each block still matches its own stored `current_hash`
- whether each block `previous_hash` matches the actual previous block hash
- whether the block was intentionally marked as tampered through the demo tool

Each block is classified as:

- `valid`
- `tampered`
- `affected`

`affected` means the block itself may be unchanged, but an earlier block already broke the chain.

## Frontend Design Direction

The frontend follows `DESIGN.md`:

- light monochrome palette
- spacious layout
- Inter for interface text
- JetBrains Mono for hashes
- reduced visual clutter
- one expanded block card at a time for easier demos

## Notes

- `IMPLEMENTATION_PLAN.md` stores the sprint-based execution plan used for the refactor.
- `backend/app/services/crypto_self_check.py` validates the repaired repo-local crypto files on startup.
- The warning ledger is intentionally persistent so tamper evidence remains visible across sessions.

## Educational Clarification

This is a blockchain-like integrity demo, not a cryptocurrency blockchain:

- no mining
- no peer-to-peer replication
- no consensus protocol
- no wallets
- no smart contracts

The goal is to explain how encryption plus chained hashes can make log tampering visible in a clean, demo-friendly way.
