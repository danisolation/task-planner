"use client"

import { useState } from "react"
import { Copy, Check, Mail, Share, Download, QrCode, LinkIcon } from "lucide-react"
import type { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TaskShareProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
}

export function TaskShare({ open, onOpenChange, task }: TaskShareProps) {
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState("")
  const [format, setFormat] = useState("text")
  const [linkCopied, setLinkCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  // Giả lập URL chia sẻ
  const shareUrl = task ? `https://mytaskplanner.app/share/${task.id}` : ""

  if (!task) return null

  const getShareText = (format: string) => {
    switch (format) {
      case "text":
        return `
Kế hoạch: ${task.title}
Mô tả: ${task.description}
Danh mục: ${task.category}
Mức độ ưu tiên: ${task.priority}
Hạn chót: ${new Date(task.dueDate).toLocaleString("vi-VN")}
${task.tags && task.tags.length > 0 ? `Nhãn: ${task.tags.join(", ")}` : ""}
${task.notes ? `Ghi chú: ${task.notes}` : ""}
`.trim()

      case "html":
        return `
<h2>${task.title}</h2>
<p><strong>Mô tả:</strong> ${task.description}</p>
<p><strong>Danh mục:</strong> ${task.category}</p>
<p><strong>Mức độ ưu tiên:</strong> ${task.priority}</p>
<p><strong>Hạn chót:</strong> ${new Date(task.dueDate).toLocaleString("vi-VN")}</p>
${task.tags && task.tags.length > 0 ? `<p><strong>Nhãn:</strong> ${task.tags.join(", ")}</p>` : ""}
${task.notes ? `<p><strong>Ghi chú:</strong> ${task.notes}</p>` : ""}
`.trim()

      case "markdown":
        return `
# ${task.title}

**Mô tả:** ${task.description}
**Danh mục:** ${task.category}
**Mức độ ưu tiên:** ${task.priority}
**Hạn chót:** ${new Date(task.dueDate).toLocaleString("vi-VN")}
${task.tags && task.tags.length > 0 ? `**Nhãn:** ${task.tags.join(", ")}` : ""}
${task.notes ? `**Ghi chú:** ${task.notes}` : ""}
`.trim()

      case "json":
        return JSON.stringify(task, null, 2)

      default:
        return ""
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(getShareText(format))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Chia sẻ kế hoạch: ${task.title}`)
    const body = encodeURIComponent(getShareText("text"))
    window.open(`mailto:${email}?subject=${subject}&body=${body}`)
  }

  const handleSocialShare = (platform: string) => {
    let url = ""

    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Kế hoạch: ${task.title}`)}&url=${encodeURIComponent(shareUrl)}`
        break
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        break
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(`Kế hoạch: ${task.title} - ${shareUrl}`)}`
        break
    }

    if (url) {
      window.open(url, "_blank", "width=600,height=400")
    }
  }

  const handleExport = (format: string) => {
    let content = ""
    let filename = `task-${task.id}`
    let type = ""

    switch (format) {
      case "text":
        content = getShareText("text")
        filename += ".txt"
        type = "text/plain"
        break
      case "html":
        content = getShareText("html")
        filename += ".html"
        type = "text/html"
        break
      case "markdown":
        content = getShareText("markdown")
        filename += ".md"
        type = "text/markdown"
        break
      case "json":
        content = getShareText("json")
        filename += ".json"
        type = "application/json"
        break
      case "ical":
        // Tạo file iCalendar
        const dueDate = new Date(task.dueDate)
        const startDate = new Date(dueDate)
        startDate.setHours(startDate.getHours() - 1)

        content = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MyTaskPlanner//EN
BEGIN:VEVENT
UID:${task.id}
SUMMARY:${task.title}
DESCRIPTION:${task.description}
DTSTART:${startDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTEND:${dueDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z
CATEGORIES:${task.category}
PRIORITY:${task.priority === "cao" ? "1" : task.priority === "trung bình" ? "5" : "9"}
END:VEVENT
END:VCALENDAR`
        filename += ".ics"
        type = "text/calendar"
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Chia sẻ kế hoạch</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="text">Văn bản</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="social">Mạng xã hội</TabsTrigger>
            <TabsTrigger value="export">Xuất</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Định dạng</h4>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Chọn định dạng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Văn bản thuần</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Textarea className="font-mono text-sm h-[200px]" readOnly value={getShareText(format)} />

            <Button onClick={handleCopy} className="w-full">
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Đã sao chép
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Sao chép
                </>
              )}
            </Button>

            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Liên kết chia sẻ</h4>
                <Button variant="outline" size="sm" onClick={() => setShowQR(!showQR)}>
                  <QrCode className="h-4 w-4 mr-2" />
                  {showQR ? "Ẩn QR" : "Hiện QR"}
                </Button>
              </div>

              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="flex-1" />
                <Button variant="secondary" onClick={handleCopyLink}>
                  {linkCopied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                </Button>
              </div>

              {showQR && (
                <div className="flex justify-center py-2">
                  <div className="bg-white p-4 rounded-lg">
                    {/* Giả lập QR code */}
                    <div className="w-[200px] h-[200px] bg-slate-100 flex items-center justify-center">
                      <QrCode className="h-32 w-32 text-slate-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Địa chỉ email</label>
              <Input
                type="email"
                placeholder="Nhập địa chỉ email người nhận"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Card className="border border-dashed">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold">{task.title}</h3>
                <p className="text-sm mt-1">{task.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline">{task.category}</Badge>
                  <Badge>{task.priority}</Badge>
                  {task.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Hạn chót: {new Date(task.dueDate).toLocaleString("vi-VN")}
                </p>
              </CardContent>
            </Card>

            <Button onClick={handleEmailShare} className="w-full" disabled={!email.includes("@")}>
              <Mail className="mr-2 h-4 w-4" />
              Gửi qua email
            </Button>
          </TabsContent>

          <TabsContent value="social" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handleSocialShare("facebook")}
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <Share className="h-5 w-5 text-white" />
                </div>
                <span>Facebook</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handleSocialShare("twitter")}
              >
                <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center">
                  <Share className="h-5 w-5 text-white" />
                </div>
                <span>Twitter</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handleSocialShare("linkedin")}
              >
                <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center">
                  <Share className="h-5 w-5 text-white" />
                </div>
                <span>LinkedIn</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handleSocialShare("whatsapp")}
              >
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Share className="h-5 w-5 text-white" />
                </div>
                <span>WhatsApp</span>
              </Button>
            </div>

            <div className="pt-2">
              <h4 className="font-medium mb-2">Xem trước</h4>
              <Card className="border border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="font-semibold">U</span>
                    </div>
                    <div>
                      <p className="font-medium">Người dùng</p>
                      <p className="text-xs text-muted-foreground">Vừa xong</p>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="font-medium">Kế hoạch: {task.title}</p>
                    <p className="text-sm mt-1">Hạn chót: {new Date(task.dueDate).toLocaleString("vi-VN")}</p>
                    <div className="mt-2">
                      <a href={shareUrl} className="text-sm text-blue-600 dark:text-blue-400 underline">
                        Xem chi tiết
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handleExport("text")}
              >
                <Download className="h-6 w-6" />
                <span>Văn bản (.txt)</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handleExport("html")}
              >
                <Download className="h-6 w-6" />
                <span>HTML (.html)</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handleExport("markdown")}
              >
                <Download className="h-6 w-6" />
                <span>Markdown (.md)</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handleExport("json")}
              >
                <Download className="h-6 w-6" />
                <span>JSON (.json)</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 col-span-2"
                onClick={() => handleExport("ical")}
              >
                <Download className="h-6 w-6" />
                <span>iCalendar (.ics)</span>
              </Button>
            </div>
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
