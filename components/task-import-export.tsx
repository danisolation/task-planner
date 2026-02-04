"use client"

import { useState, useEffect } from "react"
import { Download, Upload, FileJson, FileText, FileSpreadsheet, Database, Save, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import type { Task } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface TaskImportExportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tasks: Task[]
  onImport: (tasks: Task[]) => void
}

export function TaskImportExport({ open, onOpenChange, tasks, onImport }: TaskImportExportProps) {
  const [activeTab, setActiveTab] = useState("export")
  const [exportFormat, setExportFormat] = useState("json")
  const [importData, setImportData] = useState("")
  const [importFormat, setImportFormat] = useState("json")
  const [importMode, setImportMode] = useState("merge")
  const [importError, setImportError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [autoBackup, setAutoBackup] = useState(false)
  const [backupInterval, setBackupInterval] = useState("daily")
  const [lastBackup, setLastBackup] = useState<string | null>(null)

  // Thêm useEffect để load từ localStorage khi ở phía client:
  useEffect(() => {
    setIsClient(true)

    const savedAutoBackup = localStorage.getItem("autoBackup")
    setAutoBackup(savedAutoBackup ? savedAutoBackup === "true" : false)

    const savedBackupInterval = localStorage.getItem("backupInterval")
    setBackupInterval(savedBackupInterval || "daily")

    const savedLastBackup = localStorage.getItem("lastBackup")
    setLastBackup(savedLastBackup || null)
  }, [])

  // Lưu cài đặt sao lưu tự động
  const saveBackupSettings = () => {
    if (isClient) {
      localStorage.setItem("autoBackup", autoBackup.toString())
      localStorage.setItem("backupInterval", backupInterval)
    }
  }

  // Xuất dữ liệu
  const exportData = () => {
    let content = ""
    let filename = `tasks-${format(new Date(), "yyyy-MM-dd")}`
    let type = ""

    switch (exportFormat) {
      case "json":
        content = JSON.stringify(tasks, null, 2)
        filename += ".json"
        type = "application/json"
        break
      case "csv":
        // Tạo header
        content = "id,title,description,category,priority,dueDate,status,tags,isRecurring,recurringPattern,notes\n"

        // Thêm dữ liệu
        tasks.forEach((task) => {
          content +=
            [
              task.id,
              `"${task.title.replace(/"/g, '""')}"`,
              `"${task.description.replace(/"/g, '""')}"`,
              `"${task.category}"`,
              `"${task.priority}"`,
              new Date(task.dueDate).toISOString(),
              task.status,
              task.tags ? `"${task.tags.join(",")}"` : "",
              task.isRecurring ? "true" : "false",
              task.recurringPattern ? `"${task.recurringPattern}"` : "",
              task.notes ? `"${task.notes.replace(/"/g, '""')}"` : "",
            ].join(",") + "\n"
        })

        filename += ".csv"
        type = "text/csv"
        break
      case "text":
        tasks.forEach((task) => {
          content += `Tiêu đề: ${task.title}\n`
          content += `Mô tả: ${task.description}\n`
          content += `Danh mục: ${task.category}\n`
          content += `Mức độ ưu tiên: ${task.priority}\n`
          content += `Hạn chót: ${format(new Date(task.dueDate), "dd/MM/yyyy HH:mm", { locale: vi })}\n`
          content += `Trạng thái: ${
            task.status === "completed" ? "Hoàn thành" : task.status === "incomplete" ? "Chưa hoàn thành" : "Quá hạn"
          }\n`

          if (task.tags && task.tags.length > 0) {
            content += `Nhãn: ${task.tags.join(", ")}\n`
          }

          if (task.isRecurring) {
            content += `Lặp lại: ${task.recurringPattern}\n`
          }

          if (task.notes) {
            content += `Ghi chú: ${task.notes}\n`
          }

          content += "\n---\n\n"
        })

        filename += ".txt"
        type = "text/plain"
        break
      case "excel":
        // Tạo header
        content =
          "id\ttitle\tdescription\tcategory\tpriority\tdueDate\tstatus\ttags\tisRecurring\trecurringPattern\tnotes\n"

        // Thêm dữ liệu
        tasks.forEach((task) => {
          content +=
            [
              task.id,
              task.title.replace(/\t/g, " "),
              task.description.replace(/\t/g, " "),
              task.category,
              task.priority,
              new Date(task.dueDate).toISOString(),
              task.status,
              task.tags ? task.tags.join(",") : "",
              task.isRecurring ? "true" : "false",
              task.recurringPattern || "",
              task.notes ? task.notes.replace(/\t/g, " ") : "",
            ].join("\t") + "\n"
        })

        filename += ".tsv"
        type = "text/tab-separated-values"
        break
    }

    if (content && type) {
      const blob = new Blob([content], { type })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  // Nhập dữ liệu
  const importDataHandler = () => {
    try {
      setImportError(null)
      let parsedData: Task[] = []

      switch (importFormat) {
        case "json":
          parsedData = JSON.parse(importData)

          // Kiểm tra dữ liệu
          if (!Array.isArray(parsedData)) {
            throw new Error("Dữ liệu không hợp lệ. Dữ liệu phải là một mảng các kế hoạch.")
          }

          // Kiểm tra cấu trúc của mỗi task
          parsedData.forEach((task) => {
            if (!task.id || !task.title || !task.dueDate) {
              throw new Error("Dữ liệu không hợp lệ. Mỗi kế hoạch phải có id, title và dueDate.")
            }
          })
          break

        case "csv":
          // Phân tích CSV
          const lines = importData.split("\n")
          const headers = lines[0].split(",")

          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue

            const values = lines[i].split(",")
            const task: any = {}

            headers.forEach((header, index) => {
              let value = values[index] || ""

              // Xử lý giá trị trong dấu ngoặc kép
              if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1).replace(/""/g, '"')
              }

              // Chuyển đổi kiểu dữ liệu
              if (header === "isRecurring") {
                task[header] = value === "true"
              } else if (header === "tags" && value) {
                task[header] = value.split(",")
              } else if (header === "dueDate") {
                task[header] = new Date(value)
              } else {
                task[header] = value
              }
            })

            parsedData.push(task as Task)
          }
          break

        case "text":
          // Phân tích văn bản thuần
          const taskBlocks = importData.split("---").filter((block) => block.trim())

          taskBlocks.forEach((block) => {
            const lines = block.trim().split("\n")
            const task: any = {
              id: crypto.randomUUID(),
              status: "incomplete",
            }

            lines.forEach((line) => {
              const [key, ...valueParts] = line.split(":")
              const value = valueParts.join(":").trim()

              if (key && value) {
                switch (key.trim()) {
                  case "Tiêu đề":
                    task.title = value
                    break
                  case "Mô tả":
                    task.description = value
                    break
                  case "Danh mục":
                    task.category = value
                    break
                  case "Mức độ ưu tiên":
                    task.priority = value
                    break
                  case "Hạn chót":
                    // Chuyển đổi định dạng ngày tháng
                    const parts = value.split(" ")[0].split("/")
                    const time = value.split(" ")[1] || "00:00"
                    task.dueDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${time}`)
                    break
                  case "Trạng thái":
                    task.status = value === "Hoàn thành" ? "completed" : value === "Quá hạn" ? "overdue" : "incomplete"
                    break
                  case "Nhãn":
                    task.tags = value.split(",").map((tag) => tag.trim())
                    break
                  case "Lặp lại":
                    task.isRecurring = true
                    task.recurringPattern = value
                    break
                  case "Ghi chú":
                    task.notes = value
                    break
                }
              }
            })

            if (task.title && task.dueDate) {
              parsedData.push(task as Task)
            }
          })
          break
      }

      // Xử lý dữ liệu đã phân tích
      if (parsedData.length > 0) {
        if (importMode === "replace") {
          onImport(parsedData)
        } else {
          // Gộp dữ liệu, tránh trùng lặp dựa trên ID
          const existingIds = new Set(tasks.map((task) => task.id))
          const newTasks = parsedData.filter((task) => !existingIds.has(task.id))
          onImport([...tasks, ...newTasks])
        }

        setImportData("")
        setActiveTab("export")
      } else {
        throw new Error("Không tìm thấy dữ liệu hợp lệ để nhập.")
      }
    } catch (error) {
      console.error("Import error:", error)
      setImportError(error instanceof Error ? error.message : "Lỗi không xác định khi nhập dữ liệu.")
    }
  }

  // Sao lưu dữ liệu
  const backupData = () => {
    const backup = JSON.stringify(tasks)
    localStorage.setItem("tasksBackup", backup)
    localStorage.setItem("lastBackup", new Date().toISOString())
    setLastBackup(new Date().toISOString())
  }

  // Khôi phục dữ liệu
  const restoreBackup = () => {
    try {
      const backup = localStorage.getItem("tasksBackup")
      if (backup) {
        const parsedData = JSON.parse(backup)
        onImport(parsedData)
      } else {
        setImportError("Không tìm thấy bản sao lưu nào.")
      }
    } catch (error) {
      console.error("Restore error:", error)
      setImportError(error instanceof Error ? error.message : "Lỗi không xác định khi khôi phục dữ liệu.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] animate-scale-in">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Quản lý dữ liệu
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 p-1 bg-muted/50 rounded-lg">
            <TabsTrigger value="export" className="rounded-md">
              <Download className="h-4 w-4 mr-2" />
              Xuất
            </TabsTrigger>
            <TabsTrigger value="import" className="rounded-md">
              <Upload className="h-4 w-4 mr-2" />
              Nhập
            </TabsTrigger>
            <TabsTrigger value="backup" className="rounded-md">
              <Save className="h-4 w-4 mr-2" />
              Sao lưu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Định dạng xuất</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Chọn định dạng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4 text-amber-500" />
                      JSON
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                      CSV
                    </div>
                  </SelectItem>
                  <SelectItem value="text">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      Văn bản thuần
                    </div>
                  </SelectItem>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-500" />
                      Excel (TSV)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Tổng kế hoạch</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{tasks.length}</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Kích thước</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{Math.round(JSON.stringify(tasks).length / 1024)} <span className="text-base font-normal text-muted-foreground">KB</span></p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={exportData} className="w-full rounded-lg" disabled={tasks.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Xuất file
              </Button>

              <Button
                variant="outline"
                className="w-full rounded-lg"
                onClick={() => {
                  const content = JSON.stringify(tasks, null, 2)
                  navigator.clipboard.writeText(content)
                }}
                disabled={tasks.length === 0}
              >
                Sao chép vào clipboard
              </Button>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <div className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-blue-500" />
                <span className="text-sm">JSON: Định dạng dữ liệu đầy đủ, phù hợp để sao lưu</span>
              </div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-500" />
                <span className="text-sm">CSV/TSV: Phù hợp để mở trong Excel hoặc Google Sheets</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                <span className="text-sm">Văn bản: Dễ đọc, phù hợp để chia sẻ</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 py-4">
            {importError && (
              <Alert variant="destructive">
                <AlertTitle>Lỗi khi nhập dữ liệu</AlertTitle>
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Định dạng nhập</Label>
              <Select value={importFormat} onValueChange={setImportFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn định dạng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="text">Văn bản thuần</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chế độ nhập</Label>
              <Select value={importMode} onValueChange={setImportMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chế độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="merge">Gộp với dữ liệu hiện tại</SelectItem>
                  <SelectItem value="replace">Thay thế dữ liệu hiện tại</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dữ liệu</Label>
              <Textarea
                placeholder="Dán dữ liệu vào đây..."
                className="min-h-[200px] font-mono text-sm"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={importDataHandler} className="flex-1" disabled={!importData.trim()}>
                <Upload className="mr-2 h-4 w-4" />
                Nhập dữ liệu
              </Button>

              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const input = document.createElement("input")
                  input.type = "file"
                  input.accept = importFormat === "json" ? ".json" : importFormat === "csv" ? ".csv" : ".txt"

                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (e) => {
                        const content = e.target?.result as string
                        setImportData(content)
                      }
                      reader.readAsText(file)
                    }
                  }

                  input.click()
                }}
              >
                Chọn tệp
              </Button>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-500" />
                <span className="text-sm">
                  {importMode === "merge"
                    ? "Chế độ gộp: Thêm dữ liệu mới vào dữ liệu hiện tại"
                    : "Chế độ thay thế: Xóa dữ liệu hiện tại và thay thế bằng dữ liệu mới"}
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Sao lưu thủ công</CardTitle>
                  <CardDescription>Tạo bản sao lưu ngay lập tức</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={backupData} className="w-full" disabled={tasks.length === 0}>
                    <Save className="mr-2 h-4 w-4" />
                    Sao lưu ngay
                  </Button>

                  <Button variant="outline" className="w-full" onClick={restoreBackup}>
                    Khôi phục bản sao lưu
                  </Button>

                  {lastBackup && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Sao lưu lần cuối: {format(new Date(lastBackup), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Sao lưu tự động</CardTitle>
                  <CardDescription>Tự động sao lưu dữ liệu theo lịch trình</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-backup">Bật sao lưu tự động</Label>
                    <Switch id="auto-backup" checked={autoBackup} onCheckedChange={setAutoBackup} />
                  </div>

                  <div className="space-y-2">
                    <Label>Tần suất sao lưu</Label>
                    <Select value={backupInterval} onValueChange={setBackupInterval} disabled={!autoBackup}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn tần suất" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Mỗi giờ</SelectItem>
                        <SelectItem value="daily">Mỗi ngày</SelectItem>
                        <SelectItem value="weekly">Mỗi tuần</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="outline" className="w-full" onClick={saveBackupSettings}>
                    Lưu cài đặt
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <AlertTitle>Lưu ý về sao lưu</AlertTitle>
              <AlertDescription>
                Dữ liệu sao lưu được lưu trữ trong bộ nhớ cục bộ của trình duyệt. Xóa bộ nhớ cache hoặc cookie có thể
                làm mất dữ liệu sao lưu. Nên xuất dữ liệu ra tệp để lưu trữ an toàn.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
