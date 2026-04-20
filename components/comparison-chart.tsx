"use client"

import { motion } from "framer-motion"
import { TrendingUp } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { EncryptionResult } from "@/lib/types"

interface ComparisonChartProps {
  results: EncryptionResult[]
}

const chartConfig = {
  execution_time: {
    label: "Execution Time",
    color: "var(--chart-1)",
  },
  throughput: {
    label: "Throughput",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const algorithmColors: Record<string, string> = {
  RSA: "var(--chart-1)",
  Playfair: "var(--chart-3)",
  Vigenere: "var(--chart-2)",
  Hybrid: "oklch(0.60 0.25 25)",
}

export function ComparisonChart({ results }: ComparisonChartProps) {
  if (results.length === 0) {
    return null
  }

  const timeData = results.map((r) => ({
    algorithm: r.algorithm,
    value: r.execution_time,
    fastest: r.fastest,
  }))

  const throughputData = results.map((r) => ({
    algorithm: r.algorithm,
    value: r.throughput,
    most_efficient: r.most_efficient,
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="time" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="time">Execution Time</TabsTrigger>
              <TabsTrigger value="throughput">Throughput</TabsTrigger>
            </TabsList>

            <TabsContent value="time" className="mt-0">
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      stroke="var(--border)"
                    />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      tickFormatter={(value) => `${value}ms`}
                    />
                    <YAxis
                      type="category"
                      dataKey="algorithm"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--foreground)", fontSize: 12 }}
                      width={80}
                    />
                    <ChartTooltip
                      cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                      content={
                        <ChartTooltipContent
                          formatter={(value) => `${Number(value).toFixed(2)}ms`}
                        />
                      }
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                      {timeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.fastest
                              ? "var(--chart-2)"
                              : algorithmColors[entry.algorithm] || "var(--chart-1)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Lower is better. Highlighted bar indicates fastest algorithm.
              </p>
            </TabsContent>

            <TabsContent value="throughput" className="mt-0">
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={throughputData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      stroke="var(--border)"
                    />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      tickFormatter={(value) => `${value} c/ms`}
                    />
                    <YAxis
                      type="category"
                      dataKey="algorithm"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--foreground)", fontSize: 12 }}
                      width={80}
                    />
                    <ChartTooltip
                      cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                      content={
                        <ChartTooltipContent
                          formatter={(value) => `${Number(value).toFixed(1)} chars/ms`}
                        />
                      }
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                      {throughputData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.most_efficient
                              ? "var(--chart-3)"
                              : algorithmColors[entry.algorithm] || "var(--chart-1)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Higher is better. Highlighted bar indicates most efficient algorithm.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}
