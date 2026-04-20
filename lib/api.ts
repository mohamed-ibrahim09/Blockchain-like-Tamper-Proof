import type {
  EncryptionResult,
  RunAllResponse,
  ChainResponse,
  VerifyResponse,
  AddBlockResponse,
  DecryptionResult,
} from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Flag to use mock data when backend is not available
const USE_MOCK = true

// Storage for encryption keys (for decryption)
interface StoredKey {
  algorithm: string
  key: string
  publicKey?: { e: number; n: number }
  privateKey?: { d: number; n: number }
  vigenereKey?: string
  playfairKey?: string
}

const encryptionKeyStore: Map<string, StoredKey> = new Map()

// Mock data generators
function generateMockEncryption(text: string, algorithm: string): EncryptionResult & { keyData?: StoredKey } {
  const startTime = performance.now()
  
  // Simulate encryption delay
  let delay = 2 + Math.random() * 5
  if (algorithm === "rsa") delay = 20 + Math.random() * 15
  if (algorithm === "hybrid") delay = 35 + Math.random() * 20
  
  let encrypted_data: string
  let keyData: StoredKey = { algorithm, key: "" }
  
  switch (algorithm.toLowerCase()) {
    case "rsa":
      encrypted_data = text
        .split("")
        .map((c) => Math.floor(Math.random() * 10000000))
        .join(",")
      keyData = {
        algorithm: "rsa",
        key: "RSA-2048",
        publicKey: { e: 65537, n: Math.floor(Math.random() * 1000000000) },
        privateKey: { d: Math.floor(Math.random() * 1000000000), n: Math.floor(Math.random() * 1000000000) },
      }
      break
    case "playfair":
      const playfairKey = "SECURITY"
      encrypted_data = text
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .split("")
        .map((c) => String.fromCharCode(((c.charCodeAt(0) - 65 + 5) % 26) + 65))
        .join("")
      keyData = { algorithm: "playfair", key: playfairKey, playfairKey }
      break
    case "vigenere":
      const vigenereKey = "TAMPERPROOF"
      encrypted_data = text
        .split("")
        .map((c, i) => {
          if (c.match(/[a-zA-Z]/)) {
            const base = c.charCodeAt(0) < 97 ? 65 : 97
            const shift = vigenereKey.charCodeAt(i % vigenereKey.length) - 65
            return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26) + base)
          }
          return c
        })
        .join("")
      keyData = { algorithm: "vigenere", key: vigenereKey, vigenereKey }
      break
    case "hybrid":
      // Step 1: Vigenere first
      const hybridVigKey = "HYBRID"
      let step1 = text
        .split("")
        .map((c, i) => {
          if (c.match(/[a-zA-Z]/)) {
            const base = c.charCodeAt(0) < 97 ? 65 : 97
            const shift = hybridVigKey.charCodeAt(i % hybridVigKey.length) - 65
            return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26) + base)
          }
          return c
        })
        .join("")
      
      // Step 2: Playfair
      const hybridPlayKey = "CIPHER"
      let step2 = step1
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .split("")
        .map((c) => String.fromCharCode(((c.charCodeAt(0) - 65 + 3) % 26) + 65))
        .join("")
      
      // Step 3: RSA-like numeric encoding
      encrypted_data = step2
        .split("")
        .map((c) => Math.floor(Math.random() * 10000000))
        .join("-")
      
      keyData = {
        algorithm: "hybrid",
        key: "HYBRID-V1",
        vigenereKey: hybridVigKey,
        playfairKey: hybridPlayKey,
        publicKey: { e: 65537, n: Math.floor(Math.random() * 1000000000) },
        privateKey: { d: Math.floor(Math.random() * 1000000000), n: Math.floor(Math.random() * 1000000000) },
      }
      break
    default:
      encrypted_data = text
  }
  
  // Store key for later decryption
  encryptionKeyStore.set(encrypted_data.substring(0, 50), keyData)
  
  const endTime = performance.now()
  const execution_time = delay + (endTime - startTime)
  
  return {
    algorithm: algorithm.charAt(0).toUpperCase() + algorithm.slice(1),
    encrypted_data,
    execution_time: Math.round(execution_time * 100) / 100,
    input_size: text.length,
    output_size: encrypted_data.length,
    throughput: Math.round((text.length / execution_time) * 1000) / 10,
    ...(algorithm === "rsa" && { public_key: keyData.publicKey }),
    ...(algorithm === "hybrid" && { public_key: keyData.publicKey }),
    keyData,
  }
}

// In-memory mock blockchain
let mockChain = [
  {
    index: 0,
    timestamp: new Date().toISOString(),
    data: "Genesis Block",
    previous_hash: "0",
    hash: "abc123def456",
  },
]

function generateHash(): string {
  return [...Array(64)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("")
}

export async function encryptData(
  text: string,
  algorithm: string
): Promise<EncryptionResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 100 + Math.random() * 200))
    return generateMockEncryption(text, algorithm)
  }
  
  const response = await fetch(`${API_BASE_URL}/encrypt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, algorithm }),
  })
  
  if (!response.ok) {
    throw new Error("Encryption failed")
  }
  
  return response.json()
}

export async function runAllAlgorithms(text: string): Promise<RunAllResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400))
    
    const results = ["rsa", "playfair", "vigenere"].map((algo) =>
      generateMockEncryption(text, algo)
    )
    
    // Mark fastest
    const sorted = [...results].sort((a, b) => a.execution_time - b.execution_time)
    sorted[0].fastest = true
    
    // Mark most efficient
    const mostEfficient = results.reduce((a, b) =>
      a.throughput > b.throughput ? a : b
    )
    mostEfficient.most_efficient = true
    
    return { results }
  }
  
  const response = await fetch(`${API_BASE_URL}/run-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })
  
  if (!response.ok) {
    throw new Error("Run all failed")
  }
  
  return response.json()
}

export async function getChain(): Promise<ChainResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 100))
    return { chain: mockChain, length: mockChain.length }
  }
  
  const response = await fetch(`${API_BASE_URL}/chain`)
  
  if (!response.ok) {
    throw new Error("Failed to get chain")
  }
  
  return response.json()
}

export async function addBlock(data: string): Promise<AddBlockResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 150))
    
    const newBlock = {
      index: mockChain.length,
      timestamp: new Date().toISOString(),
      data,
      previous_hash: mockChain[mockChain.length - 1].hash,
      hash: generateHash(),
    }
    
    mockChain.push(newBlock)
    
    return { block: newBlock, execution_time: Math.random() * 5 }
  }
  
  const response = await fetch(`${API_BASE_URL}/add-block`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  })
  
  if (!response.ok) {
    throw new Error("Failed to add block")
  }
  
  return response.json()
}

export async function verifyChain(): Promise<VerifyResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200))
    
    return {
      valid: true,
      message: "Blockchain integrity verified",
      blocks_verified: mockChain.length,
      execution_time: Math.random() * 3,
    }
  }
  
  const response = await fetch(`${API_BASE_URL}/verify`, {
    method: "POST",
  })
  
  if (!response.ok) {
    throw new Error("Verification failed")
  }
  
  return response.json()
}

// Reset mock chain (for testing)
export function resetMockChain() {
  mockChain = [
    {
      index: 0,
      timestamp: new Date().toISOString(),
      data: "Genesis Block",
      previous_hash: "0",
      hash: generateHash(),
    },
  ]
}

// Decryption function
export async function decryptData(
  encryptedData: string,
  algorithm: string,
  key: string
): Promise<DecryptionResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 100 + Math.random() * 200))
    
    const startTime = performance.now()
    let decrypted_data: string
    
    // Simulate decryption based on algorithm
    switch (algorithm.toLowerCase()) {
      case "rsa":
        // Reverse the numeric encoding
        decrypted_data = encryptedData
          .split(",")
          .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
          .join("")
        break
      case "playfair":
        // Reverse playfair shift
        decrypted_data = encryptedData
          .split("")
          .map((c) => {
            if (c.match(/[A-Z]/)) {
              return String.fromCharCode(((c.charCodeAt(0) - 65 - 5 + 26) % 26) + 65)
            }
            return c
          })
          .join("")
        break
      case "vigenere":
        // Reverse vigenere cipher
        decrypted_data = encryptedData
          .split("")
          .map((c, i) => {
            if (c.match(/[a-zA-Z]/)) {
              const base = c.charCodeAt(0) < 97 ? 65 : 97
              const shift = key.toUpperCase().charCodeAt(i % key.length) - 65
              return String.fromCharCode(((c.charCodeAt(0) - base - shift + 26) % 26) + base)
            }
            return c
          })
          .join("")
        break
      case "hybrid":
        // Simplified hybrid decryption simulation
        decrypted_data = encryptedData
          .split("-")
          .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
          .join("")
        break
      default:
        decrypted_data = encryptedData
    }
    
    const endTime = performance.now()
    
    return {
      algorithm: algorithm.charAt(0).toUpperCase() + algorithm.slice(1),
      decrypted_data,
      execution_time: Math.round((endTime - startTime) * 100) / 100,
    }
  }
  
  const response = await fetch(`${API_BASE_URL}/decrypt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ encrypted_data: encryptedData, algorithm, key }),
  })
  
  if (!response.ok) {
    throw new Error("Decryption failed")
  }
  
  return response.json()
}
