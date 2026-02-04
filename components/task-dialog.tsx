"use client";

import { DialogFooter } from "@/components/ui/dialog";

import { useEffect, useState } from "react";
import {
  CalendarIcon,
  Plus,
  X,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Clock,
  Copy,
  CheckCircle2,
  AlertCircle,
  Circle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { v4 as uuidv4 } from "uuid";
import type { Task, SubTask } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Task) => void;
  task: Task | null;
  allTasks: Task[];
}

export function TaskDialog({
  open,
  onOpenChange,
  onSave,
  task,
  allTasks,
}: TaskDialogProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [recurringCustom, setRecurringCustom] = useState({
    frequency: "daily",
    interval: 1,
    weekdays: [] as string[],
    monthDay: 1,
    endType: "never",
    endDate: new Date(),
    endCount: 10,
  });
  const [notes, setNotes] = useState("");
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTask, setNewSubTask] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [expandedSubtasks, setExpandedSubtasks] = useState<
    Record<string, boolean>
  >({});
  const [subtaskFilter, setSubtaskFilter] = useState<
    "all" | "completed" | "incomplete" | "overdue"
  >("all");

  // Sử dụng useForm với defaultValues
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      category: "cá nhân",
      priority: "trung bình",
      dueDate: new Date(),
      timeEstimateType: "fixed",
      timeEstimateHours: "1",
      timeEstimateMinutes: "0",
      energy: "medium",
      recurringEnabled: false,
      recurringPattern: "hàng ngày",
      importance: "5",
      location: "",
      startDate: null as Date | null,
      startTime: "09:00",
      endTime: "10:00",
      allDay: false,
      dependency: "",
    },
  });

  // Reset form when task changes
  useEffect(() => {
    if (open) {
      if (task) {
        form.reset({
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          dueDate: new Date(task.dueDate),
          timeEstimateType: task.timeEstimate?.type || "fixed",
          timeEstimateHours: task.timeEstimate?.hours.toString() || "1",
          timeEstimateMinutes: task.timeEstimate?.minutes.toString() || "0",
          energy: task.energy || "medium",
          recurringEnabled: task.isRecurring || false,
          recurringPattern: task.recurringPattern || "hàng ngày",
          importance: (task.importance || 5).toString(),
          location: task.location || "",
          startDate: task.startDate ? new Date(task.startDate) : null,
          startTime: task.startTime || "09:00",
          endTime: task.endTime || "10:00",
          allDay: task.allDay || false,
          dependency: task.dependencies?.[0] || "",
        });
        setTags(task.tags || []);
        setRecurringCustom(
          task.recurringCustom || {
            frequency: "daily",
            interval: 1,
            weekdays: [],
            monthDay: 1,
            endType: "never",
            endDate: new Date(),
            endCount: 10,
          }
        );
        setNotes(task.notes || "");
        setSubTasks(task.subTasks || []);
      } else {
        form.reset({
          title: "",
          description: "",
          category: "cá nhân",
          priority: "trung bình",
          dueDate: new Date(),
          timeEstimateType: "fixed",
          timeEstimateHours: "1",
          timeEstimateMinutes: "0",
          energy: "medium",
          recurringEnabled: false,
          recurringPattern: "hàng ngày",
          importance: "5",
          location: "",
          startDate: null,
          startTime: "09:00",
          endTime: "10:00",
          allDay: false,
          dependency: "",
        });
        setTags([]);
        setRecurringCustom({
          frequency: "daily",
          interval: 1,
          weekdays: [],
          monthDay: 1,
          endType: "never",
          endDate: new Date(),
          endCount: 10,
        });
        setNotes("");
        setSubTasks([]);
      }
    }
  }, [open, task, form]);

  const addTag = () => {
    if (newTag.trim() !== "" && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const addSubTask = () => {
    if (newSubTask.trim() !== "") {
      const mainTaskDueDate = form.getValues("dueDate");

      setSubTasks([
        ...subTasks,
        {
          id: uuidv4(),
          title: newSubTask.trim(),
          completed: false,
          description: "",
          dueDate: mainTaskDueDate, // Mặc định là deadline của task chính
          priority: "trung bình",
          timeEstimate: 30, // Mặc định 30 phút
        },
      ]);
      setNewSubTask("");
    }
  };

  const toggleSubTaskCompletion = (id: string) => {
    setSubTasks(
      subTasks.map((subtask) =>
        subtask.id === id
          ? { ...subtask, completed: !subtask.completed }
          : subtask
      )
    );
  };

  const removeSubTask = (id: string) => {
    setSubTasks(subTasks.filter((subtask) => subtask.id !== id));
  };

  const moveSubTaskUp = (index: number) => {
    if (index === 0) return;
    const newSubTasks = [...subTasks];
    const temp = newSubTasks[index];
    newSubTasks[index] = newSubTasks[index - 1];
    newSubTasks[index - 1] = temp;
    setSubTasks(newSubTasks);
  };

  const moveSubTaskDown = (index: number) => {
    if (index === subTasks.length - 1) return;
    const newSubTasks = [...subTasks];
    const temp = newSubTasks[index];
    newSubTasks[index] = newSubTasks[index + 1];
    newSubTasks[index + 1] = temp;
    setSubTasks(newSubTasks);
  };

  const toggleSubtaskExpanded = (id: string) => {
    setExpandedSubtasks((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const updateSubtask = (id: string, updates: Partial<SubTask>) => {
    setSubTasks(
      subTasks.map((subtask) =>
        subtask.id === id ? { ...subtask, ...updates } : subtask
      )
    );
  };

  const duplicateSubtask = (subtask: SubTask) => {
    const newSubtask = {
      ...subtask,
      id: uuidv4(),
      title: `${subtask.title} (Bản sao)`,
      completed: false,
    };
    setSubTasks([...subTasks, newSubtask]);
  };

  // Check if subtask is overdue
  const isSubtaskOverdue = (subtask: SubTask) => {
    if (!subtask.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(subtask.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return !subtask.completed && dueDate < today;
  };

  // Filter subtasks
  const filteredSubtasks = subTasks.filter((subtask) => {
    if (subtaskFilter === "all") return true;
    if (subtaskFilter === "completed") return subtask.completed;
    if (subtaskFilter === "incomplete")
      return !subtask.completed && !isSubtaskOverdue(subtask);
    if (subtaskFilter === "overdue") return isSubtaskOverdue(subtask);
    return true;
  });

  // Calculate subtask stats
  const subtaskStats = {
    total: subTasks.length,
    completed: subTasks.filter((st) => st.completed).length,
    incomplete: subTasks.filter((st) => !st.completed && !isSubtaskOverdue(st))
      .length,
    overdue: subTasks.filter((st) => isSubtaskOverdue(st)).length,
  };

  const onSubmit = (data: any) => {
    try {
      const newTask: Task = {
        id: task?.id || uuidv4(),
        title: data.title,
        description: data.description || "",
        category: data.category,
        priority: data.priority,
        dueDate: data.dueDate,
        status: task?.status || "incomplete",
        tags: tags,
        isRecurring: Boolean(data.recurringEnabled),
        recurringPattern: data.recurringEnabled
          ? data.recurringPattern
          : undefined,
        recurringCustom:
          data.recurringEnabled && data.recurringPattern === "tùy chỉnh"
            ? recurringCustom
            : undefined,
        notes: notes.trim() !== "" ? notes : undefined,
        importance: Number(data.importance),
        subTasks: subTasks.length > 0 ? subTasks : undefined,
        timeEstimate: {
          hours: Number(data.timeEstimateHours || 0),
          minutes: Number(data.timeEstimateMinutes || 0),
          type: (data.timeEstimateType || "fixed") as "fixed" | "flexible",
        },
        dependencies:
          data.dependency && data.dependency !== "none"
            ? [data.dependency]
            : undefined,
        startDate: data.startDate,
        startTime: data.startTime,
        endTime: data.endTime,
        allDay: Boolean(data.allDay),
        energy: data.energy,
        location:
          data.location && data.location.trim() !== ""
            ? data.location
            : undefined,
      };

      onSave(newTask);
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  // Lọc danh sách task để tránh phụ thuộc vòng tròn
  const availableDependencyTasks = allTasks.filter(
    (t) => t.id !== task?.id && !t.dependencies?.includes(task?.id || "")
  );

  // Tính toán thời gian dự kiến hoàn thành
  const calculateEstimatedCompletionTime = () => {
    const dueDate = form.getValues("dueDate");
    const timeEstimateType = form.getValues("timeEstimateType");
    const timeEstimateHours = Number.parseInt(
      form.getValues("timeEstimateHours") || "0"
    );
    const timeEstimateMinutes = Number.parseInt(
      form.getValues("timeEstimateMinutes") || "0"
    );

    if (timeEstimateType === "fixed") {
      const totalMinutes = timeEstimateHours * 60 + timeEstimateMinutes;
      const completionDate = new Date(dueDate);
      completionDate.setMinutes(completionDate.getMinutes() - totalMinutes);
      return format(completionDate, "dd/MM/yyyy HH:mm", { locale: vi });
    } else {
      return "Không xác định (ước tính linh hoạt)";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto custom-scrollbar animate-scale-in">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            {task ? (
              <>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                  <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                Chỉnh sửa kế hoạch
              </>
            ) : (
              <>
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                  <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                Thêm kế hoạch mới
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {task
              ? "Chỉnh sửa thông tin kế hoạch của bạn"
              : "Điền thông tin để tạo kế hoạch mới"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 p-1 bg-muted/50 rounded-lg">
                <TabsTrigger value="general">Thông tin chung</TabsTrigger>
                <TabsTrigger value="schedule">Lịch trình</TabsTrigger>
                <TabsTrigger value="subtasks">
                  Công việc con {subTasks.length > 0 && `(${subTasks.length})`}
                </TabsTrigger>
                <TabsTrigger value="advanced">Nâng cao</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Tiêu đề
                  </label>
                  <Input
                    id="title"
                    placeholder="Nhập tiêu đề kế hoạch"
                    {...form.register("title", { required: true })}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-red-500">
                      Tiêu đề không được để trống
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Mô tả
                  </label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả chi tiết về kế hoạch của bạn"
                    className="resize-none"
                    {...form.register("description")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium">
                      Danh mục
                    </label>
                    <select
                      id="category"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...form.register("category")}
                    >
                      <option value="cá nhân">Cá nhân</option>
                      <option value="công việc">Công việc</option>
                      <option value="học tập">Học tập</option>
                      <option value="gia đình">Gia đình</option>
                      <option value="sức khỏe">Sức khỏe</option>
                      <option value="tài chính">Tài chính</option>
                      <option value="khác">Khác</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="priority" className="text-sm font-medium">
                      Mức độ ưu tiên
                    </label>
                    <select
                      id="priority"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...form.register("priority")}
                    >
                      <option value="cao">Cao</option>
                      <option value="trung bình">Trung bình</option>
                      <option value="thấp">Thấp</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="importance" className="text-sm font-medium">
                    Mức độ quan trọng
                  </label>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Ít quan trọng</span>
                      <span>Rất quan trọng</span>
                    </div>
                    <select
                      id="importance"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...form.register("importance")}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                        <option key={value} value={value.toString()}>
                          {value}
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-between text-xs">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                        <span
                          key={value}
                          className={cn(
                            Number(form.watch("importance")) === value
                              ? "font-bold"
                              : ""
                          )}
                        >
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="dueDate" className="text-sm font-medium">
                    Hạn chót
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !form.watch("dueDate") && "text-muted-foreground"
                        )}
                      >
                        {form.watch("dueDate") ? (
                          format(form.watch("dueDate"), "dd/MM/yyyy", {
                            locale: vi,
                          })
                        ) : (
                          <span>Chọn ngày</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.watch("dueDate") || undefined}
                        onSelect={(date) => {
                          if (date) {
                            form.setValue("dueDate", date);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium">
                    Vị trí
                  </label>
                  <Input
                    id="location"
                    placeholder="Nhập vị trí thực hiện kế hoạch (nếu có)"
                    {...form.register("location")}
                  />
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="startDate" className="text-sm font-medium">
                      Ngày bắt đầu
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !form.watch("startDate") && "text-muted-foreground"
                          )}
                        >
                          {form.watch("startDate") ? (
                            format(
                              form.watch("startDate") || new Date(),
                              "dd/MM/yyyy",
                              {
                                locale: vi,
                              }
                            )
                          ) : (
                            <span>Chọn ngày</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.watch("startDate") || undefined}
                          onSelect={(date) => {
                            if (date) {
                              form.setValue("startDate", date);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="allDay" className="text-sm font-medium">
                      Cả ngày
                    </label>
                    <div className="flex items-center space-x-2 h-10">
                      <input
                        type="checkbox"
                        id="allDay"
                        className="h-4 w-4"
                        {...form.register("allDay")}
                      />
                      <span className="text-sm text-muted-foreground">
                        {form.watch("allDay")
                          ? "Kế hoạch kéo dài cả ngày"
                          : "Kế hoạch có thời gian cụ thể"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="recurringEnabled"
                    className="text-sm font-medium"
                  >
                    Lặp lại
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="recurringEnabled"
                      className="h-4 w-4"
                      {...form.register("recurringEnabled")}
                    />
                    <span className="text-sm text-muted-foreground">
                      {form.watch("recurringEnabled")
                        ? "Kế hoạch lặp lại"
                        : "Kế hoạch không lặp lại"}
                    </span>
                  </div>
                </div>

                {!form.watch("allDay") && form.watch("startDate") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="startTime"
                        className="text-sm font-medium"
                      >
                        Thời gian bắt đầu
                      </label>
                      <Input
                        id="startTime"
                        type="time"
                        {...form.register("startTime")}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="endTime" className="text-sm font-medium">
                        Thời gian kết thúc
                      </label>
                      <Input
                        id="endTime"
                        type="time"
                        {...form.register("endTime")}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Ước tính thời gian
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="fixed"
                        value="fixed"
                        {...form.register("timeEstimateType")}
                        className="h-4 w-4"
                      />
                      <label htmlFor="fixed">Cố định</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="flexible"
                        value="flexible"
                        {...form.register("timeEstimateType")}
                        className="h-4 w-4"
                      />
                      <label htmlFor="flexible">Linh hoạt</label>
                    </div>
                  </div>
                </div>

                {form.watch("timeEstimateType") === "fixed" && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="timeEstimateHours"
                        className="text-sm font-medium"
                      >
                        Giờ
                      </label>
                      <select
                        id="timeEstimateHours"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...form.register("timeEstimateHours")}
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i.toString()}>
                            {i}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="timeEstimateMinutes"
                        className="text-sm font-medium"
                      >
                        Phút
                      </label>
                      <select
                        id="timeEstimateMinutes"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...form.register("timeEstimateMinutes")}
                      >
                        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(
                          (value) => (
                            <option key={value} value={value.toString()}>
                              {value}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                )}

                {form.watch("timeEstimateType") === "fixed" && (
                  <div className="text-sm text-muted-foreground mt-2">
                    Thời gian dự kiến hoàn thành:{" "}
                    {calculateEstimatedCompletionTime()}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="energy" className="text-sm font-medium">
                    Mức năng lượng cần thiết
                  </label>
                  <select
                    id="energy"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...form.register("energy")}
                  >
                    <option value="high">Cao (Tập trung cao độ)</option>
                    <option value="medium">
                      Trung bình (Tập trung vừa phải)
                    </option>
                    <option value="low">Thấp (Có thể làm khi mệt mỏi)</option>
                  </select>
                </div>

                {form.watch("recurringEnabled") && (
                  <div className="space-y-2">
                    <label
                      htmlFor="recurringPattern"
                      className="text-sm font-medium"
                    >
                      Chu kỳ lặp lại
                    </label>
                    <select
                      id="recurringPattern"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...form.register("recurringPattern")}
                    >
                      <option value="hàng ngày">Hàng ngày</option>
                      <option value="hàng tuần">Hàng tuần</option>
                      <option value="hàng tháng">Hàng tháng</option>
                      <option value="hàng quý">Hàng quý</option>
                      <option value="hàng năm">Hàng năm</option>
                      <option value="tùy chỉnh">Tùy chỉnh</option>
                    </select>
                  </div>
                )}

                {form.watch("recurringEnabled") &&
                  form.watch("recurringPattern") === "tùy chỉnh" && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Tùy chỉnh lặp lại
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Tần suất
                          </label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={recurringCustom.frequency}
                            onChange={(e) =>
                              setRecurringCustom((prev) => ({
                                ...prev,
                                frequency: e.target.value,
                              }))
                            }
                          >
                            <option value="daily">Hàng ngày</option>
                            <option value="weekly">Hàng tuần</option>
                            <option value="monthly">Hàng tháng</option>
                            <option value="yearly">Hàng năm</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Lặp lại mỗi
                          </label>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              min="1"
                              value={recurringCustom.interval}
                              onChange={(e) =>
                                setRecurringCustom((prev) => ({
                                  ...prev,
                                  interval:
                                    Number.parseInt(e.target.value) || 1,
                                }))
                              }
                              className="w-20"
                            />
                            <span>
                              {recurringCustom.frequency === "daily"
                                ? "ngày"
                                : recurringCustom.frequency === "weekly"
                                ? "tuần"
                                : recurringCustom.frequency === "monthly"
                                ? "tháng"
                                : "năm"}
                            </span>
                          </div>
                        </div>

                        {recurringCustom.frequency === "weekly" && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Vào các ngày
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(
                                (day, index) => (
                                  <Badge
                                    key={index}
                                    variant={
                                      recurringCustom.weekdays.includes(
                                        index.toString()
                                      )
                                        ? "default"
                                        : "outline"
                                    }
                                    className="cursor-pointer"
                                    onClick={() => {
                                      const weekdays = [
                                        ...recurringCustom.weekdays,
                                      ];
                                      const dayIndex = weekdays.indexOf(
                                        index.toString()
                                      );
                                      if (dayIndex >= 0) {
                                        weekdays.splice(dayIndex, 1);
                                      } else {
                                        weekdays.push(index.toString());
                                      }
                                      setRecurringCustom((prev) => ({
                                        ...prev,
                                        weekdays,
                                      }));
                                    }}
                                  >
                                    {day}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {recurringCustom.frequency === "monthly" && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Vào ngày
                            </label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={recurringCustom.monthDay.toString()}
                              onChange={(e) =>
                                setRecurringCustom((prev) => ({
                                  ...prev,
                                  monthDay: Number.parseInt(e.target.value),
                                }))
                              }
                            >
                              {Array.from({ length: 31 }, (_, i) => (
                                <option key={i + 1} value={(i + 1).toString()}>
                                  {i + 1}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <Separator />

                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Kết thúc
                          </label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="never"
                                name="endType"
                                value="never"
                                checked={recurringCustom.endType === "never"}
                                onChange={() =>
                                  setRecurringCustom((prev) => ({
                                    ...prev,
                                    endType: "never",
                                  }))
                                }
                                className="h-4 w-4"
                              />
                              <label htmlFor="never" className="text-sm">
                                Không bao giờ
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="after"
                                name="endType"
                                value="after"
                                checked={recurringCustom.endType === "after"}
                                onChange={() =>
                                  setRecurringCustom((prev) => ({
                                    ...prev,
                                    endType: "after",
                                  }))
                                }
                                className="h-4 w-4"
                              />
                              <label htmlFor="after" className="text-sm">
                                Sau
                              </label>
                              <Input
                                type="number"
                                min="1"
                                value={recurringCustom.endCount}
                                onChange={(e) =>
                                  setRecurringCustom((prev) => ({
                                    ...prev,
                                    endCount:
                                      Number.parseInt(e.target.value) || 1,
                                  }))
                                }
                                className="w-16 ml-2"
                                disabled={recurringCustom.endType !== "after"}
                              />
                              <span>lần</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="on"
                                name="endType"
                                value="on"
                                checked={recurringCustom.endType === "on"}
                                onChange={() =>
                                  setRecurringCustom((prev) => ({
                                    ...prev,
                                    endType: "on",
                                  }))
                                }
                                className="h-4 w-4"
                              />
                              <label htmlFor="on" className="text-sm">
                                Vào ngày
                              </label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "ml-2",
                                      recurringCustom.endType !== "on" &&
                                        "opacity-50"
                                    )}
                                    disabled={recurringCustom.endType !== "on"}
                                  >
                                    {format(
                                      recurringCustom.endDate,
                                      "dd/MM/yyyy",
                                      { locale: vi }
                                    )}
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={recurringCustom.endDate}
                                    onSelect={(date) =>
                                      setRecurringCustom((prev) => ({
                                        ...prev,
                                        endDate: date || new Date(),
                                      }))
                                    }
                                    disabled={recurringCustom.endType !== "on"}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </TabsContent>

              <TabsContent value="subtasks" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Công việc con</label>
                    <div className="flex gap-1">
                      <Button
                        variant={
                          subtaskFilter === "all" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setSubtaskFilter("all")}
                      >
                        Tất cả ({subtaskStats.total})
                      </Button>
                      <Button
                        variant={
                          subtaskFilter === "completed" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setSubtaskFilter("completed")}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        {subtaskStats.completed}
                      </Button>
                      <Button
                        variant={
                          subtaskFilter === "incomplete" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setSubtaskFilter("incomplete")}
                      >
                        <Circle className="h-4 w-4 mr-1" />
                        {subtaskStats.incomplete}
                      </Button>
                      <Button
                        variant={
                          subtaskFilter === "overdue" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setSubtaskFilter("overdue")}
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {subtaskStats.overdue}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Thêm công việc con mới"
                      value={newSubTask}
                      onChange={(e) => setNewSubTask(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSubTask();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button type="button" onClick={addSubTask}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {subTasks.length > 0 ? (
                  <div className="space-y-2">
                    {filteredSubtasks.map((subtask, index) => (
                      <Card
                        key={subtask.id}
                        className={cn(subtask.completed && "bg-muted/30")}
                      >
                        <CardHeader className="p-3 pb-0">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={subtask.completed}
                              onCheckedChange={() =>
                                toggleSubTaskCompletion(subtask.id)
                              }
                            />
                            <div
                              className={cn(
                                "flex-1 font-medium",
                                subtask.completed &&
                                  "line-through text-muted-foreground"
                              )}
                            >
                              {subtask.title}
                            </div>
                            <div className="flex items-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  toggleSubtaskExpanded(subtask.id)
                                }
                                className="h-8 w-8"
                              >
                                {expandedSubtasks[subtask.id] ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {subtask.priority && (
                              <Badge
                                className={cn(
                                  "text-xs",
                                  subtask.priority === "cao"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                    : subtask.priority === "trung bình"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                    : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                )}
                              >
                                {subtask.priority}
                              </Badge>
                            )}
                            {subtask.dueDate && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs flex items-center gap-1",
                                  isSubtaskOverdue(subtask) &&
                                    "border-red-500 text-red-500"
                                )}
                              >
                                <Clock className="h-3 w-3" />
                                {format(
                                  new Date(subtask.dueDate),
                                  "dd/MM/yyyy",
                                  { locale: vi }
                                )}
                                {isSubtaskOverdue(subtask) && (
                                  <AlertTriangle className="h-3 w-3 text-red-500" />
                                )}
                              </Badge>
                            )}
                            {subtask.timeEstimate && (
                              <Badge
                                variant="secondary"
                                className="text-xs flex items-center gap-1"
                              >
                                <Clock className="h-3 w-3" />
                                {subtask.timeEstimate} phút
                              </Badge>
                            )}
                          </div>
                        </CardHeader>

                        <Collapsible open={expandedSubtasks[subtask.id]}>
                          <CollapsibleContent>
                            <CardContent className="p-3 pt-2 space-y-3">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">
                                  Mô tả
                                </label>
                                <Textarea
                                  placeholder="Mô tả chi tiết công việc con"
                                  value={subtask.description || ""}
                                  onChange={(e) =>
                                    updateSubtask(subtask.id, {
                                      description: e.target.value,
                                    })
                                  }
                                  className="resize-none"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Hạn chót
                                  </label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant={"outline"}
                                        className="w-full pl-3 text-left font-normal"
                                      >
                                        {subtask.dueDate ? (
                                          format(
                                            new Date(subtask.dueDate),
                                            "dd/MM/yyyy",
                                            { locale: vi }
                                          )
                                        ) : (
                                          <span>Chọn ngày</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      className="w-auto p-0"
                                      align="start"
                                    >
                                      <Calendar
                                        mode="single"
                                        selected={
                                          subtask.dueDate
                                            ? new Date(subtask.dueDate)
                                            : undefined
                                        }
                                        onSelect={(date) => {
                                          if (date) {
                                            updateSubtask(subtask.id, {
                                              dueDate: date,
                                            });
                                          }
                                        }}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Mức độ ưu tiên
                                  </label>
                                  <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={subtask.priority || "trung bình"}
                                    onChange={(e) =>
                                      updateSubtask(subtask.id, {
                                        priority: e.target.value,
                                      })
                                    }
                                  >
                                    <option value="cao">Cao</option>
                                    <option value="trung bình">
                                      Trung bình
                                    </option>
                                    <option value="thấp">Thấp</option>
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">
                                  Ước tính thời gian (phút)
                                </label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={subtask.timeEstimate || 30}
                                  onChange={(e) =>
                                    updateSubtask(subtask.id, {
                                      timeEstimate:
                                        Number(e.target.value) || 30,
                                    })
                                  }
                                />
                              </div>

                              <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => duplicateSubtask(subtask)}
                                  >
                                    <Copy className="h-4 w-4 mr-1" />
                                    Nhân bản
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => moveSubTaskUp(index)}
                                    disabled={index === 0}
                                    className="h-8 w-8"
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => moveSubTaskDown(index)}
                                    disabled={index === subTasks.length - 1}
                                    className="h-8 w-8"
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeSubTask(subtask.id)}
                                    className="h-8 w-8 text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    ))}

                    {filteredSubtasks.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        Không có công việc con nào phù hợp với bộ lọc hiện tại
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {subtaskStats.completed} / {subtaskStats.total} công
                        việc đã hoàn thành
                      </div>
                      <Progress
                        value={
                          subtaskStats.total > 0
                            ? (subtaskStats.completed / subtaskStats.total) *
                              100
                            : 0
                        }
                        className="w-1/3 h-2"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border rounded-md">
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Chưa có công việc con nào</p>
                    <p className="text-sm">
                      Thêm công việc con để chia nhỏ kế hoạch của bạn
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nhãn</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Thêm nhãn mới"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button type="button" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} className="flex items-center gap-1">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="dependency" className="text-sm font-medium">
                    Phụ thuộc
                  </label>
                  <select
                    id="dependency"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...form.register("dependency")}
                  >
                    <option value="none">Không có phụ thuộc</option>
                    {availableDependencyTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                  {form.watch("dependency") &&
                    form.watch("dependency") !== "none" && (
                      <div className="text-sm text-muted-foreground">
                        Kế hoạch này sẽ chỉ có thể bắt đầu sau khi kế hoạch phụ
                        thuộc đã hoàn thành.
                      </div>
                    )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ghi chú</label>
                  <Textarea
                    placeholder="Thêm ghi chú cho kế hoạch này"
                    className="resize-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="submit">
                {task ? "Lưu thay đổi" : "Thêm kế hoạch"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
