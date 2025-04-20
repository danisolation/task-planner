"use client"

import { useState } from "react"
import {
  Clock,
  Edit,
  MoreVertical,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Circle,
  Copy,
  Tag,
  Repeat,
  Bell,
  Share2,
  ChevronRight,
  ChevronDown,
  Layers,
} from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import type { Task } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"

interface TaskListProps {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (task: Task) => void
  onDuplicate: (task: Task) => void
  onReminder: (task: Task) => void
  onShare: (task: Task) => void
  onSubtaskToggle: (taskId: string, subtaskId: string, completed: boolean) => void
}

export function TaskList({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onDuplicate,
  onReminder,
  onShare,
  onSubtaskToggle,
}: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({})

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.tags && task.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())))

    const matchesTag = !tagFilter || (task.tags && task.tags.includes(tagFilter))

    return matchesSearch && matchesTag
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Sort by status (incomplete first)
    if (a.status !== b.status) {
      return a.status === "incomplete" ? -1 : 1
    }

    // Then sort by due date (earliest first)
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

  // Toggle task expansion
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }))
  }

  // Calculate subtask progress
  const calculateSubtaskProgress = (task: Task) => {
    if (!task.subTasks || task.subTasks.length === 0) return 0
    const completedSubtasks = task.subTasks.filter((subtask) => subtask.completed).length
    return Math.round((completedSubtasks / task.subTasks.length) * 100)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <div className="relative max-w-sm">
          <Input
            placeholder="Tìm kiếm kế hoạch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
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
      </div>

      {sortedTasks.length === 0 ? (
        <div className="text-center py-10 text-slate-500 dark:text-slate-400">
          {searchTerm || tagFilter
            ? "Không tìm thấy kế hoạch nào phù hợp"
            : "Chưa có kế hoạch nào. Hãy thêm kế hoạch mới!"}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Trạng thái</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead className="hidden md:table-cell">Danh mục</TableHead>
                <TableHead className="hidden md:table-cell">Mức độ</TableHead>
                <TableHead className="hidden md:table-cell">Hạn chót</TableHead>
                <TableHead className="hidden md:table-cell">Nhãn</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTasks.map((task) => (
                <>
                  <TableRow
                    key={task.id}
                    className={cn(
                      task.status === "completed" && "bg-slate-50 dark:bg-slate-900/30",
                      task.status === "overdue" && "bg-red-50 dark:bg-red-900/10",
                    )}
                  >
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => toggleTaskStatus(task)} className="h-8 w-8">
                        {getStatusIcon(task.status)}
                      </Button>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "font-medium",
                        task.status === "completed" && "line-through text-slate-500 dark:text-slate-400",
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          {task.subTasks && task.subTasks.length > 0 ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0"
                              onClick={() => toggleTaskExpansion(task.id)}
                            >
                              {expandedTasks[task.id] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          ) : (
                            <span className="w-5"></span>
                          )}
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
                        <p className="text-sm text-slate-500 dark:text-slate-400 md:hidden mt-1 line-clamp-1">
                          {format(new Date(task.dueDate), "dd/MM/yyyy", { locale: vi })}
                        </p>

                        {task.subTasks && task.subTasks.length > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <Layers className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-500">
                              {task.subTasks.filter((st) => st.completed).length}/{task.subTasks.length} công việc con
                            </span>
                            <Progress value={calculateSubtaskProgress(task)} className="h-1 flex-1" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{task.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-500" />
                        {format(new Date(task.dueDate), "dd/MM/yyyy", { locale: vi })}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {task.tags &&
                          task.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {tag}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell>
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
                          <DropdownMenuItem
                            onClick={() => onDelete(task.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>

                  {/* Subtasks */}
                  {task.subTasks && task.subTasks.length > 0 && expandedTasks[task.id] && (
                    <>
                      {task.subTasks.map((subtask) => (
                        <TableRow key={`${task.id}-${subtask.id}`} className="bg-muted/30 border-t-0">
                          <TableCell></TableCell>
                          <TableCell colSpan={5}>
                            <div className="flex items-center gap-2 pl-7">
                              <Checkbox
                                checked={subtask.completed}
                                onCheckedChange={(checked) => onSubtaskToggle(task.id, subtask.id, !!checked)}
                              />
                              <span
                                className={cn("text-sm", subtask.completed && "line-through text-muted-foreground")}
                              >
                                {subtask.title}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
