"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  color: string
  pulseOffset: number
}

interface DataStream {
  x: number
  y: number
  length: number
  speed: number
  chars: string[]
  opacity: number
}

const matrixChars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン"

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const dataStreamsRef = useRef<DataStream[]>([])
  const animationRef = useRef<number>()
  const mouseRef = useRef({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initializeElements()
    }

    const initializeElements = () => {
      // Initialize particles
      const colors = [
        "rgba(99, 102, 241, 0.7)",   // Indigo
        "rgba(139, 92, 246, 0.7)",   // Violet
        "rgba(236, 72, 153, 0.6)",   // Pink
        "rgba(34, 211, 238, 0.6)",   // Cyan
        "rgba(16, 185, 129, 0.6)",   // Emerald
        "rgba(245, 158, 11, 0.5)",   // Amber
      ]

      const particleCount = Math.min(60, Math.floor((canvas.width * canvas.height) / 20000))
      
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 3 + 1.5,
        opacity: Math.random() * 0.6 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulseOffset: Math.random() * Math.PI * 2,
      }))

      // Initialize data streams (matrix-style falling characters)
      const streamCount = Math.floor(canvas.width / 50)
      dataStreamsRef.current = Array.from({ length: streamCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        length: Math.floor(Math.random() * 15) + 8,
        speed: Math.random() * 2 + 1,
        chars: Array.from({ length: 20 }, () => matrixChars[Math.floor(Math.random() * matrixChars.length)]),
        opacity: Math.random() * 0.3 + 0.1,
      }))
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    window.addEventListener("mousemove", handleMouseMove)

    let time = 0
    const animate = () => {
      time += 0.016
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw data streams (matrix rain effect)
      ctx.font = "14px monospace"
      dataStreamsRef.current.forEach((stream) => {
        stream.y += stream.speed

        if (stream.y > canvas.height + stream.length * 20) {
          stream.y = -stream.length * 20
          stream.x = Math.random() * canvas.width
        }

        stream.chars.forEach((char, i) => {
          const charY = stream.y + i * 20
          if (charY > 0 && charY < canvas.height) {
            const fadeRatio = i / stream.chars.length
            const opacity = stream.opacity * (1 - fadeRatio * 0.8)
            
            // First character is brighter
            if (i === 0) {
              ctx.fillStyle = `rgba(34, 211, 238, ${opacity * 2})`
            } else {
              ctx.fillStyle = `rgba(16, 185, 129, ${opacity})`
            }
            
            ctx.fillText(char, stream.x, charY)
          }
        })

        // Randomly change characters
        if (Math.random() > 0.95) {
          const idx = Math.floor(Math.random() * stream.chars.length)
          stream.chars[idx] = matrixChars[Math.floor(Math.random() * matrixChars.length)]
        }
      })

      // Draw particle connections
      particlesRef.current.forEach((particle, i) => {
        particlesRef.current.slice(i + 1).forEach((other) => {
          const dx = particle.x - other.x
          const dy = particle.y - other.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 180) {
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(other.x, other.y)
            const opacity = (1 - distance / 180) * 0.2
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        })

        // Connect to mouse
        const mouseDx = particle.x - mouseRef.current.x
        const mouseDy = particle.y - mouseRef.current.y
        const mouseDistance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy)

        if (mouseDistance < 200) {
          ctx.beginPath()
          ctx.moveTo(particle.x, particle.y)
          ctx.lineTo(mouseRef.current.x, mouseRef.current.y)
          const opacity = (1 - mouseDistance / 200) * 0.3
          ctx.strokeStyle = `rgba(236, 72, 153, ${opacity})`
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
      })

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Add slight attraction to mouse
        const mouseDx = mouseRef.current.x - particle.x
        const mouseDy = mouseRef.current.y - particle.y
        const mouseDistance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy)
        
        if (mouseDistance < 300 && mouseDistance > 0) {
          const force = 0.00005
          particle.vx += (mouseDx / mouseDistance) * force * (300 - mouseDistance)
          particle.vy += (mouseDy / mouseDistance) * force * (300 - mouseDistance)
        }

        // Apply velocity with damping
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vx *= 0.99
        particle.vy *= 0.99

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        // Keep in bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x))
        particle.y = Math.max(0, Math.min(canvas.height, particle.y))

        // Pulsing size
        const pulseSize = particle.size + Math.sin(time * 2 + particle.pulseOffset) * 0.5

        // Draw particle glow
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, pulseSize * 4
        )
        gradient.addColorStop(0, particle.color.replace(/[\d.]+\)$/, `${particle.opacity * 0.5})`))
        gradient.addColorStop(1, "transparent")
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, pulseSize * 4, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Draw particle core
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, pulseSize, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.fill()
      })

      // Draw scanning line effect
      const scanY = (time * 50) % (canvas.height + 100) - 50
      const scanGradient = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30)
      scanGradient.addColorStop(0, "transparent")
      scanGradient.addColorStop(0.5, "rgba(34, 211, 238, 0.03)")
      scanGradient.addColorStop(1, "transparent")
      ctx.fillStyle = scanGradient
      ctx.fillRect(0, scanY - 30, canvas.width, 60)

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [mounted])

  if (!mounted) return null

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{ background: "transparent" }}
      />
      
      {/* Floating gradient orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)",
            top: "5%",
            left: "5%",
          }}
          animate={{
            x: [0, 120, 60, 0],
            y: [0, 60, 120, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)",
            bottom: "15%",
            right: "5%",
          }}
          animate={{
            x: [0, -100, -50, 0],
            y: [0, -80, -140, 0],
            scale: [1, 0.85, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, rgba(34, 211, 238, 0.4) 0%, transparent 70%)",
            top: "45%",
            right: "25%",
          }}
          animate={{
            x: [0, 80, -40, 0],
            y: [0, -50, 100, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-[350px] h-[350px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)",
            bottom: "30%",
            left: "20%",
          }}
          animate={{
            x: [0, -60, 90, 0],
            y: [0, 80, -40, 0],
            scale: [1, 0.9, 1.15, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Moving hex pattern */}
        <motion.div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
          animate={{
            backgroundPosition: ["0px 0px", "60px 60px"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Subtle grid overlay */}
      <div 
        className="fixed inset-0 -z-10 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Vignette effect */}
      <div 
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)",
        }}
      />
    </>
  )
}
