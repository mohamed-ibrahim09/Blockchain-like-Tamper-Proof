import type { HistoryEntry, EncryptionResult, EncryptionKey } from "./types"

// In-memory store for history (in production, this would be persisted)
let historyEntries: HistoryEntry[] = []
let encryptionKeys: EncryptionKey[] = []
let listeners: Set<() => void> = new Set()
let keyListeners: Set<() => void> = new Set()

export function getHistory(): HistoryEntry[] {
  return [...historyEntries]
}

export function addToHistory(
  input: string,
  result: EncryptionResult
): HistoryEntry {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    algorithm: result.algorithm,
    input: input.substring(0, 100) + (input.length > 100 ? "..." : ""),
    encrypted_data: result.encrypted_data,
    execution_time: result.execution_time,
    input_size: result.input_size,
    output_size: result.output_size,
    throughput: result.throughput,
    timestamp: new Date(),
  }
  
  historyEntries = [entry, ...historyEntries].slice(0, 50) // Keep last 50 entries
  notifyListeners()
  return entry
}

export function clearHistory(): void {
  historyEntries = []
  notifyListeners()
}

export function subscribeToHistory(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener())
}

export function exportHistory(): string {
  return JSON.stringify(historyEntries, null, 2)
}

// Encryption keys management
export function getEncryptionKeys(): EncryptionKey[] {
  return [...encryptionKeys]
}

export function addEncryptionKey(
  algorithm: string,
  encryptedData: string,
  keyData: {
    key?: string
    publicKey?: { e: number; n: number }
    privateKey?: { d: number; n: number }
    p?: number
    q?: number
    vigenereKey?: string
    playfairKey?: string
  }
): EncryptionKey {
  const entry: EncryptionKey = {
    id: crypto.randomUUID(),
    algorithm,
    key: keyData.key || "",
    publicKey: keyData.publicKey,
    privateKey: keyData.privateKey,
    p: keyData.p,
    q: keyData.q,
    vigenereKey: keyData.vigenereKey,
    playfairKey: keyData.playfairKey,
    timestamp: new Date(),
    encryptedDataPreview: encryptedData.substring(0, 50) + (encryptedData.length > 50 ? "..." : ""),
    encryptedData: encryptedData,
  }

  encryptionKeys = [entry, ...encryptionKeys].slice(0, 100)
  notifyKeyListeners()
  return entry
}

export function getKeyById(id: string): EncryptionKey | undefined {
  return encryptionKeys.find(k => k.id === id)
}

export function clearKeys(): void {
  encryptionKeys = []
  notifyKeyListeners()
}

export function subscribeToKeys(listener: () => void): () => void {
  keyListeners.add(listener)
  return () => keyListeners.delete(listener)
}

function notifyKeyListeners(): void {
  keyListeners.forEach((listener) => listener())
}
