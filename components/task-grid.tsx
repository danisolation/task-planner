"use client"

import { useState } from "react"
// Thêm import Bell
import {
  Clock,
  Edit,
  MoreVertical,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Copy,
  Tag,
  Repeat,
  Bell,
  Share2,
} from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import type { Task } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TaskGridProps {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (task: Task) => void
  onDuplicate: (task: Task) => void
  onReminder: (task: Task) => void
  onShare: (task: Task) => void
}

export function TaskGrid({ tasks, onEdit, onDelete, onStatusChange, onDuplicate, onReminder, onShare }: TaskGridProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.tags && task.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())))

    const matchesStatus =
      filter === "all" ||
      (filter === "completed" && task.status === "completed") ||
      (filter === "incomplete" && task.status === "incomplete") ||
      (filter === "overdue" && task.status === "overdue")

    const matchesTag = !tagFilter || (task.tags && task.tags.includes(tagFilter))

    return matchesSearch && matchesStatus && matchesTag
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Sort by due date (earliest first)
    const dateA = new Date(a.dueDate).getTime()
    const dateB = new Date(b.dueDate).getTime()
    return dateA - dateB
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "incomplete":
        return <Circle className="h-5 w-5 text-slate-400" />
      case "overdue":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Circle className="h-5 w-5 text-slate-400" />
    }
  }

  const toggleTaskStatus = (task: Task) => {
    const newStatus = task.status === "completed" ? "incomplete" : "completed"
    onStatusChange({ ...task, status: newStatus })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "cao":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "trung bình":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "thấp":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
    }
  }

  // Extract all unique tags from tasks
  const allTags = Array.from(new Set(tasks.flatMap((task) => task.tags || [])))

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative max-w-sm group">
          <Input
            placeholder="Tìm kiếm kế hoạch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 pl-4 h-10 rounded-full border-muted-foreground/20 bg-background/50 backdrop-blur-sm focus:bg-background transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-full">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-full transition-all",
              filter === "all" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter("incomplete")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-full transition-all",
              filter === "incomplete" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Chưa xong
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-full transition-all",
              filter === "completed" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Hoàn thành
          </button>
          <button
            onClick={() => setFilter("overdue")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-full transition-all",
              filter === "overdue" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Quá hạn
          </button>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <Badge
            variant={tagFilter === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setTagFilter(null)}
          >
            Tất cả
          </Badge>
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={tagFilter === tag ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTagFilter(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {sortedTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
            <div className="relative p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-full">
              <Circle className="h-12 w-12 text-slate-400 dark:text-slate-500" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchTerm || filter !== "all" || tagFilter
              ? "Không tìm thấy kế hoạch nào"
              : "Chưa có kế hoạch nào"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {searchTerm || filter !== "all" || tagFilter
              ? "Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc"
              : "Bắt đầu bằng cách thêm kế hoạch mới. Nhấn Ctrl+N để thêm nhanh!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {sortedTasks.map((task, index) => (
            <Card
              key={task.id}
              className={cn(
                "transition-all duration-200 hover-lift animate-slide-up",
                task.status === "completed" && "bg-slate-50/80 dark:bg-slate-900/30 opacity-75",
                task.status === "overdue" && "bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800/50",
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <CardTitle
                  className={cn(
                    "text-base font-medium",
                    task.status === "completed" && "line-through text-slate-500 dark:text-slate-400",
                  )}
                >
                  {/* Trong phần CardTitle, thêm biểu tượng Bell sau tiêu đề nếu task có reminder */}
                  <div className="flex items-center gap-2">
                    {task.title}
                    {task.isRecurring && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Repeat className="h-4 w-4 text-blue-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Kế hoạch lặp lại {task.recurringPattern}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {task.reminder?.enabled && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Bell className="h-4 w-4 text-amber-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Nhắc nhở {task.reminder.time}{" "}
                              {task.reminder.unit === "minutes"
                                ? "phút"
                                : task.reminder.unit === "hours"
                                  ? "giờ"
                                  : task.reminder.unit === "days"
                                    ? "ngày"
                                    : "tuần"}{" "}
                              trước khi đến hạn
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Mở menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(task)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Chỉnh sửa
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(task)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Nhân bản
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onReminder(task)}>
                      <Bell className="mr-2 h-4 w-4" />
                      Nhắc nhở
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onShare(task)}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Chia sẻ
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-red-600 dark:text-red-400">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                  {task.description || "Không có mô tả"}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline">{task.category}</Badge>
                  <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                </div>
                {task.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {task.notes && (
                  <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-md text-xs">
                    <p className="line-clamp-2">{task.notes}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Clock className="h-4 w-4" />
                  {format(new Date(task.dueDate), "dd/MM/yyyy", { locale: vi })}
                </div>
                <Button variant="ghost" size="icon" onClick={() => toggleTaskStatus(task)} className="h-8 w-8">
                  {getStatusIcon(task.status)}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
