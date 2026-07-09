"use client"

import * as React from "react"
import { format, isSameDay, startOfDay } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "./lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Label } from "./label"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

function mergeDateTime(day: Date, hour: number, minute: number) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0)
}

function clampEarliest(d: Date, earliest?: Date) {
  if (!earliest) return d
  return d.getTime() < earliest.getTime() ? new Date(earliest) : d
}

function hourOptionsForDay(day: Date, earliest?: Date) {
  if (!earliest) return HOURS
  if (!isSameDay(day, earliest)) return HOURS
  return HOURS.filter((h) => h >= earliest.getHours())
}

function minuteOptionsForDay(day: Date, hour: number, earliest?: Date) {
  if (!earliest) return MINUTES
  if (!isSameDay(day, earliest)) return MINUTES
  if (hour > earliest.getHours()) return MINUTES
  if (hour < earliest.getHours()) return MINUTES
  return MINUTES.filter((m) => m >= earliest.getMinutes())
}

function parseDatetimeLocal(value: string): Date | undefined {
  if (!value || !value.includes("T")) return undefined
  const [d, t] = value.split("T")
  const [y, mo, da] = d.split("-").map(Number)
  const [h, mi] = t.split(":").map(Number)
  if ([y, mo, da, h, mi].some((n) => Number.isNaN(n))) return undefined
  return new Date(y, mo - 1, da, h, mi, 0, 0)
}

function toDatetimeLocalString(d: Date) {
  return `${format(d, "yyyy-MM-dd")}T${format(d, "HH:mm")}`
}

function withCurrentIncluded(options: number[], current: number) {
  if (options.includes(current)) return options
  return [...options, current].sort((a, b) => a - b)
}

function TimePlaceholder() {
  return (
    <div className="flex h-10 w-[5.5rem] items-center justify-center rounded-md border border-dashed border-input bg-muted/30 text-xs text-muted-foreground">
      --
    </div>
  )
}

export type DateTimePickerProps = {
  date: Date
  onSelect: (date: Date) => void
  className?: string
  disabled?: boolean
  /** Combined value cannot be earlier than this instant (also trims same-day time options). */
  earliestAllowed?: Date
  /** Calendar days before this date (start of day) are disabled; defaults to start of `earliestAllowed` when set. */
  minCalendarDate?: Date
}

export function DateTimePicker({
  date,
  onSelect,
  className,
  disabled,
  earliestAllowed,
  minCalendarDate,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [timeZone, setTimeZone] = React.useState<string | undefined>(undefined)

  const calendarFloor = minCalendarDate ?? (earliestAllowed ? startOfDay(earliestAllowed) : undefined)

  React.useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  const applyDateTime = React.useCallback(
    (day: Date, hour: number, minute: number) => {
      const merged = mergeDateTime(day, hour, minute)
      onSelect(clampEarliest(merged, earliestAllowed))
    },
    [earliestAllowed, onSelect],
  )

  const hours = withCurrentIncluded(hourOptionsForDay(date, earliestAllowed), date.getHours())
  const minutes = withCurrentIncluded(
    minuteOptionsForDay(date, date.getHours(), earliestAllowed),
    date.getMinutes(),
  )

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-end gap-2">
        <div className="grid grow gap-2">
          <Label className="sr-only">Date</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                className="h-10 w-full min-w-[12rem] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 size-4 shrink-0 opacity-70" />
                {format(date, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                timeZone={timeZone}
                onSelect={(day) => {
                  if (!day) return
                  applyDateTime(day, date.getHours(), date.getMinutes())
                  setOpen(false)
                }}
                disabled={calendarFloor ? { before: startOfDay(calendarFloor) } : undefined}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid w-[5.5rem] shrink-0 gap-2">
          <Label className="text-xs text-muted-foreground">Hour</Label>
          <Select
            disabled={disabled}
            value={String(date.getHours())}
            onValueChange={(v) => applyDateTime(date, Number(v), date.getMinutes())}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-60">
              {hours.map((h) => (
                <SelectItem key={h} value={String(h)}>
                  {String(h).padStart(2, "0")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid w-[5.5rem] shrink-0 gap-2">
          <Label className="text-xs text-muted-foreground">Min</Label>
          <Select
            disabled={disabled}
            value={String(date.getMinutes())}
            onValueChange={(v) => applyDateTime(date, date.getHours(), Number(v))}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-60">
              {minutes.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {String(m).padStart(2, "0")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {format(date, "EEEE, MMM d, yyyy 'at' h:mm a")}
      </p>
    </div>
  )
}

export type DateTimeLocalPickerProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  placeholder?: string
  /** Minimum local datetime (`YYYY-MM-DDTHH:mm`), same as native `min` on `datetime-local`. */
  min?: string
  /** When true, show a control to reset the value to an empty string. */
  allowClear?: boolean
}

export function DateTimeLocalPicker({
  id,
  value,
  onChange,
  className,
  disabled,
  placeholder = "Select date and time",
  min,
  allowClear,
}: DateTimeLocalPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [timeZone, setTimeZone] = React.useState<string | undefined>(undefined)

  const minDate = min ? parseDatetimeLocal(min) : undefined
  const earliestAllowed = minDate
  const calendarFloor = earliestAllowed ? startOfDay(earliestAllowed) : undefined

  const selected = parseDatetimeLocal(value)

  React.useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  const apply = React.useCallback(
    (next: Date) => {
      const clamped = clampEarliest(next, earliestAllowed)
      onChange(toDatetimeLocalString(clamped))
    },
    [earliestAllowed, onChange],
  )

  const hours = selected
    ? withCurrentIncluded(hourOptionsForDay(selected, earliestAllowed), selected.getHours())
    : HOURS
  const minutes = selected
    ? withCurrentIncluded(
        minuteOptionsForDay(selected, selected.getHours(), earliestAllowed),
        selected.getMinutes(),
      )
    : MINUTES

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-end gap-2">
        <div className="grid grow gap-2">
          <Label htmlFor={id} className="sr-only">
            Date
          </Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id={id}
                type="button"
                variant="outline"
                disabled={disabled}
                className={cn(
                  "h-10 w-full min-w-[12rem] justify-start text-left font-normal",
                  !selected && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 size-4 shrink-0 opacity-70" />
                {selected ? format(selected, "PPP") : placeholder}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selected}
                timeZone={timeZone}
                onSelect={(day) => {
                  if (!day) return
                  const hour = selected ? selected.getHours() : 9
                  const minute = selected ? selected.getMinutes() : 0
                  const merged = mergeDateTime(day, hour, minute)
                  apply(merged)
                  setOpen(false)
                }}
                disabled={calendarFloor ? { before: startOfDay(calendarFloor) } : undefined}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid w-[5.5rem] shrink-0 gap-2">
          <Label className="text-xs text-muted-foreground">Hour</Label>
          {selected ? (
            <Select
              disabled={disabled}
              value={String(selected.getHours())}
              onValueChange={(v) => apply(mergeDateTime(selected, Number(v), selected.getMinutes()))}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60">
                {hours.map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {String(h).padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <TimePlaceholder />
          )}
        </div>
        <div className="grid w-[5.5rem] shrink-0 gap-2">
          <Label className="text-xs text-muted-foreground">Min</Label>
          {selected ? (
            <Select
              disabled={disabled}
              value={String(selected.getMinutes())}
              onValueChange={(v) => apply(mergeDateTime(selected, selected.getHours(), Number(v)))}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60">
                {minutes.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {String(m).padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <TimePlaceholder />
          )}
        </div>
      </div>
      {selected ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted-foreground">{format(selected, "EEEE, MMM d, yyyy 'at' h:mm a")}</p>
          {allowClear ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-0 text-xs text-muted-foreground"
              disabled={disabled}
              onClick={() => onChange("")}
            >
              Clear
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
