"use client"

import { motion } from "framer-motion"
import { BarChart3, Clock, Gauge, Scale, Award, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { EncryptionResult } from "@/lib/types"

interface StatsPanelProps {
  results: EncryptionResult[]
}

export function StatsPanel({ results }: StatsPanelProps) {
  if (results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="glass-card">
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">No Statistics Yet</p>
              <p className="text-sm text-muted-foreground">
                Run an encryption to see performance statistics
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const fastest = results.find((r) => r.fastest) || results[0]
  const mostEfficient = results.find((r) => r.most_efficient) || results[0]
  const avgTime = results.reduce((a, b) => a + b.execution_time, 0) / results.length
  const totalThroughput = results.reduce((a, b) => a + b.throughput, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Performance Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-lg bg-primary/10 p-4"
            >
              <div className="flex items-center gap-2 text-primary">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-medium">Fastest</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">
                {fastest.algorithm}
              </p>
              <p className="font-mono text-sm text-muted-foreground">
                {fastest.execution_time.toFixed(2)}ms
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="rounded-lg bg-success/10 p-4"
            >
              <div className="flex items-center gap-2 text-success">
                <Award className="h-4 w-4" />
                <span className="text-xs font-medium">Most Efficient</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">
                {mostEfficient.algorithm}
              </p>
              <p className="font-mono text-sm text-muted-foreground">
                {mostEfficient.throughput.toFixed(1)} c/ms
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-lg bg-muted p-4"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">Avg Time</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">
                {avgTime.toFixed(2)}ms
              </p>
              <p className="text-sm text-muted-foreground">
                {results.length} algorithms
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="rounded-lg bg-muted p-4"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Gauge className="h-4 w-4" />
                <span className="text-xs font-medium">Total Throughput</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">
                {totalThroughput.toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">chars/ms</p>
            </motion.div>
          </div>

          {/* Detailed Stats Table */}
          <div className="rounded-lg border border-border">
            <div className="grid grid-cols-6 gap-4 border-b border-border bg-muted/50 p-3 text-xs font-medium text-muted-foreground">
              <div>Algorithm</div>
              <div>Time (ms)</div>
              <div>Input</div>
              <div>Output</div>
              <div>Throughput</div>
              <div>Status</div>
            </div>
            {results.map((result, index) => (
              <motion.div
                key={result.algorithm}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className={`grid grid-cols-6 gap-4 p-3 text-sm ${
                  index < results.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="font-medium text-foreground">{result.algorithm}</div>
                <div className="font-mono text-foreground">
                  {result.execution_time.toFixed(2)}
                </div>
                <div className="font-mono text-muted-foreground">
                  {result.input_size}
                </div>
                <div className="font-mono text-muted-foreground">
                  {result.output_size}
                </div>
                <div className="font-mono text-muted-foreground">
                  {result.throughput.toFixed(1)}
                </div>
                <div className="flex items-center gap-1">
                  {result.fastest && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Zap className="h-3 w-3" />
                    </Badge>
                  )}
                  {result.most_efficient && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Award className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
