"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Bell,
  Share2,
  Clock,
  Layers,
} from "lucide-react"
import type { Task } from "@/lib/types"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface TaskKanbanProps {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (task: Task) => void
  onDuplicate: (task: Task) => void
  onReminder: (task: Task) => void
  onShare: (task: Task) => void
}

export function TaskKanban({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onDuplicate,
  onReminder,
  onShare,
}: TaskKanbanProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")

  // Lọc và nhóm các task theo trạng thái
  const columns = {
    incomplete: {
      id: "incomplete",
      title: "Chưa hoàn thành",
      tasks: tasks.filter((task) => task.status === "incomplete"),
    },
    inprogress: {
      id: "inprogress",
      title: "Đang thực hiện",
      tasks: tasks.filter(
        (task) => task.status === "incomplete" && task.subTasks?.some((subtask) => subtask.completed),
      ),
    },
    completed: {
      id: "completed",
      title: "Đã hoàn thành",
      tasks: tasks.filter((task) => task.status === "completed"),
    },
    overdue: {
      id: "overdue",
      title: "Quá hạn",
      tasks: tasks.filter((task) => task.status === "overdue"),
    },
  }

  // Xử lý kéo thả
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result

    // Nếu không có điểm đến hoặc điểm đến giống điểm đi, không làm gì cả
    if (!destination || destination.droppableId === source.droppableId) {
      return
    }

    // Tìm task được kéo
    const task = tasks.find((t) => t.id === draggableId)
    if (!task) return

    // Cập nhật trạng thái của task
    let newStatus: "completed" | "incomplete" | "overdue" = "incomplete"

    switch (destination.droppableId) {
      case "completed":
        newStatus = "completed"
        break
      case "incomplete":
      case "inprogress":
        newStatus = "incomplete"
        break
      case "overdue":
        newStatus = "overdue"
        break
    }

    onStatusChange({ ...task, status: newStatus })
  }

  // Tính toán tiến độ công việc con
  const calculateSubtaskProgress = (task: Task) => {
    if (!task.subTasks || task.subTasks.length === 0) return 0
    const completedSubtasks = task.subTasks.filter((subtask) => subtask.completed).length
    return Math.round((completedSubtasks / task.subTasks.length) * 100)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.values(columns).map((column) => (
            <div key={column.id} className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-semibold text-sm">{column.title}</h3>
                <Badge variant="secondary" className="rounded-full px-2.5">
                  {column.tasks.length}
                </Badge>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "min-h-[500px] p-2 rounded-xl transition-all duration-200 custom-scrollbar overflow-y-auto",
                      snapshot.isDraggingOver 
                        ? "bg-primary/5 ring-2 ring-primary/20 ring-dashed"
                        : "bg-muted/30"
                    )}
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "mb-2 shadow-sm transition-all duration-200 border-transparent",
                              snapshot.isDragging && "shadow-lg scale-105 rotate-1 ring-2 ring-primary/30",
                              !snapshot.isDragging && "hover:shadow-md hover:-translate-y-0.5",
                              task.status === "completed" && "bg-slate-50/80 dark:bg-slate-900/50",
                              task.status === "overdue" && "bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800/50",
                            )}
                            style={{
                              ...provided.draggableProps.style,
                              animationDelay: `${index * 50}ms`,
                            }}
                          >
                            <CardHeader className="p-3 pb-0">
                              <div className="flex items-start justify-between">
                                <CardTitle
                                  className={cn(
                                    "text-sm font-medium",
                                    task.status === "completed" && "line-through text-muted-foreground",
                                  )}
                                >
                                  {task.title}
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
                                    <DropdownMenuItem
                                      onClick={() => onDelete(task.id)}
                                      className="text-red-600 dark:text-red-400"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Xóa
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-2">
                              <div className="flex flex-wrap gap-1 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {task.category}
                                </Badge>
                                <Badge className="text-xs">{task.priority}</Badge>
                              </div>

                              {task.subTasks && task.subTasks.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Layers className="h-3 w-3" />
                                      <span>Công việc con</span>
                                    </div>
                                    <span>
                                      {task.subTasks.filter((st) => st.completed).length}/{task.subTasks.length}
                                    </span>
                                  </div>
                                  <Progress value={calculateSubtaskProgress(task)} className="h-1" />
                                </div>
                              )}
                            </CardContent>
                            <CardFooter className="p-3 pt-0 flex justify-between items-center">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                {format(new Date(task.dueDate), "dd/MM/yyyy", { locale: vi })}
                              </div>
                              <div>
                                {task.status === "completed" ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : task.status === "overdue" ? (
                                  <AlertCircle className="h-5 w-5 text-red-500" />
                                ) : (
                                  <Circle className="h-5 w-5 text-slate-400" />
                                )}
                              </div>
                            </CardFooter>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {column.tasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl text-muted-foreground text-sm p-4 transition-all">
                        <Circle className="h-8 w-8 mb-2 opacity-30" />
                        <span className="text-center">Kéo thả kế hoạch vào đây</span>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}
