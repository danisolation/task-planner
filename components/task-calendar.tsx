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
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
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

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  const getTasksForDay = (day: Date) => {
    return tasks.filter((task) => isSameDay(new Date(task.dueDate), day))
  }

  // Create array for day names in Vietnamese
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

  const totalTasksThisMonth = tasks.filter(task => {
    const taskDate = new Date(task.dueDate)
    return taskDate >= monthStart && taskDate <= monthEnd
  }).length

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold capitalize">{format(currentMonth, "MMMM yyyy", { locale: vi })}</h2>
          <p className="text-sm text-muted-foreground">
            {totalTasksThisMonth} kế hoạch trong tháng này
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday} className="rounded-full">
            <CalendarDays className="h-4 w-4 mr-2" />
            Hôm nay
          </Button>
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-full">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 rounded-xl overflow-hidden border bg-card">
        {/* Day names */}
        {dayNames.map((day, i) => (
          <div 
            key={i} 
            className={cn(
              "text-center py-3 font-semibold text-sm bg-muted/50",
              i === 0 && "text-red-500 dark:text-red-400"
            )}
          >
            {day}
          </div>
        ))}

        {/* Empty cells for days before the start of the month */}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-24 md:h-32 p-1 bg-muted/20"></div>
        ))}

        {/* Calendar days */}
        {monthDays.map((day) => {
          const dayTasks = getTasksForDay(day)
          const isToday = isSameDay(day, new Date())
          const isSunday = getDay(day) === 0

          return (
            <div
              key={day.toString()}
              className={cn(
                "h-24 md:h-32 p-1.5 overflow-hidden flex flex-col transition-all duration-200 hover:bg-muted/30",
                isToday && "ring-2 ring-inset ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20",
                !isSameMonth(day, currentMonth) && "opacity-30",
              )}
            >
              <div className={cn(
                "text-right text-sm font-medium p-1 rounded-full w-7 h-7 flex items-center justify-center ml-auto",
                isToday && "bg-blue-500 text-white",
                isSunday && !isToday && "text-red-500 dark:text-red-400"
              )}>
                {format(day, "d")}
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs custom-scrollbar mt-1">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onEdit(task)}
                    className={cn(
                      "p-1.5 rounded-md truncate cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-sm",
                      task.status === "completed"
                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 line-through opacity-60"
                        : task.status === "overdue"
                          ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 animate-pulse-soft"
                          : "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300",
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

      <div className="flex flex-wrap gap-2 justify-center mt-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-xs font-medium text-blue-800 dark:text-blue-300">Chưa hoàn thành</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Đã hoàn thành</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/40">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span className="text-xs font-medium text-red-800 dark:text-red-300">Quá hạn</span>
        </div>
      </div>
    </div>
  )
}
