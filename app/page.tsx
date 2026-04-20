"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Toaster, toast } from "sonner"
import { Navbar } from "@/components/navbar"
import { IntroSection } from "@/components/intro-section"
import { UploadSection } from "@/components/upload-section"
import { EncryptionPanel } from "@/components/encryption-panel"
import { TimerDisplay } from "@/components/timer-display"
import { ResultDisplay } from "@/components/result-display"
import { BlockchainViewer } from "@/components/blockchain-viewer"
import { StatsPanel } from "@/components/stats-panel"
import { ComparisonChart } from "@/components/comparison-chart"
import { HistoryTable } from "@/components/history-table"
import { DecryptSection } from "@/components/decrypt-section"
import { AnimatedBackground } from "@/components/animated-background"
import { Footer } from "@/components/footer"
import { useTimer } from "@/hooks/use-timer"
import { encryptData, runAllAlgorithms, addBlock } from "@/lib/api"
import { addToHistory, addEncryptionKey } from "@/lib/store"
import type { EncryptionResult, Algorithm } from "@/lib/types"

export default function Home() {
  const [activeSection, setActiveSection] = useState("intro")
  const [inputText, setInputText] = useState("")
  const [results, setResults] = useState<EncryptionResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [latestEncryption, setLatestEncryption] = useState<string>("")
  const timer = useTimer()

  // Auto-add to blockchain after encryption
  const autoAddToBlockchain = useCallback(async (encryptedData: string, algorithm: string) => {
    try {
      const blockData = `[${algorithm}] ${encryptedData.substring(0, 100)}${encryptedData.length > 100 ? "..." : ""}`
      await addBlock(blockData)
      toast.success("Block added to chain automatically", {
        description: `Encrypted ${algorithm} data secured in blockchain`,
      })
    } catch (error) {
      console.error("Failed to add block:", error)
    }
  }, [])

  const handleEncrypt = useCallback(
    async (algorithm: Algorithm) => {
      if (!inputText.trim()) {
        toast.error("Please enter some text to encrypt")
        return
      }

      setIsLoading(true)
      timer.start()

      try {
        const result = await encryptData(inputText, algorithm) as EncryptionResult & { keyData?: { key?: string; publicKey?: { e: number; n: number }; privateKey?: { d: number; n: number }; vigenereKey?: string; playfairKey?: string } }
        timer.stop()
        setResults([result])
        setLatestEncryption(result.encrypted_data)
        addToHistory(inputText, result)
        
        // Store the encryption key for decryption
        if (result.keyData) {
          addEncryptionKey(algorithm, result.encrypted_data, result.keyData)
        }
        
        // Auto-add to blockchain
        await autoAddToBlockchain(result.encrypted_data, result.algorithm)
        
        toast.success(`Encrypted with ${result.algorithm} in ${result.execution_time.toFixed(2)}ms`)
      } catch (error) {
        timer.stop()
        toast.error("Encryption failed. Please try again.")
        console.error("Encryption error:", error)
      }

      setIsLoading(false)
    },
    [inputText, timer, autoAddToBlockchain]
  )

  const handleRunAll = useCallback(async () => {
    if (!inputText.trim()) {
      toast.error("Please enter some text to encrypt")
      return
    }

    setIsLoading(true)
    timer.start()

    try {
      const response = await runAllAlgorithms(inputText)
      timer.stop()
      setResults(response.results)
      
      // Store the first result for blockchain
      if (response.results.length > 0) {
        setLatestEncryption(response.results[0].encrypted_data)
        
        // Auto-add all results to blockchain
        for (const result of response.results) {
          await autoAddToBlockchain(result.encrypted_data, result.algorithm)
        }
      }
      
      // Add all results to history and store keys
      response.results.forEach((result) => {
        addToHistory(inputText, result)
        const resultWithKey = result as EncryptionResult & { keyData?: { key?: string; publicKey?: { e: number; n: number }; privateKey?: { d: number; n: number }; vigenereKey?: string; playfairKey?: string } }
        if (resultWithKey.keyData) {
          addEncryptionKey(result.algorithm.toLowerCase(), result.encrypted_data, resultWithKey.keyData)
        }
      })

      const fastest = response.results.find((r) => r.fastest)
      toast.success(
        `All algorithms completed! Fastest: ${fastest?.algorithm} (${fastest?.execution_time.toFixed(2)}ms)`
      )
    } catch (error) {
      timer.stop()
      toast.error("Run all failed. Please try again.")
      console.error("Run all error:", error)
    }

    setIsLoading(false)
  }, [inputText, timer, autoAddToBlockchain])

  const renderSection = () => {
    switch (activeSection) {
      case "intro":
        return (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <IntroSection onNavigate={setActiveSection} />
          </motion.div>
        )

      case "encrypt":
        return (
          <motion.div
            key="encrypt"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <UploadSection onTextChange={setInputText} text={inputText} />
              <div className="space-y-6">
                <EncryptionPanel
                  onEncrypt={handleEncrypt}
                  onRunAll={handleRunAll}
                  isLoading={isLoading}
                  disabled={!inputText.trim()}
                />
                <TimerDisplay
                  isRunning={timer.isRunning}
                  elapsedTime={timer.elapsedTime}
                />
              </div>
            </div>
            <ResultDisplay results={results} isVisible={results.length > 0} />
          </motion.div>
        )

      case "decrypt":
        return (
          <motion.div
            key="decrypt"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <DecryptSection />
          </motion.div>
        )

      case "blockchain":
        return (
          <motion.div
            key="blockchain"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <BlockchainViewer latestEncryption={latestEncryption} />
          </motion.div>
        )

      case "statistics":
        return (
          <motion.div
            key="statistics"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <StatsPanel results={results} />
            <ComparisonChart results={results} />
          </motion.div>
        )

      case "history":
        return (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <HistoryTable />
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen flex-col relative">
      <AnimatedBackground />
      
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          },
        }}
      />
      
      <Navbar activeSection={activeSection} onSectionChange={setActiveSection} />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">{renderSection()}</AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  )
}
