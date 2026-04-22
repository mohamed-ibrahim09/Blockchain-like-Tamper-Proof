export interface EncryptionResult {
  algorithm: string
  encrypted_data: string
  execution_time: number
  input_size: number
  output_size: number
  throughput: number
  public_key?: { e: number; n: number }
  private_key?: { d: number; n: number }
  p?: number                 // RSA prime factor p
  q?: number                 // RSA prime factor q
  fastest?: boolean
  most_efficient?: boolean
  key_used?: string          // for Playfair/Vigenere, returned by backend
  vigenere_key?: string      // for Hybrid mode
  playfair_key?: string      // for Hybrid mode
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
  key: string                          // Generic key (for Playfair/Vigenere)
  publicKey?: { e: number; n: number } // RSA public key
  privateKey?: { d: number; n: number } // RSA private key
  p?: number                           // RSA prime p
  q?: number                           // RSA prime q
  vigenereKey?: string
  playfairKey?: string
  timestamp: Date
  encryptedDataPreview: string
  encryptedData: string               // Full encrypted data reference
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
