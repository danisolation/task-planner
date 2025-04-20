"use client"

import { useState } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
} from "date-fns"
import { vi } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface TaskCalendarProps {
  tasks: Task[]
  onEdit: (task: Task) => void
}

export function TaskCalendar({ tasks, onEdit }: TaskCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get the day of the week for the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const startDay = getDay(monthStart)

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const getTasksForDay = (day: Date) => {
    return tasks.filter((task) => isSameDay(new Date(task.dueDate), day))
  }

  // Create array for day names in Vietnamese
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{format(currentMonth, "MMMM yyyy", { locale: vi })}</h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Day names */}
        {dayNames.map((day, i) => (
          <div key={i} className="text-center py-2 font-medium text-sm text-slate-500 dark:text-slate-400">
            {day}
          </div>
        ))}

        {/* Empty cells for days before the start of the month */}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-24 md:h-32 p-1 border rounded-md bg-slate-50 dark:bg-slate-900/20"></div>
        ))}

        {/* Calendar days */}
        {monthDays.map((day) => {
          const dayTasks = getTasksForDay(day)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toString()}
              className={cn(
                "h-24 md:h-32 p-1 border rounded-md overflow-hidden flex flex-col",
                isToday && "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                !isSameMonth(day, currentMonth) && "bg-slate-50 dark:bg-slate-900/20 opacity-50",
              )}
            >
              <div className={cn("text-right text-sm font-medium p-1", isToday && "text-blue-600 dark:text-blue-400")}>
                {format(day, "d")}
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onEdit(task)}
                    className={cn(
                      "p-1 rounded truncate cursor-pointer hover:opacity-80",
                      task.status === "completed"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        : task.status === "overdue"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
                    )}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2 justify-end mt-4">
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Chưa hoàn thành</Badge>
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Đã hoàn thành</Badge>
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Quá hạn</Badge>
      </div>
    </div>
  )
}
