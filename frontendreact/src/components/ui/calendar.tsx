import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import type { DayPickerSingleProps, DayPickerRangeProps, DayPickerMultipleProps } from "react-day-picker"
import "react-day-picker/dist/style.css"

export type CalendarProps = (DayPickerSingleProps | DayPickerRangeProps | DayPickerMultipleProps) & { className?: string };

export function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={"p-3 bg-white rounded-xl shadow-lg " + (className || "")}
      {...props}
    />
  )
} 