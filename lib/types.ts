export interface EncryptionResult {
  algorithm: string
  encrypted_data: string
  execution_time: number
  input_size: number
  output_size: number
  throughput: number
  public_key?: { e: number; n: number }
  fastest?: boolean
  most_efficient?: boolean
}

export interface RunAllResponse {
  results: EncryptionResult[]
}

export interface Block {
  index: number
  timestamp: string
  data: string
  previous_hash: string
  hash: string
}

export interface ChainResponse {
  chain: Block[]
  length: number
}

export interface VerifyResponse {
  valid: boolean
  message: string
  tampered_block?: number
  blocks_verified?: number
  execution_time: number
}

export interface AddBlockResponse {
  block: Block
  execution_time: number
}

export interface HistoryEntry {
  id: string
  algorithm: string
  input: string
  encrypted_data: string
  execution_time: number
  input_size: number
  output_size: number
  throughput: number
  timestamp: Date
}

export type Algorithm = "rsa" | "playfair" | "vigenere" | "hybrid"

export interface EncryptionKey {
  id: string
  algorithm: string
  key: string
  publicKey?: { e: number; n: number }
  privateKey?: { d: number; n: number }
  vigenereKey?: string
  playfairKey?: string
  timestamp: Date
  encryptedDataPreview: string
}

export interface DecryptionResult {
  algorithm: string
  decrypted_data: string
  execution_time: number
}

export interface TimerState {
  isRunning: boolean
  startTime: number | null
  endTime: number | null
  elapsedTime: number
}
