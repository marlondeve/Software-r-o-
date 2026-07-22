import { Cell, Label, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  total: number
  totalDisplay?: string
  totalLabel?: string
  showCenterLabel?: boolean
  className?: string
}

function slugify(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function DonutChart({
  segments,
  total,
  totalDisplay,
  totalLabel = "Total",
  showCenterLabel = true,
  className,
}: DonutChartProps) {
  const chartData = segments.map((segment) => ({
    ...segment,
    key: slugify(segment.label),
  }))

  const chartConfig = chartData.reduce<ChartConfig>((acc, segment) => {
    acc[segment.key] = { label: segment.label, color: segment.color }
    return acc
  }, {})

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 sm:flex-row sm:items-center",
        className,
      )}
    >
      <ChartContainer
        config={chartConfig}
        initialDimension={{ width: 144, height: 144 }}
        className="mx-auto aspect-square size-36 shrink-0 [&_.recharts-responsive-container]:h-full!"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel nameKey="label" />}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            innerRadius="58%"
            outerRadius="88%"
            strokeWidth={2}
            stroke="var(--background)"
            label={false}
          >
            {chartData.map((segment) => (
              <Cell key={segment.key} fill={segment.color} />
            ))}
            {showCenterLabel && (
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                    return null
                  }

                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        dy="-0.35em"
                        className="fill-foreground text-2xl font-semibold"
                      >
                        {totalDisplay ?? total}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        dy="1.4em"
                        className="fill-muted-foreground text-xs"
                      >
                        {totalLabel}
                      </tspan>
                    </text>
                  )
                }}
              />
            )}
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {segments.map((segment) => (
          <li key={segment.label} className="flex min-w-0 items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="min-w-0 truncate text-muted-foreground">
              {segment.label}
            </span>
            <span className="ml-auto shrink-0 font-medium tabular-nums text-foreground">
              {segment.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
