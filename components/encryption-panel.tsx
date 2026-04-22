"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Lock, Key, Shield, Zap, Info, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Algorithm } from "@/lib/types"
import type { EncryptOptions } from "@/lib/api"

export interface EncryptionOptions {
  key: string
  p: string
  q: string
}

interface EncryptionPanelProps {
  onEncrypt: (algorithm: Algorithm, options: EncryptOptions) => Promise<void>
  onRunAll: () => Promise<void>
  isLoading: boolean
  disabled: boolean
}

const algorithms: { id: Algorithm; name: string; icon: typeof Lock; description: string; isHybrid?: boolean }[] = [
  {
    id: "rsa",
    name: "RSA",
    icon: Key,
    description: "Asymmetric encryption using public/private key pairs. Enter primes P and Q, or leave blank for auto-generation.",
  },
  {
    id: "playfair",
    name: "Playfair",
    icon: Shield,
    description: "Classical cipher using a 5x5 matrix. Enter a key or use the default.",
  },
  {
    id: "vigenere",
    name: "Vigenere",
    icon: Lock,
    description: "Polyalphabetic cipher using a keyword. Enter a key or use the default.",
  },
  {
    id: "hybrid",
    name: "Hybrid Mode",
    icon: Layers,
    description: "Ultimate security! Combines RSA + Playfair + Vigenere. Enter key and optionally P/Q for RSA layer.",
    isHybrid: true,
  },
]

export function EncryptionPanel({
  onEncrypt,
  onRunAll,
  isLoading,
  disabled,
}: EncryptionPanelProps) {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>("rsa")
  const [key, setKey] = useState("")
  const [p, setP] = useState("")
  const [q, setQ] = useState("")

  const handleEncrypt = () => {
    const options: EncryptOptions = {}

    if (key.trim()) {
      options.key = key.trim()
    }

    // Add P and Q for RSA or Hybrid
    if (selectedAlgorithm === "rsa" || selectedAlgorithm === "hybrid") {
      if (p.trim() && q.trim()) {
        const pNum = parseInt(p.trim())
        const qNum = parseInt(q.trim())
        if (!isNaN(pNum) && !isNaN(qNum)) {
          options.p = pNum
          options.q = qNum
        }
      }
    }

    onEncrypt(selectedAlgorithm, options)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5 text-primary" />
            Encryption
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-3 block text-sm font-medium text-muted-foreground">
              Select Algorithm
            </Label>
            <RadioGroup
              value={selectedAlgorithm}
              onValueChange={(value) => setSelectedAlgorithm(value as Algorithm)}
              className="space-y-3"
            >
              <TooltipProvider>
                {algorithms.map((algo) => (
                  <motion.div
                    key={algo.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Label
                      htmlFor={algo.id}
                      className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-all ${
                        algo.isHybrid
                          ? selectedAlgorithm === algo.id
                            ? "border-red-500 bg-red-500/10 ring-2 ring-red-500/50"
                            : "border-red-500/50 bg-red-500/5 hover:border-red-500 hover:bg-red-500/10"
                          : selectedAlgorithm === algo.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value={algo.id} id={algo.id} className={algo.isHybrid ? "border-red-500 text-red-500" : ""} />
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${algo.isHybrid ? "bg-red-500/20" : "bg-muted"}`}>
                        <algo.icon className={`h-5 w-5 ${algo.isHybrid ? "text-red-500" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${algo.isHybrid ? "text-red-500" : "text-foreground"}`}>
                          {algo.name}
                          {algo.isHybrid && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                              BEST
                            </span>
                          )}
                        </p>
                        <p className={`text-xs line-clamp-1 ${algo.isHybrid ? "text-red-400/70" : "text-muted-foreground"}`}>
                          {algo.description.split(".")[0]}
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={(e) => e.preventDefault()}
                          >
                            <Info className={`h-4 w-4 ${algo.isHybrid ? "text-red-400" : "text-muted-foreground"}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[200px]">
                          <p className="text-sm">{algo.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                  </motion.div>
                ))}
              </TooltipProvider>
            </RadioGroup>
          </div>

          {/* Key Input Section */}
          <div className="space-y-4 border-t border-border pt-4">
            {/* Key Input for Playfair, Vigenere, Hybrid */}
            {(selectedAlgorithm === "playfair" || selectedAlgorithm === "vigenere" || selectedAlgorithm === "hybrid") && (
              <div className="space-y-2">
                <Label htmlFor="encryption-key" className="text-sm font-medium">
                  Encryption Key {selectedAlgorithm !== "hybrid" && "(optional)"}
                  {selectedAlgorithm === "hybrid" && <span className="text-red-400 ml-1">*</span>}
                </Label>
                <Input
                  id="encryption-key"
                  type="text"
                  placeholder={
                    selectedAlgorithm === "playfair"
                      ? "Enter key (default: BLOCKCHAIN)"
                      : selectedAlgorithm === "vigenere"
                      ? "Enter key (default: TAMPERPROOF)"
                      : "Enter key for Vigenere/Playfair layers"
                  }
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  {selectedAlgorithm === "playfair" && "Key must contain only letters. J is replaced with I."}
                  {selectedAlgorithm === "vigenere" && "Key is case-insensitive and repeated as needed."}
                  {selectedAlgorithm === "hybrid" && "This key is used for both Vigenere and Playfair layers."}
                </p>
              </div>
            )}

            {/* P and Q Input for RSA and Hybrid */}
            {(selectedAlgorithm === "rsa" || selectedAlgorithm === "hybrid") && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="prime-p" className="text-sm font-medium">
                    Prime P <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="prime-p"
                    type="number"
                    placeholder="e.g., 61"
                    value={p}
                    onChange={(e) => setP(e.target.value)}
                    className="font-mono"
                    min="2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prime-q" className="text-sm font-medium">
                    Prime Q <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="prime-q"
                    type="number"
                    placeholder="e.g., 53"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="font-mono"
                    min="2"
                  />
                </div>
              </div>
            )}

            {(selectedAlgorithm === "rsa" || selectedAlgorithm === "hybrid") && (
              <p className="text-xs text-muted-foreground">
                Leave P and Q blank for automatic prime generation, or enter two distinct prime numbers.
                Smaller primes (e.g., 61, 53) work best for text encryption.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleEncrypt}
              disabled={disabled || isLoading}
              className={`w-full gap-2 font-semibold transition-all ${
                selectedAlgorithm === "hybrid"
                  ? "bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/25"
                  : "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-500/25"
              }`}
            >
              {isLoading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Encrypting...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Encrypt with {algorithms.find((a) => a.id === selectedAlgorithm)?.name}
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={onRunAll}
              disabled={disabled || isLoading}
              className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-orange-500/25 transition-all"
            >
              {isLoading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Running All...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Run All Algorithms
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
