"use client"

import { motion } from "framer-motion"
import { 
  Shield, 
  Lock, 
  Key, 
  Database, 
  Zap, 
  ArrowRight, 
  CheckCircle2,
  Sparkles,
  Layers,
  BarChart3,
  History,
  Fingerprint
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface IntroSectionProps {
  onNavigate: (section: string) => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
}

const features = [
  {
    icon: Lock,
    title: "Multi-Algorithm Encryption",
    description: "RSA, Playfair, Vigenere, and our exclusive Hybrid mode combining all three for maximum security.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Database,
    title: "Blockchain Logging",
    description: "Every encryption is automatically hashed and added to an immutable blockchain for tamper-proof records.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "Real-Time Performance",
    description: "High-precision timing with microsecond accuracy. Compare algorithm speeds and throughput instantly.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Key,
    title: "Secure Key Management",
    description: "Keys are stored securely for decryption. Access your encrypted data anytime with proper authentication.",
    color: "from-emerald-500 to-teal-500",
  },
]

const algorithms = [
  {
    name: "RSA",
    description: "Asymmetric encryption with public/private key pairs",
    strength: "2048-bit",
    color: "bg-blue-500/20 border-blue-500/30 text-blue-400",
  },
  {
    name: "Playfair",
    description: "Classical digraph substitution cipher",
    strength: "Matrix-based",
    color: "bg-purple-500/20 border-purple-500/30 text-purple-400",
  },
  {
    name: "Vigenere",
    description: "Polyalphabetic substitution cipher",
    strength: "Key-based",
    color: "bg-cyan-500/20 border-cyan-500/30 text-cyan-400",
  },
  {
    name: "Hybrid",
    description: "Combined RSA + Playfair + Vigenere",
    strength: "Maximum",
    color: "bg-red-500/20 border-red-500/30 text-red-400",
    badge: "BEST",
  },
]

const stats = [
  { value: "4", label: "Encryption Algorithms" },
  { value: "256", label: "Bit Security" },
  { value: "<50ms", label: "Avg. Encryption Time" },
  { value: "100%", label: "Tamper Detection" },
]

export function IntroSection({ onNavigate }: IntroSectionProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-16 pb-12"
    >
      {/* Hero Section */}
      <motion.section variants={itemVariants} className="relative text-center py-16">
        {/* Animated rings behind the logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <motion.div
            className="absolute w-[300px] h-[300px] rounded-full border border-primary/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ left: "-150px", top: "-150px" }}
          />
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full border border-primary/10"
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            style={{ left: "-200px", top: "-200px" }}
          />
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full border border-primary/5"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            style={{ left: "-250px", top: "-250px" }}
          />
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm border border-primary/20">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              Blockchain-Powered Security
            </span>
          </motion.div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-6 text-balance">
            <span className="text-foreground">Tamper-Proof</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Logging System
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8 leading-relaxed text-pretty">
            A next-generation security platform combining multiple encryption algorithms 
            with blockchain technology. Encrypt your sensitive data, track every operation, 
            and ensure complete integrity with our tamper-proof logging system.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => onNavigate("encrypt")}
              className="group bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/25 px-8"
            >
              Start Encrypting
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate("blockchain")}
              className="group border-border/50 hover:border-primary/50"
            >
              <Database className="mr-2 h-4 w-4" />
              View Blockchain
            </Button>
          </div>
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <motion.section variants={itemVariants}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              className="glass-card rounded-xl p-6 text-center border border-border/50"
            >
              <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section variants={itemVariants} className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Powerful Security Features
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to secure, encrypt, and verify your sensitive data
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group"
            >
              <Card className="glass-card border-border/50 h-full overflow-hidden hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${feature.color} bg-opacity-20`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Algorithms Section */}
      <motion.section variants={itemVariants} className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Encryption Algorithms
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose from multiple industry-standard encryption methods or use our Hybrid mode for maximum security
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {algorithms.map((algo, index) => (
            <motion.div
              key={algo.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.05 }}
              className={`relative rounded-xl border p-6 ${algo.color} backdrop-blur-sm cursor-pointer transition-all hover:shadow-lg`}
              onClick={() => onNavigate("encrypt")}
            >
              {algo.badge && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  {algo.badge}
                </span>
              )}
              <h3 className="text-xl font-bold mb-2">{algo.name}</h3>
              <p className="text-sm opacity-80 mb-3">{algo.description}</p>
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4" />
                <span className="text-xs font-medium">{algo.strength}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section variants={itemVariants} className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to secure your data with blockchain-verified encryption
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Upload Your Data",
              description: "Drag and drop your log files or paste text directly. Supports .txt and .log files.",
              icon: Layers,
            },
            {
              step: "02",
              title: "Choose Algorithm",
              description: "Select from RSA, Playfair, Vigenere, or Hybrid mode. Compare all algorithms at once.",
              icon: Lock,
            },
            {
              step: "03",
              title: "Secure & Verify",
              description: "Data is encrypted and automatically added to the blockchain for tamper-proof logging.",
              icon: CheckCircle2,
            },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 * index }}
              className="relative"
            >
              <div className="glass-card rounded-xl p-6 border border-border/50 h-full">
                <div className="text-6xl font-bold text-primary/10 absolute top-4 right-4">
                  {item.step}
                </div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">
                  {item.description}
                </p>
              </div>
              {index < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="h-8 w-8 text-primary/30" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section variants={itemVariants}>
        <div className="glass-card rounded-2xl p-8 md:p-12 border border-border/50 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
          
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Secure Your Data?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Start encrypting your sensitive logs today with our powerful multi-algorithm 
              encryption system backed by blockchain technology.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => onNavigate("encrypt")}
                className="group bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg px-8"
              >
                <Lock className="mr-2 h-4 w-4" />
                Start Encrypting
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => onNavigate("statistics")}
                className="border-border/50"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                View Statistics
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => onNavigate("history")}
                className="border-border/50"
              >
                <History className="mr-2 h-4 w-4" />
                View History
              </Button>
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  )
}
