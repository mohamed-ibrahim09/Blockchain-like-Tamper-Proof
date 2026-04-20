"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, X, Type } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UploadSectionProps {
  onTextChange: (text: string) => void
  text: string
}

export function UploadSection({ onTextChange, text }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file && (file.name.endsWith(".txt") || file.name.endsWith(".log"))) {
        readFile(file)
      }
    },
    []
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        readFile(file)
      }
    },
    []
  )

  const readFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      onTextChange(content)
      setFileName(file.name)
    }
    reader.readAsText(file)
  }

  const clearFile = () => {
    setFileName(null)
    onTextChange("")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5 text-primary" />
            Input Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="gap-2">
                <FileText className="h-4 w-4" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-2">
                <Type className="h-4 w-4" />
                Manual Input
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-0">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200 ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <AnimatePresence mode="wait">
                  {fileName ? (
                    <motion.div
                      key="file"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex flex-col items-center gap-3 p-6"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                        <FileText className="h-8 w-8 text-success" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-foreground">{fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          {text.length.toLocaleString()} characters
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFile}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-4 p-6"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-foreground">
                          Drop your log file here
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Supports .txt and .log files
                        </p>
                      </div>
                      <label htmlFor="file-upload">
                        <Button variant="outline" asChild className="cursor-pointer">
                          <span>Browse Files</span>
                        </Button>
                        <input
                          id="file-upload"
                          type="file"
                          accept=".txt,.log"
                          onChange={handleFileSelect}
                          className="sr-only"
                        />
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="mt-0">
              <Textarea
                placeholder="Enter your log data here..."
                value={text}
                onChange={(e) => {
                  onTextChange(e.target.value)
                  setFileName(null)
                }}
                className="min-h-[200px] resize-none bg-background/50 font-mono text-sm"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{text.length.toLocaleString()} characters</span>
                <span>
                  {(new TextEncoder().encode(text).length / 1024).toFixed(2)} KB
                </span>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}
