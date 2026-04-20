"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Link2,
  Shield,
  ShieldCheck,
  ShieldX,
  Plus,
  RefreshCw,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { getChain, verifyChain, addBlock } from "@/lib/api"
import type { Block, VerifyResponse } from "@/lib/types"

interface BlockchainViewerProps {
  latestEncryption?: string
}

export function BlockchainViewer({ latestEncryption }: BlockchainViewerProps) {
  const [chain, setChain] = useState<Block[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerifyResponse | null>(
    null
  )

  useEffect(() => {
    loadChain()
  }, [])

  const loadChain = async () => {
    setIsLoading(true)
    try {
      const response = await getChain()
      setChain(response.chain)
    } catch (error) {
      console.error("Failed to load chain:", error)
    }
    setIsLoading(false)
  }

  const handleVerify = async () => {
    setIsVerifying(true)
    setVerificationResult(null)
    try {
      const result = await verifyChain()
      setVerificationResult(result)
    } catch (error) {
      console.error("Verification failed:", error)
    }
    setIsVerifying(false)
  }

  const handleAddBlock = async () => {
    if (!latestEncryption) return
    setIsAdding(true)
    try {
      await addBlock(latestEncryption)
      await loadChain()
    } catch (error) {
      console.error("Failed to add block:", error)
    }
    setIsAdding(false)
  }

  const truncateHash = (hash: string) => {
    if (hash.length <= 16) return hash
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link2 className="h-5 w-5 text-primary" />
              Blockchain
              <Badge variant="secondary" className="font-mono">
                {chain.length} blocks
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddBlock}
                disabled={!latestEncryption || isAdding}
                className="gap-2"
              >
                {isAdding ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add Block
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerify}
                disabled={isVerifying}
                className="gap-2"
              >
                {isVerifying ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                Verify Chain
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={loadChain}
                disabled={isLoading}
                className="h-9 w-9"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Verification Result */}
          <AnimatePresence>
            {verificationResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div
                  className={`flex items-center gap-3 rounded-lg p-4 ${
                    verificationResult.valid
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {verificationResult.valid ? (
                    <ShieldCheck className="h-6 w-6" />
                  ) : (
                    <ShieldX className="h-6 w-6" />
                  )}
                  <div>
                    <p className="font-medium">{verificationResult.message}</p>
                    <p className="text-sm opacity-80">
                      {verificationResult.valid
                        ? `${verificationResult.blocks_verified} blocks verified in ${verificationResult.execution_time.toFixed(2)}ms`
                        : `Tampered block: ${verificationResult.tampered_block}`}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chain Visualization */}
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <ScrollArea className="w-full pb-4">
              <div className="flex items-center gap-2 py-4">
                {chain.map((block, index) => (
                  <motion.div
                    key={block.index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center"
                  >
                    <Card
                      className={`min-w-[220px] shrink-0 ${
                        index === 0 ? "border-primary/50" : "border-border"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <Badge
                            variant={index === 0 ? "default" : "secondary"}
                            className="font-mono"
                          >
                            Block {block.index}
                          </Badge>
                          {index === 0 && (
                            <Badge variant="outline" className="text-xs">
                              Genesis
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Data</p>
                            <p className="font-mono text-foreground truncate">
                              {block.data.length > 30
                                ? `${block.data.slice(0, 30)}...`
                                : block.data}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Hash</p>
                            <p className="font-mono text-foreground">
                              {truncateHash(block.hash)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Previous</p>
                            <p className="font-mono text-foreground">
                              {truncateHash(block.previous_hash)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    {index < chain.length - 1 && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 + 0.2 }}
                        className="flex items-center px-2"
                      >
                        <div className="h-0.5 w-4 bg-primary/50" />
                        <ChevronRight className="h-4 w-4 text-primary/50" />
                        <div className="h-0.5 w-4 bg-primary/50" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
