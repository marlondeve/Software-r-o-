import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

interface IndicadorItem {
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

export function IndicadoresChart({
  items,
  className,
}: {
  items: IndicadorItem[]
  className?: string
}) {
  const chartData = items.map((item) => ({ ...item, key: slugify(item.label) }))
  const chartConfig = chartData.reduce<ChartConfig>((acc, item) => {
    acc[item.key] = { label: item.label, color: item.color }
    return acc
  }, {})

  return (
    <ChartContainer
      config={chartConfig}
      className={cn("aspect-auto h-48 w-full sm:h-56 lg:h-64", className)}
    >
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
