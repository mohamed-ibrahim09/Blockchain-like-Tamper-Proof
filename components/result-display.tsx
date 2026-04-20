"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Copy, Download, Check, Award, Zap } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { EncryptionResult } from "@/lib/types"

interface ResultDisplayProps {
  results: EncryptionResult[]
  isVisible: boolean
}

export function ResultDisplay({ results, isVisible }: ResultDisplayProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const downloadResult = (result: EncryptionResult) => {
    const content = JSON.stringify(result, null, 2)
    const blob = new Blob([content], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${result.algorithm.toLowerCase()}-encryption-result.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isVisible || results.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        Results
        {results.length > 1 && (
          <Badge variant="secondary" className="font-normal">
            {results.length} algorithms
          </Badge>
        )}
      </h3>

      <AnimatePresence mode="popLayout">
        {results.map((result, index) => (
          <motion.div
            key={`${result.algorithm}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="glass-card overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <span>{result.algorithm}</span>
                    {result.fastest && (
                      <Badge className="gap-1 bg-accent/20 text-accent-foreground">
                        <Zap className="h-3 w-3" />
                        Fastest
                      </Badge>
                    )}
                    {result.most_efficient && (
                      <Badge className="gap-1 bg-success/20 text-success">
                        <Award className="h-3 w-3" />
                        Most Efficient
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        copyToClipboard(result.encrypted_data, result.algorithm)
                      }
                    >
                      {copiedId === result.algorithm ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => downloadResult(result)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Encrypted Output
                  </p>
                  <ScrollArea className="h-[80px] rounded-md border border-border bg-background/50 p-3">
                    <code className="font-mono text-xs text-foreground break-all">
                      {result.encrypted_data}
                    </code>
                  </ScrollArea>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-mono text-sm font-medium text-foreground">
                      {result.execution_time.toFixed(2)}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Input Size</p>
                    <p className="font-mono text-sm font-medium text-foreground">
                      {result.input_size} chars
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Output Size</p>
                    <p className="font-mono text-sm font-medium text-foreground">
                      {result.output_size} chars
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Throughput</p>
                    <p className="font-mono text-sm font-medium text-foreground">
                      {result.throughput.toFixed(1)} c/ms
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
