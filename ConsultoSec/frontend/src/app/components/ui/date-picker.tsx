import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "./utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

export interface DatePickerProps {
  value?: string | Date | null
  onChange?: (date: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  minDate?: string | Date
  maxDate?: string | Date
}

export function DatePicker({
  value,
  onChange,
  disabled,
  className,
  placeholder = "Seleccionar fecha",
  minDate,
  maxDate,
}: DatePickerProps) {
  const parseDate = (val: string | Date | null | undefined) => {
    if (!val) return undefined;
    if (val instanceof Date) return val;
    // Forzamos que siempre tome el YYYY-MM-DD y le agregue la medianoche local
    // para evitar que zonas horarias desfasen la fecha y para alinearse con Gantt.
    const dateStr = typeof val === 'string' && val.length >= 10
      ? `${val.substring(0, 10)}T00:00:00`
      : val;
    return new Date(dateStr);
  };

  const [date, setDate] = React.useState<Date | undefined>(parseDate(value))
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setDate(parseDate(value))
  }, [value])

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (onChange) {
      if (selectedDate) {
        const formattedDate = format(selectedDate, "yyyy-MM-dd")
        onChange(formattedDate)
      } else {
        onChange("")
      }
    }
    setOpen(false); // Cerramos el popover al seleccionar
  }

  const fromDate = minDate ? parseDate(minDate) : undefined;
  const toDate = maxDate ? parseDate(maxDate) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          size="sm"
          disabled={disabled}
          className={cn(
            "h-9 w-full text-gray-700 justify-start text-left font-medium text-[11px] border-gray-100 bg-white hover:border-gray-300 transition-all focus:ring-1 focus:ring-[#003087]",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-50 shrink-0" />
          <span className="truncate">
            {date ? format(date, "PP", { locale: es }) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 shadow-xl border-gray-100" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          locale={es}
          fromDate={fromDate}
          toDate={toDate}
        />
      </PopoverContent>
    </Popover>
  )
}
