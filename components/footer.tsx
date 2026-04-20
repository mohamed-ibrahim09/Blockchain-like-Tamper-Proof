"use client"

import { motion } from "framer-motion"
import { Shield, Github } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="border-t border-border bg-card/50 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-foreground">SecureLog</p>
              <p className="text-muted-foreground">
                Blockchain-powered tamper-proof logging
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-xs text-muted-foreground">
              Built with React, Python & Blockchain
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  )
}
