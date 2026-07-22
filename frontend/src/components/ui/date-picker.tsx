"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  id?: string
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4" />
          {value ? format(value, "PPP", { locale: es }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
          locale={es}
        />
      </PopoverContent>
    </Popover>
  )
}

interface DatePickerFromStringProps
  extends Omit<DatePickerProps, "value" | "onChange"> {
  value?: string
  onChange?: (value: string) => void
}

/** DatePicker controlado con valor ISO (yyyy-MM-dd). */
export function DatePickerFromString({
  value,
  onChange,
  ...props
}: DatePickerFromStringProps) {
  const fecha = value ? new Date(`${value}T12:00:00`) : undefined

  return (
    <DatePicker
      {...props}
      value={fecha}
      onChange={(date) => {
        if (!date) {
          onChange?.("")
          return
        }
        const iso = date.toISOString().slice(0, 10)
        onChange?.(iso)
      }}
    />
  )
}

interface DateRangePickerFromStringProps {
  from?: string
  to?: string
  onChange?: (range: { from?: string; to?: string }) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

function parseIsoDate(value?: string) {
  return value ? new Date(`${value}T12:00:00`) : undefined
}

function toIsoDate(date?: Date) {
  return date ? date.toISOString().slice(0, 10) : undefined
}

function formatDateRange(from?: Date, to?: Date) {
  if (!from) return null
  if (!to) return format(from, "d MMM yyyy", { locale: es })
  return `${format(from, "d MMM", { locale: es })} - ${format(to, "d MMM, yyyy", { locale: es })}`
}

/** Selector de rango controlado con valores ISO (yyyy-MM-dd). */
export function DateRangePickerFromString({
  from,
  to,
  onChange,
  placeholder = "Seleccionar rango",
  disabled,
  className,
}: DateRangePickerFromStringProps) {
  const [open, setOpen] = React.useState(false)
  const fromDate = parseIsoDate(from)
  const toDate = parseIsoDate(to)
  const selected: DateRange | undefined =
    fromDate || toDate ? { from: fromDate, to: toDate } : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "justify-start font-normal",
            !fromDate && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4" />
          {formatDateRange(fromDate, toDate) ?? placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={(range) => {
            onChange?.({
              from: toIsoDate(range?.from),
              to: toIsoDate(range?.to),
            })
            if (range?.from && range?.to) {
              setOpen(false)
            }
          }}
          locale={es}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  )
}
