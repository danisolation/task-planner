"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Chart,
  ChartContainer
} from "@/components/ui/chart"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ChartData, Task } from "@/lib/types"
import { endOfMonth, endOfWeek, format, isWithinInterval, startOfMonth, startOfWeek, subDays } from "date-fns"
import { AlertCircle, BarChart3, CalendarIcon, CheckCircle2, Clock, Download } from "lucide-react"
import { useState } from "react"

interface TaskAnalyticsProps {
  tasks: Task[]
}

export function TaskAnalytics({ tasks }: TaskAnalyticsProps) {
  const [dateRange, setDateRange] = useState<"all" | "week" | "month" | "custom">("all")
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 7))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [showCalendar, setShowCalendar] = useState<"start" | "end" | null>(null)
  const [chartType, setChartType] = useState<"status" | "priority" | "category" | "tags" | "timeline">("status")

  // Lọc tasks theo khoảng thời gian
  const filteredTasks = tasks.filter((task) => {
    const taskDate = new Date(task.dueDate)

    if (dateRange === "all") return true

    if (dateRange === "week") {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
      return isWithinInterval(taskDate, { start: weekStart, end: weekEnd })
    }

    if (dateRange === "month") {
      const monthStart = startOfMonth(new Date())
      const monthEnd = endOfMonth(new Date())
      return isWithinInterval(taskDate, { start: monthStart, end: monthEnd })
    }

    if (dateRange === "custom") {
      return isWithinInterval(taskDate, { start: startDate, end: endDate })
    }

    return true
  })

  // Tính toán số liệu thống kê
  const totalTasks = filteredTasks.length
  const completedTasks = filteredTasks.filter((task) => task.status === "completed").length
  const incompleteTasks = filteredTasks.filter((task) => task.status === "incomplete").length
  const overdueTasks = filteredTasks.filter((task) => task.status === "overdue").length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Tạo dữ liệu biểu đồ
  const getChartData = (): ChartData => {
    if (chartType === "status") {
      return {
        labels: ["Hoàn thành", "Chưa hoàn thành", "Quá hạn"],
        datasets: [
          {
            label: "Số lượng",
            data: [completedTasks, incompleteTasks, overdueTasks],
            backgroundColor: ["#22c55e", "#64748b", "#ef4444"],
          },
        ],
      }
    }

    if (chartType === "priority") {
      const highPriority = filteredTasks.filter((task) => task.priority === "cao").length
      const mediumPriority = filteredTasks.filter((task) => task.priority === "trung bình").length
      const lowPriority = filteredTasks.filter((task) => task.priority === "thấp").length

      return {
        labels: ["Cao", "Trung bình", "Thấp"],
        datasets: [
          {
            label: "Số lượng",
            data: [highPriority, mediumPriority, lowPriority],
            backgroundColor: ["#ef4444", "#f59e0b", "#22c55e"],
          },
        ],
      }
    }

    if (chartType === "category") {
      // Nhóm theo danh mục
      const categories: Record<string, number> = {}

      filteredTasks.forEach((task) => {
        if (categories[task.category]) {
          categories[task.category]++
        } else {
          categories[task.category] = 1
        }
      })

      return {
        labels: Object.keys(categories),
        datasets: [
          {
            label: "Số lượng",
            data: Object.values(categories),
            backgroundColor: ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#84cc16", "#06b6d4", "#14b8a6", "#f43f5e"],
          },
        ],
      }
    }

    if (chartType === "tags") {
      // Nhóm theo nhãn
      const tags: Record<string, number> = {}

      filteredTasks.forEach((task) => {
        if (task.tags) {
          task.tags.forEach((tag) => {
            if (tags[tag]) {
              tags[tag]++
            } else {
              tags[tag] = 1
            }
          })
        }
      })

      // Sắp xếp theo số lượng giảm dần và lấy 10 nhãn phổ biến nhất
      const sortedTags = Object.entries(tags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

      return {
        labels: sortedTags.map(([tag]) => tag),
        datasets: [
          {
            label: "Số lượng",
            data: sortedTags.map(([, count]) => count),
            backgroundColor: [
              "#3b82f6",
              "#8b5cf6",
              "#ec4899",
              "#f97316",
              "#84cc16",
              "#06b6d4",
              "#14b8a6",
              "#f43f5e",
              "#6366f1",
              "#a855f7",
            ],
          },
        ],
      }
    }

    if (chartType === "timeline") {
      // Nhóm theo ngày
      const dateMap: Record<string, { total: number; completed: number }> = {}

      // Tạo mảng các ngày trong khoảng thời gian
      const currentDate = new Date(startDate)
      const end = new Date(endDate)

      while (currentDate <= end) {
        const dateKey = format(currentDate, "yyyy-MM-dd")
        dateMap[dateKey] = { total: 0, completed: 0 }
        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Đếm số lượng task theo ngày
      filteredTasks.forEach((task) => {
        const taskDate = format(new Date(task.dueDate), "yyyy-MM-dd")

        if (dateMap[taskDate]) {
          dateMap[taskDate].total++

          if (task.status === "completed") {
            dateMap[taskDate].completed++
          }
        }
      })

      const dates = Object.keys(dateMap).sort()

      return {
        labels: dates.map((date) => format(new Date(date), "dd/MM")),
        datasets: [
          {
            label: "Tổng số",
            data: dates.map((date) => dateMap[date].total),
            borderColor: "#3b82f6",
            backgroundColor: ["rgba(59, 130, 246, 0.1)"],
            fill: true,
          },
          {
            label: "Hoàn thành",
            data: dates.map((date) => dateMap[date].completed),
            borderColor: "#22c55e",
            backgroundColor: ["rgba(34, 197, 94, 0.1)"],
            fill: true,
          },
        ],
      }
    }

    return { labels: [], datasets: [] }
  }

  const chartData = getChartData()

  // Xuất dữ liệu thống kê
  const exportAnalytics = () => {
    const data = {
      summary: {
        totalTasks,
        completedTasks,
        incompleteTasks,
        overdueTasks,
        completionRate,
      },
      dateRange: {
        type: dateRange,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      tasks: filteredTasks,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `task-analytics-${format(new Date(), "yyyy-MM-dd")}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Thống kê công việc</h2>
          <p className="text-sm text-muted-foreground">
            Phân tích hiệu suất và tiến độ công việc của bạn
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(value: "all" | "week" | "month" | "custom") => setDateRange(value)}>
            <SelectTrigger className="w-[160px] rounded-full">
              <SelectValue placeholder="Chọn khoảng thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thời gian</SelectItem>
              <SelectItem value="week">Tuần này</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
              <SelectItem value="custom">Tùy chỉnh</SelectItem>
            </SelectContent>
          </Select>

          {dateRange === "custom" && (
            <div className="flex items-center gap-2">
              <Popover open={showCalendar === "start"} onOpenChange={(open) => !open && setShowCalendar(null)}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[140px] justify-start text-left font-normal rounded-full"
                    onClick={() => setShowCalendar("start")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date)
                        setShowCalendar(null)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground">→</span>

              <Popover open={showCalendar === "end"} onOpenChange={(open) => !open && setShowCalendar(null)}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[180px] justify-start text-left font-normal"
                    onClick={() => setShowCalendar("end")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      if (date) {
                        setEndDate(date)
                        setShowCalendar(null)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
            <SelectTrigger className="w-[160px] rounded-full">
              <SelectValue placeholder="Chọn loại biểu đồ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Trạng thái</SelectItem>
              <SelectItem value="priority">Mức độ ưu tiên</SelectItem>
              <SelectItem value="category">Danh mục</SelectItem>
              <SelectItem value="tags">Nhãn phổ biến</SelectItem>
              <SelectItem value="timeline">Dòng thời gian</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={exportAnalytics} title="Xuất dữ liệu thống kê" className="rounded-full">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats cards with improved design */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card border-0 animate-slide-up" style={{ animationDelay: "0ms" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng kế hoạch</CardTitle>
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
              <BarChart3 className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dateRange === "all"
                ? "Tất cả thời gian"
                : dateRange === "week"
                  ? "Trong tuần này"
                  : dateRange === "month"
                    ? "Trong tháng này"
                    : `${format(startDate, "dd/MM")} - ${format(endDate, "dd/MM")}`}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 animate-slide-up" style={{ animationDelay: "50ms" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hoàn thành</CardTitle>
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{completedTasks}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{completionRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chưa xong</CardTitle>
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{incompleteTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((incompleteTasks / totalTasks) * 100) || 0}% tổng số
            </p>
          </CardContent>
        </Card>

        <Card className={`glass-card border-0 animate-slide-up ${overdueTasks > 0 ? 'ring-1 ring-red-500/30' : ''}`} style={{ animationDelay: "150ms" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quá hạn</CardTitle>
            <div className={`p-2 rounded-full ${overdueTasks > 0 ? 'bg-red-100 dark:bg-red-900/50 animate-pulse-soft' : 'bg-slate-100 dark:bg-slate-800'}`}>
              <AlertCircle className={`h-4 w-4 ${overdueTasks > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${overdueTasks > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>{overdueTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overdueTasks > 0 ? 'Cần xử lý ngay!' : 'Tuyệt vời! Không có quá hạn'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart section */}
      <Card className="col-span-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
        <CardHeader>
          <CardTitle>Phân tích kế hoạch</CardTitle>
          <CardDescription>
            {chartType === "status" && "Phân bố kế hoạch theo trạng thái"}
            {chartType === "priority" && "Phân bố kế hoạch theo mức độ ưu tiên"}
            {chartType === "category" && "Phân bố kế hoạch theo danh mục"}
            {chartType === "tags" && "Top 10 nhãn được sử dụng nhiều nhất"}
            {chartType === "timeline" && "Số lượng kế hoạch theo thời gian"}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          {totalTasks === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Không có dữ liệu để hiển thị
            </div>
          ) : (
            <ChartContainer className="h-full">
              {(chartType === "status" ||
                chartType === "priority" ||
                chartType === "category" ||
                chartType === "tags") && (
                <Chart
                  type="pie"
                  data={chartData}
                  options={{
                    plugins: {
                      legend: {
                        position: "right" as const,
                      },
                    },
                    maintainAspectRatio: false,
                  }}
                />
              )}

              {chartType === "timeline" && (
                <Chart
                  type="line"
                  data={chartData}
                  options={{
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0,
                        },
                      },
                    },
                    maintainAspectRatio: false,
                  }}
                />
              )}
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
