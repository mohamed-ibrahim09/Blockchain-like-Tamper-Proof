"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Unlock, Key, Copy, Check, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { decryptData } from "@/lib/api"
import { getEncryptionKeys, subscribeToKeys, clearKeys } from "@/lib/store"
import type { EncryptionKey, DecryptionResult } from "@/lib/types"

export function DecryptSection() {
  const [encryptedText, setEncryptedText] = useState("")
  const [decryptionKey, setDecryptionKey] = useState("")
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<DecryptionResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [storedKeys, setStoredKeys] = useState<EncryptionKey[]>([])
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null)

  useEffect(() => {
    setStoredKeys(getEncryptionKeys())
    const unsubscribe = subscribeToKeys(() => {
      setStoredKeys(getEncryptionKeys())
    })
    return () => unsubscribe()
  }, [])

  const handleDecrypt = async () => {
    if (!encryptedText.trim() || !decryptionKey.trim() || !selectedAlgorithm) return

    setIsLoading(true)
    try {
      const decrypted = await decryptData(encryptedText, selectedAlgorithm, decryptionKey)
      setResult(decrypted)
    } catch (error) {
      console.error("Decryption error:", error)
    }
    setIsLoading(false)
  }

  const handleCopy = async () => {
    if (result) {
      await navigator.clipboard.writeText(result.decrypted_data)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleUseStoredKey = (key: EncryptionKey) => {
    setSelectedKeyId(key.id)
    setSelectedAlgorithm(key.algorithm.toLowerCase())
    if (key.vigenereKey) setDecryptionKey(key.vigenereKey)
    else if (key.playfairKey) setDecryptionKey(key.playfairKey)
    else if (key.key) setDecryptionKey(key.key)
  }

  const algorithmColors: Record<string, string> = {
    rsa: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    playfair: "bg-green-500/20 text-green-400 border-green-500/30",
    vigenere: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    hybrid: "bg-red-500/20 text-red-400 border-red-500/30",
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Decryption Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Unlock className="h-5 w-5 text-cyan-400" />
                Decrypt Data
              </CardTitle>
              <CardDescription>
                Enter your encrypted data and the decryption key
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="encrypted-text">Encrypted Data</Label>
                <Textarea
                  id="encrypted-text"
                  placeholder="Paste your encrypted data here..."
                  value={encryptedText}
                  onChange={(e) => setEncryptedText(e.target.value)}
                  className="min-h-[120px] font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="algorithm">Algorithm</Label>
                <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select algorithm used" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rsa">RSA</SelectItem>
                    <SelectItem value="playfair">Playfair</SelectItem>
                    <SelectItem value="vigenere">Vigenere</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="key">Decryption Key</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="key"
                    type="text"
                    placeholder="Enter your decryption key..."
                    value={decryptionKey}
                    onChange={(e) => setDecryptionKey(e.target.value)}
                    className="pl-10 font-mono"
                  />
                </div>
              </div>

              <Button
                onClick={handleDecrypt}
                disabled={!encryptedText.trim() || !decryptionKey.trim() || !selectedAlgorithm || isLoading}
                className="w-full gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/25"
              >
                {isLoading ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Decrypting...
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4" />
                    Decrypt
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stored Keys */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="glass-card h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-amber-400" />
                    Saved Keys
                  </CardTitle>
                  <CardDescription>
                    Keys from your encryption sessions
                  </CardDescription>
                </div>
                {storedKeys.length > 0 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Clear all keys?</DialogTitle>
                        <DialogDescription>
                          This will permanently delete all stored encryption keys. This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline">Cancel</Button>
                        <Button variant="destructive" onClick={clearKeys}>
                          Clear All
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {storedKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    No keys saved yet
                  </p>
                  <p className="text-muted-foreground/70 text-xs mt-1">
                    Keys will appear here after encrypting data
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {storedKeys.map((key) => (
                    <motion.div
                      key={key.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedKeyId === key.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleUseStoredKey(key)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={algorithmColors[key.algorithm.toLowerCase()] || "bg-muted"}>
                          {key.algorithm}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(key.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground truncate">
                        {key.encryptedDataPreview}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Key: <span className="font-mono text-foreground">{key.key || "Complex Key"}</span>
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Decryption Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
          >
            <Card className="glass-card border-cyan-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-cyan-400">
                    <Check className="h-5 w-5" />
                    Decryption Successful
                  </CardTitle>
                  <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">
                    {result.execution_time.toFixed(2)}ms
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="rounded-lg bg-background/50 border p-4 font-mono text-sm break-all max-h-[200px] overflow-y-auto">
                    {result.decrypted_data}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
