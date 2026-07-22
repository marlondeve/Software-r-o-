import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

interface BarItem {
  label: string
  value: number
  color: string
}

function slugify(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function buildChartConfig(items: BarItem[]): ChartConfig {
  return items.reduce<ChartConfig>((acc, item) => {
    acc[slugify(item.label)] = { label: item.label, color: item.color }
    return acc
  }, {})
}

function toChartData(items: BarItem[]) {
  return items.map((item) => ({
    label: item.label,
    value: item.value,
    color: item.color,
    key: slugify(item.label),
  }))
}

interface HorizontalBarChartProps {
  items: BarItem[]
  className?: string
}

export function HorizontalBarChart({ items, className }: HorizontalBarChartProps) {
  const chartData = toChartData(items)
  const chartConfig = buildChartConfig(items)

  return (
    <ChartContainer config={chartConfig} className={cn("min-h-220px w-full", className)}>
      <BarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
        margin={{ left: 8, right: 8 }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="label"
          type="category"
          tickLine={false}
          axisLine={false}
          width={88}
          tick={{ fontSize: 11 }}
        />
        <XAxis type="number" hide domain={[0, "dataMax + 10"]} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent formatter={(value) => `${value}%`} />}
        />
        <Bar dataKey="value" radius={4}>
          {chartData.map((item) => (
            <Cell key={item.key} fill={item.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

interface VerticalBarChartProps {
  items: BarItem[]
  className?: string
}

export function VerticalBarChart({ items, className }: VerticalBarChartProps) {
  const chartData = toChartData(items)
  const chartConfig = buildChartConfig(items)

  return (
    <ChartContainer config={chartConfig} className={cn("min-h-220px w-full", className)}>
      <BarChart accessibilityLayer data={chartData} margin={{ top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          interval={0}
        />
        <YAxis hide domain={[0, "dataMax + 10"]} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent formatter={(value) => `${value}%`} />}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((item) => (
            <Cell key={item.key} fill={item.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
