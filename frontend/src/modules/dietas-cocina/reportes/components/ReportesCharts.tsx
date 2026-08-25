import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatearMonedaCOP } from "@/modules/dietas-cocina/lib/resolverTarifaDieta"
import { cn } from "@/lib/utils"

interface BarItem {
  label: string
  value: number
  color: string
}

export type FormatoValorGrafico = "numero" | "moneda"

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

function formatearValorGrafico(
  value: unknown,
  formato: FormatoValorGrafico,
): string {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return "—"
  if (formato === "moneda") return `${formatearMonedaCOP(n)} COP`
  return n.toLocaleString("es-CO")
}

function ChartVacio({ mensaje }: { mensaje?: string }) {
  return (
    <div className="flex min-h-180px items-center justify-center px-4 text-center text-sm text-muted-foreground">
      {mensaje ?? "Sin datos en el período seleccionado"}
    </div>
  )
}

interface HorizontalBarChartProps {
  items: BarItem[]
  className?: string
  formatoValor?: FormatoValorGrafico
  vacioMensaje?: string
}

export function HorizontalBarChart({
  items,
  className,
  formatoValor = "numero",
  vacioMensaje,
}: HorizontalBarChartProps) {
  if (items.length === 0) return <ChartVacio mensaje={vacioMensaje} />

  const chartData = toChartData(items)
  const chartConfig = buildChartConfig(items)
  const esMoneda = formatoValor === "moneda"
  const labelWidth = Math.min(
    140,
    Math.max(88, ...items.map((i) => Math.min(i.label.length * 7, 140))),
  )

  return (
    <ChartContainer config={chartConfig} className={cn("min-h-220px w-full", className)}>
      <BarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
        margin={{ left: 4, right: esMoneda ? 80 : 48, top: 4, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="label"
          type="category"
          tickLine={false}
          axisLine={false}
          width={labelWidth}
          tick={{ fontSize: 11 }}
        />
        <XAxis
          type="number"
          hide
          domain={[0, (dataMax: number) => dataMax * 1.15 || 10]}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value) => formatearValorGrafico(value, formatoValor)}
            />
          }
        />
        <Bar dataKey="value" radius={4}>
          {chartData.map((item) => (
            <Cell key={item.key} fill={item.color} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            className="fill-foreground text-[10px] tabular-nums"
            formatter={(value) => formatearValorGrafico(value, formatoValor)}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

interface VerticalBarChartProps {
  items: BarItem[]
  className?: string
  formatoValor?: FormatoValorGrafico
  vacioMensaje?: string
  /** Con muchas categorías / etiquetas largas, usa barras horizontales. */
  preferirHorizontalSiMuchas?: boolean
}

export function VerticalBarChart({
  items,
  className,
  formatoValor = "numero",
  vacioMensaje,
  preferirHorizontalSiMuchas = true,
}: VerticalBarChartProps) {
  const etiquetasLargas =
    items.length >= 4 || items.some((item) => item.label.length > 12)

  if (preferirHorizontalSiMuchas && etiquetasLargas) {
    return (
      <HorizontalBarChart
        items={items}
        className={className}
        formatoValor={formatoValor}
        vacioMensaje={vacioMensaje}
      />
    )
  }

  if (items.length === 0) return <ChartVacio mensaje={vacioMensaje} />

  const chartData = toChartData(items)
  const chartConfig = buildChartConfig(items)
  const esMoneda = formatoValor === "moneda"

  return (
    <ChartContainer config={chartConfig} className={cn("min-h-220px w-full", className)}>
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{ top: 24, bottom: 8, right: 8, left: 4 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          interval={0}
        />
        <YAxis
          hide
          domain={[0, (dataMax: number) => dataMax * 1.15 || 10]}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value) => formatearValorGrafico(value, formatoValor)}
            />
          }
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((item) => (
            <Cell key={item.key} fill={item.color} />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            className="fill-foreground text-[10px] tabular-nums"
            formatter={(value) =>
              esMoneda
                ? formatearMonedaCOP(Number(value))
                : Number(value).toLocaleString("es-CO")
            }
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
