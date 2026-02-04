"use client"

import { useState, useEffect, useCallback } from "react"
import {
  PlusCircle,
  Calendar,
  ListTodo,
  LayoutGrid,
  BarChart3,
  Clock,
  Sun,
  Moon,
  Download,
  Kanban,
  AlertTriangle,
  CheckCircle2,
  ListFilter,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  Command,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskList } from "./task-list"
import { TaskCalendar } from "./task-calendar"
import { TaskGrid } from "./task-grid"
import { TaskDialog } from "./task-dialog"
import { TaskAnalytics } from "./task-analytics"
import { PomodoroTimer } from "./pomodoro-timer"
import { TaskImportExport } from "./task-import-export"
import { useTheme } from "next-themes"
import type { Task, TaskReminderSettings } from "@/lib/types"
import { TaskReminder } from "./task-reminder"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { TaskShare } from "./task-share"
import { TaskKanban } from "./task-kanban"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function TaskPlanner() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isClient, setIsClient] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [activeTab, setActiveTab] = useState("list")
  const [isTimerOpen, setIsTimerOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [taskFilter, setTaskFilter] = useState<"all" | "today" | "week" | "overdue">("all")
  const { theme, setTheme } = useTheme()

  // State cho dialog nhắc nhở
  const [isReminderOpen, setIsReminderOpen] = useState(false)
  const [reminderTask, setReminderTask] = useState<Task | null>(null)

  // State cho dialog chia sẻ
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [shareTask, setShareTask] = useState<Task | null>(null)

  // Hook toast
  const { toast } = useToast()

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Chào buổi sáng"
    if (hour < 18) return "Chào buổi chiều"
    return "Chào buổi tối"
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N: New task
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        openNewTaskDialog()
      }
      // Ctrl/Cmd + P: Pomodoro
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        setIsTimerOpen(true)
      }
      // Ctrl/Cmd + E: Export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault()
        setIsExportOpen(true)
      }
      // 1-5: Switch tabs
      if (e.key >= '1' && e.key <= '5' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          const tabs = ['list', 'kanban', 'calendar', 'grid', 'analytics']
          setActiveTab(tabs[parseInt(e.key) - 1])
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Load tasks from localStorage on component mount
  useEffect(() => {
    setIsClient(true)

    // Chỉ load tasks từ localStorage khi ở phía client
    const savedTasks = localStorage.getItem("tasks")
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks))
      } catch (e) {
        console.error("Failed to parse saved tasks", e)
      }
    }
  }, [])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    // Chỉ lưu vào localStorage khi ở phía client
    if (isClient) {
      localStorage.setItem("tasks", JSON.stringify(tasks))
    }
  }, [tasks, isClient])

  // Check for overdue tasks
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const updatedTasks: Task[] = tasks.map((task) => {
      const dueDate = new Date(task.dueDate)
      dueDate.setHours(0, 0, 0, 0)

      if (task.status !== "completed" && dueDate < today) {
        return { ...task, status: "overdue" }
      }
      return task
    })

    if (JSON.stringify(updatedTasks) !== JSON.stringify(tasks)) {
      setTasks(updatedTasks)
    }
  }, [tasks])

  // Kiểm tra nhắc nhở
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()

      tasks.forEach((task) => {
        if (task.reminder?.enabled && task.reminder.time && task.reminder.unit && task.status !== "completed") {
          const dueDate = new Date(task.dueDate)
          const reminderTime = new Date(dueDate)

          // Tính toán thời gian nhắc nhở
          switch (task.reminder.unit) {
            case "minutes":
              reminderTime.setMinutes(reminderTime.getMinutes() - task.reminder.time)
              break
            case "hours":
              reminderTime.setHours(reminderTime.getHours() - task.reminder.time)
              break
            case "days":
              reminderTime.setDate(reminderTime.getDate() - task.reminder.time)
              break
            case "weeks":
              reminderTime.setDate(reminderTime.getDate() - task.reminder.time * 7)
              break
          }

          // Kiểm tra nếu đã đến thời gian nhắc nhở (trong vòng 1 phút)
          const timeDiff = Math.abs(now.getTime() - reminderTime.getTime())
          if (timeDiff < 60000) {
            // 1 phút = 60000 ms
            // Hiển thị thông báo
            toast({
              title: "Nhắc nhở kế hoạch",
              description: `"${task.title}" sẽ đến hạn vào ${format(dueDate, "HH:mm - dd/MM/yyyy", { locale: vi })}`,
              duration: 10000,
            })

            // Phát âm thanh thông báo
            const audio = new Audio("/notification.mp3")
            audio.play()

            // Cập nhật task để đánh dấu đã nhắc nhở
            updateTask({
              ...task,
              reminder: {
                ...task.reminder,
                notified: true,
              },
            })
          }
        }
      })
    }

    // Kiểm tra nhắc nhở mỗi phút
    const interval = setInterval(checkReminders, 60000)

    // Kiểm tra ngay khi component mount
    checkReminders()

    return () => clearInterval(interval)
  }, [tasks, toast])

  const addTask = (task: Task) => {
    setTasks((previousTasks) => [...previousTasks, task])
  }

  const updateTask = useCallback((updatedTask: Task) => {
    setTasks((previousTasks) =>
      previousTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    )
  }, [])

  const deleteTask = (id: string) => {
    setTasks((previousTasks) => previousTasks.filter((task) => task.id !== id))
  }

  const openNewTaskDialog = () => {
    setEditingTask(null)
    setIsDialogOpen(true)
  }

  const openEditTaskDialog = (task: Task) => {
    setEditingTask(task)
    setIsDialogOpen(true)
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const duplicateTask = (task: Task) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      title: `${task.title} (Bản sao)`,
      status: "incomplete",
    }
    addTask(newTask)
  }

  // Mở dialog nhắc nhở
  const openReminderDialog = (task: Task) => {
    setReminderTask(task)
    setIsReminderOpen(true)
  }

  // Mở dialog chia sẻ
  const openShareDialog = (task: Task) => {
    setShareTask(task)
    setIsShareOpen(true)
  }

  // Lưu cài đặt nhắc nhở
  const saveReminderSettings = (taskId: string, reminderSettings: TaskReminderSettings) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, reminder: reminderSettings.enabled ? reminderSettings : undefined } : task,
      ),
    )
  }

  // Cập nhật trạng thái công việc con
  const updateSubtaskStatus = (taskId: string, subtaskId: string, completed: boolean) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === taskId && task.subTasks) {
          const updatedSubtasks = task.subTasks.map((subtask) =>
            subtask.id === subtaskId ? { ...subtask, completed } : subtask,
          )

          // Kiểm tra nếu tất cả công việc con đã hoàn thành thì đánh dấu công việc chính là hoàn thành
          const allCompleted = updatedSubtasks.every((subtask) => subtask.completed)

          return {
            ...task,
            subTasks: updatedSubtasks,
            status: allCompleted ? "completed" : task.status,
          }
        }
        return task
      }),
    )
  }

  const clearCompletedTasks = () => {
    setTasks((previousTasks) =>
      previousTasks.filter((task) => task.status !== "completed"),
    )
  }

  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

  const startOfWeekDate = new Date(today)
  startOfWeekDate.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  startOfWeekDate.setHours(0, 0, 0, 0)

  const endOfWeekDate = new Date(startOfWeekDate)
  endOfWeekDate.setDate(startOfWeekDate.getDate() + 6)
  endOfWeekDate.setHours(23, 59, 59, 999)

  const filteredTasks = tasks.filter((task) => {
    if (taskFilter === "all") {
      return true
    }

    const dueDate = new Date(task.dueDate)

    if (taskFilter === "today") {
      return dueDate >= startOfToday && dueDate <= endOfToday
    }

    if (taskFilter === "week") {
      return dueDate >= startOfWeekDate && dueDate <= endOfWeekDate
    }

    if (taskFilter === "overdue") {
      return task.status === "overdue"
    }

    return true
  })

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.status === "completed").length
  const overdueTasks = tasks.filter((task) => task.status === "overdue").length
  const activeTasks = tasks.filter((task) => task.status !== "completed").length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl custom-scrollbar">
      {/* Header Section */}
      <header className="mb-8 animate-fade-in">
        <div className="flex flex-col gap-6">
          {/* Top bar with greeting and actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500 animate-pulse-soft" />
                <span className="text-sm font-medium text-muted-foreground">{getGreeting()}!</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                <span className="gradient-text">Kế hoạch của tôi</span>
              </h1>
              <p className="text-sm text-muted-foreground max-w-md">
                Quản lý công việc thông minh, theo dõi tiến độ và tập trung với Pomodoro.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleTheme}
                      className="rounded-full hover-lift"
                    >
                      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setIsTimerOpen(true)} 
                      className="rounded-full hover-lift"
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pomodoro Timer <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl+P</kbd></p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setIsExportOpen(true)} 
                      className="rounded-full hover-lift"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Xuất/Nhập dữ liệu <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl+E</kbd></p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button onClick={openNewTaskDialog} className="gap-2 rounded-full hover-lift shadow-lg shadow-primary/25">
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Thêm kế hoạch</span>
                <span className="sm:hidden">Thêm</span>
              </Button>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up">
            <div className="group glass-card rounded-xl p-4 hover-lift cursor-default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Tổng kế hoạch</p>
                  <p className="text-2xl font-bold mt-1">{totalTasks}</p>
                </div>
                <div className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform">
                  <Target className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </div>
              </div>
            </div>
            
            <div className="group glass-card rounded-xl p-4 hover-lift cursor-default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Đang thực hiện</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{activeTasks}</p>
                </div>
                <div className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-900/50 group-hover:scale-110 transition-transform">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="group glass-card rounded-xl p-4 hover-lift cursor-default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Hoàn thành</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completedTasks}</p>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {completionRate}%
                    </span>
                  </div>
                </div>
                <div className="p-2.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>
            
            <div className="group glass-card rounded-xl p-4 hover-lift cursor-default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Quá hạn</p>
                  <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{overdueTasks}</p>
                </div>
                <div className={`p-2.5 rounded-full ${overdueTasks > 0 ? 'bg-red-100 dark:bg-red-900/50 animate-pulse-soft' : 'bg-slate-100 dark:bg-slate-800'} group-hover:scale-110 transition-transform`}>
                  <AlertTriangle className={`h-5 w-5 ${overdueTasks > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Filter section */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between animate-slide-up">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-full">
                {[
                  { key: "all", label: "Tất cả", count: totalTasks },
                  { key: "today", label: "Hôm nay" },
                  { key: "week", label: "Tuần này" },
                  { key: "overdue", label: "Quá hạn", count: overdueTasks },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setTaskFilter(filter.key as "all" | "today" | "week" | "overdue")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                      taskFilter === filter.key
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {filter.label}
                    {filter.count !== undefined && filter.count > 0 && (
                      <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                        taskFilter === filter.key 
                          ? "bg-primary-foreground/20" 
                          : "bg-muted-foreground/20"
                      }`}>
                        {filter.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {completedTasks > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Xóa {completedTasks} đã hoàn thành
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="animate-scale-in">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xóa tất cả kế hoạch đã hoàn thành?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Thao tác này sẽ xóa {completedTasks} kế hoạch đã hoàn thành khỏi danh sách. Bạn không thể hoàn
                      tác sau khi xóa.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={clearCompletedTasks} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </header>

      {/* Tabs Section */}
      <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab} className="w-full animate-fade-in">
        <TabsList className="mb-6 p-1 bg-muted/50 rounded-full w-full sm:w-auto inline-flex">
          <TabsTrigger value="list" className="gap-2 rounded-full data-[state=active]:shadow-sm">
            <ListTodo className="h-4 w-4" />
            <span className="hidden sm:inline">Danh sách</span>
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-2 rounded-full data-[state=active]:shadow-sm">
            <Kanban className="h-4 w-4" />
            <span className="hidden sm:inline">Kanban</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2 rounded-full data-[state=active]:shadow-sm">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Lịch</span>
          </TabsTrigger>
          <TabsTrigger value="grid" className="gap-2 rounded-full data-[state=active]:shadow-sm">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Lưới</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 rounded-full data-[state=active]:shadow-sm">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Thống kê</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-0">
          <TaskList
            tasks={filteredTasks}
            onEdit={openEditTaskDialog}
            onDelete={deleteTask}
            onStatusChange={updateTask}
            onDuplicate={duplicateTask}
            onReminder={openReminderDialog}
            onShare={openShareDialog}
            onSubtaskToggle={updateSubtaskStatus}
          />
        </TabsContent>

        <TabsContent value="kanban" className="mt-0">
          <TaskKanban
            tasks={filteredTasks}
            onEdit={openEditTaskDialog}
            onDelete={deleteTask}
            onStatusChange={updateTask}
            onDuplicate={duplicateTask}
            onReminder={openReminderDialog}
            onShare={openShareDialog}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-0">
          <TaskCalendar tasks={filteredTasks} onEdit={openEditTaskDialog} />
        </TabsContent>

        <TabsContent value="grid" className="mt-0">
          <TaskGrid
            tasks={filteredTasks}
            onEdit={openEditTaskDialog}
            onDelete={deleteTask}
            onStatusChange={updateTask}
            onDuplicate={duplicateTask}
            onReminder={openReminderDialog}
            onShare={openShareDialog}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <TaskAnalytics tasks={tasks} />
        </TabsContent>
      </Tabs>

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={(task) => {
          if (editingTask) {
            updateTask(task)
          } else {
            addTask(task)
          }
        }}
        task={editingTask}
        allTasks={tasks}
      />

      <PomodoroTimer
        open={isTimerOpen}
        onOpenChange={setIsTimerOpen}
        tasks={tasks.filter((task) => task.status !== "completed")}
      />

      <TaskImportExport open={isExportOpen} onOpenChange={setIsExportOpen} tasks={tasks} onImport={setTasks} />

      <TaskReminder
        open={isReminderOpen}
        onOpenChange={setIsReminderOpen}
        task={reminderTask}
        onSave={saveReminderSettings}
      />

      <TaskShare open={isShareOpen} onOpenChange={setIsShareOpen} task={shareTask} />
    </div>
  )
}
