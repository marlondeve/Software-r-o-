import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { SegmentoBarra } from "@/modules/encuestas/indicadores/datos/mockIndicadoresExperiencia"

function slugify(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function NivelSatisfaccionChart({ segmentos }: { segmentos: SegmentoBarra[] }) {
  const chartData = segmentos.map((segmento) => ({
    ...segmento,
    key: slugify(segmento.label),
  }))
  const chartConfig = chartData.reduce<ChartConfig>((acc, segmento) => {
    acc[segmento.key] = { label: segmento.label, color: segmento.color }
    return acc
  }, {})

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full sm:h-64">
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
          {chartData.map((segmento) => (
            <Cell key={segmento.key} fill={segmento.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
