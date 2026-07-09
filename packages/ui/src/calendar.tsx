"use client"

import * as React from "react"
import type { VariantProps } from "class-variance-authority"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import type { DayButtonProps } from "react-day-picker"

import "react-day-picker/style.css"

import { cn } from "./lib/utils"
import { buttonVariants } from "./button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function CalendarDayButton({ className, day, modifiers, ...props }: DayButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString()}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "size-[--cell-size] min-h-[--cell-size] min-w-[--cell-size] cursor-pointer font-normal text-foreground",
        modifiers.selected &&
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground",
        modifiers.range_start && "rounded-s-md rounded-e-none bg-primary text-primary-foreground",
        modifiers.range_end && "rounded-e-md rounded-s-none bg-primary text-primary-foreground",
        modifiers.range_middle && "rounded-none bg-accent text-accent-foreground",
        modifiers.today && !modifiers.selected && "border border-primary/25 bg-accent text-accent-foreground",
        modifiers.outside && "text-muted-foreground opacity-50",
        modifiers.disabled && "text-muted-foreground opacity-40",
        className,
      )}
      {...props}
    />
  )
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown",
  buttonVariant = "outline",
  formatters,
  components,
  ...props
}: CalendarProps & {
  buttonVariant?: VariantProps<typeof buttonVariants>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn(
        "rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-sm [--cell-size:2.25rem] md:[--cell-size:2.5rem]",
        "[--rdp-accent-color:var(--color-primary)] [--rdp-accent-background-color:var(--color-accent)] [--rdp-today-color:var(--color-primary)] [--rdp-day_button-border-radius:var(--radius)]",
        "[[data-slot=popover-content]_&]:border-0 [[data-slot=popover-content]_&]:shadow-none",
        className,
      )}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-[--cell-size] w-full items-center justify-center px-[--cell-size]",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-[--cell-size] w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative rounded-md border border-input shadow-xs focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn("absolute inset-0 cursor-pointer opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal",
          defaultClassNames.weekday,
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn("w-[--cell-size] select-none", defaultClassNames.week_number_header),
        week_number: cn(
          "text-muted-foreground select-none text-[0.8rem]",
          defaultClassNames.week_number,
        ),
        day: cn(
          "group/day relative flex aspect-square h-full w-full select-none items-center justify-center p-0 text-center [&:first-child[data-selected=true]_button]:rounded-s-md [&:last-child[data-selected=true]_button]:rounded-e-md",
          defaultClassNames.day,
        ),
        range_start: cn("rounded-s-md bg-accent", defaultClassNames.range_start),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-e-md bg-accent", defaultClassNames.range_end),
        today: cn(
          "font-medium text-primary data-[selected=true]:rounded-md data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside,
        ),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ className: chClass, orientation, ...chevProps }) => {
          if (orientation === "left") {
            return <ChevronLeft className={cn("size-4", chClass)} {...chevProps} />
          }
          if (orientation === "right") {
            return <ChevronRight className={cn("size-4", chClass)} {...chevProps} />
          }
          return <ChevronDown className={cn("size-4", chClass)} {...chevProps} />
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar, CalendarDayButton }
