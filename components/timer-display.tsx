"use client"

import { motion } from "framer-motion"
import { Timer, Activity } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface TimerDisplayProps {
  isRunning: boolean
  elapsedTime: number
}

export function TimerDisplay({ isRunning, elapsedTime }: TimerDisplayProps) {
  const formatTime = (ms: number) => {
    if (ms < 1000) {
      return `${ms.toFixed(2)}ms`
    }
    return `${(ms / 1000).toFixed(3)}s`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className={`glass-card overflow-hidden ${isRunning ? "glow-primary" : ""}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  isRunning ? "bg-primary/20" : "bg-muted"
                }`}
              >
                {isRunning ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Activity className="h-6 w-6 text-primary" />
                  </motion.div>
                ) : (
                  <Timer className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {isRunning ? "Processing..." : "Execution Time"}
                </p>
                <p className="font-mono text-2xl font-bold text-foreground">
                  {formatTime(elapsedTime)}
                </p>
              </div>
            </div>
            {isRunning && (
              <motion.div
                className="flex gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-2 w-2 rounded-full bg-primary"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
