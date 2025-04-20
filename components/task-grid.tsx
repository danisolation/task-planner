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
      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <Input
          placeholder="Tìm kiếm kế hoạch..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />

        <div className="flex gap-1">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
            Tất cả
          </Button>
          <Button
            variant={filter === "incomplete" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("incomplete")}
          >
            Chưa hoàn thành
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("completed")}
          >
            Đã hoàn thành
          </Button>
          <Button variant={filter === "overdue" ? "default" : "outline"} size="sm" onClick={() => setFilter("overdue")}>
            Quá hạn
          </Button>
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
        <div className="text-center py-10 text-slate-500 dark:text-slate-400">
          {searchTerm || filter !== "all" || tagFilter
            ? "Không tìm thấy kế hoạch nào phù hợp"
            : "Chưa có kế hoạch nào. Hãy thêm kế hoạch mới!"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTasks.map((task) => (
            <Card
              key={task.id}
              className={cn(
                task.status === "completed" && "bg-slate-50 dark:bg-slate-900/30",
                task.status === "overdue" && "bg-red-50 dark:bg-red-900/10",
              )}
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
