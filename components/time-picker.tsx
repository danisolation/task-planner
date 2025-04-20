"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const [time, setTime] = useState(value || "00:00")

  useEffect(() => {
    if (value) {
      setTime(value)
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTime(newTime)
    onChange(newTime)
  }

  return (
    <div className="flex items-center space-x-2">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <Input
        type="time"
        value={time}
        onChange={handleChange}
        disabled={disabled}
        className={cn("flex-1", disabled && "opacity-50 cursor-not-allowed")}
      />
    </div>
  )
}
