"use client"

import { useState, useEffect } from "react"
import { PlusCircle, Calendar, ListTodo, LayoutGrid, BarChart3, Clock, Sun, Moon, Download, Kanban } from "lucide-react"
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
import type { Task } from "@/lib/types"
import { TaskReminder } from "./task-reminder"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { TaskShare } from "./task-share"
import { TaskKanban } from "./task-kanban"

export default function TaskPlanner() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isClient, setIsClient] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [activeTab, setActiveTab] = useState("list")
  const [isTimerOpen, setIsTimerOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  // State cho dialog nhắc nhở
  const [isReminderOpen, setIsReminderOpen] = useState(false)
  const [reminderTask, setReminderTask] = useState<Task | null>(null)

  // State cho dialog chia sẻ
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [shareTask, setShareTask] = useState<Task | null>(null)

  // Hook toast
  const { toast } = useToast()

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

    const updatedTasks = tasks.map((task) => {
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
        if (task.reminder?.enabled && task.status !== "completed") {
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
  }, [tasks])

  const addTask = (task: Task) => {
    setTasks([...tasks, task])
  }

  const updateTask = (updatedTask: Task) => {
    setTasks(tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
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
    const newTask = {
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
  const saveReminderSettings = (taskId: string, reminderSettings: any) => {
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

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <header className="py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Kế hoạch của tôi</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsTimerOpen(true)} title="Pomodoro Timer">
              <Clock className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsExportOpen(true)} title="Xuất/Nhập dữ liệu">
              <Download className="h-4 w-4" />
            </Button>
            <Button onClick={openNewTaskDialog} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Thêm kế hoạch
            </Button>
          </div>
        </div>
      </header>

      <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list" className="gap-2">
            <ListTodo className="h-4 w-4" />
            Danh sách
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-2">
            <Kanban className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Lịch
          </TabsTrigger>
          <TabsTrigger value="grid" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Lưới
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Thống kê
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-0">
          <TaskList
            tasks={tasks}
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
            tasks={tasks}
            onEdit={openEditTaskDialog}
            onDelete={deleteTask}
            onStatusChange={updateTask}
            onDuplicate={duplicateTask}
            onReminder={openReminderDialog}
            onShare={openShareDialog}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-0">
          <TaskCalendar tasks={tasks} onEdit={openEditTaskDialog} />
        </TabsContent>

        <TabsContent value="grid" className="mt-0">
          <TaskGrid
            tasks={tasks}
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
