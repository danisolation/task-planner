"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, Volume2, Volume1, VolumeX, BellRing } from "lucide-react"
import type { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"

interface TaskReminderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  onSave: (taskId: string, reminderSettings: any) => void
}

export function TaskReminder({ open, onOpenChange, task, onSave }: TaskReminderProps) {
  const [enabled, setEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState("30")
  const [reminderUnit, setReminderUnit] = useState("minutes")
  const [previewTime, setPreviewTime] = useState<string | null>(null)
  const [repeat, setRepeat] = useState("none")
  const [repeatInterval, setRepeatInterval] = useState("5")
  const [notificationType, setNotificationType] = useState("both")
  const [soundVolume, setSoundVolume] = useState(80)
  const [selectedSound, setSelectedSound] = useState("default")

  // Danh sách âm thanh thông báo
  const sounds = [
    { id: "default", name: "Mặc định", url: "/notification.mp3" },
    { id: "bell", name: "Chuông", url: "/bell.mp3" },
    { id: "chime", name: "Chime", url: "/chime.mp3" },
    { id: "alert", name: "Cảnh báo", url: "/alert.mp3" },
  ]

  useEffect(() => {
    if (task && open) {
      // Nếu task có cài đặt nhắc nhở, load chúng
      if (task.reminder) {
        setEnabled(true)
        setReminderTime(task.reminder.time.toString())
        setReminderUnit(task.reminder.unit)
        setRepeat(task.reminder.repeat || "none")
        setRepeatInterval(task.reminder.repeatInterval?.toString() || "5")
        setNotificationType(task.reminder.notificationType || "both")
        setSoundVolume(task.reminder.soundVolume || 80)
        setSelectedSound(task.reminder.sound || "default")
      } else {
        // Mặc định
        setEnabled(false)
        setReminderTime("30")
        setReminderUnit("minutes")
        setRepeat("none")
        setRepeatInterval("5")
        setNotificationType("both")
        setSoundVolume(80)
        setSelectedSound("default")
      }
    }
  }, [task, open])

  useEffect(() => {
    if (task && enabled) {
      // Tính toán thời gian nhắc nhở dự kiến
      const dueDate = new Date(task.dueDate)
      const reminderDate = new Date(dueDate)

      const timeValue = Number.parseInt(reminderTime)

      switch (reminderUnit) {
        case "minutes":
          reminderDate.setMinutes(reminderDate.getMinutes() - timeValue)
          break
        case "hours":
          reminderDate.setHours(reminderDate.getHours() - timeValue)
          break
        case "days":
          reminderDate.setDate(reminderDate.getDate() - timeValue)
          break
        case "weeks":
          reminderDate.setDate(reminderDate.getDate() - timeValue * 7)
          break
      }

      // Nếu thời gian nhắc nhở đã qua, hiển thị thông báo
      if (reminderDate < new Date()) {
        setPreviewTime("Thời gian nhắc nhở đã qua")
      } else {
        setPreviewTime(`Nhắc nhở vào: ${format(reminderDate, "HH:mm - dd/MM/yyyy", { locale: vi })}`)
      }
    } else {
      setPreviewTime(null)
    }
  }, [task, enabled, reminderTime, reminderUnit])

  const handleSave = () => {
    if (!task) return

    if (enabled) {
      onSave(task.id, {
        enabled: true,
        time: Number.parseInt(reminderTime),
        unit: reminderUnit,
        repeat,
        repeatInterval: Number.parseInt(repeatInterval),
        notificationType,
        soundVolume,
        sound: selectedSound,
      })
    } else {
      onSave(task.id, { enabled: false })
    }

    onOpenChange(false)
  }

  const playSound = () => {
    const sound = sounds.find((s) => s.id === selectedSound)
    if (sound) {
      const audio = new Audio(sound.url)
      audio.volume = soundVolume / 100
      audio.play()
    }
  }

  const getVolumeIcon = () => {
    if (soundVolume === 0) return <VolumeX className="h-4 w-4" />
    if (soundVolume < 50) return <Volume1 className="h-4 w-4" />
    return <Volume2 className="h-4 w-4" />
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cài đặt nhắc nhở</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Cơ bản</TabsTrigger>
            <TabsTrigger value="advanced">Nâng cao</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">Bật nhắc nhở</h4>
                <p className="text-sm text-muted-foreground">Nhận thông báo trước khi kế hoạch đến hạn</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            {enabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Thời gian</Label>
                    <Select value={reminderTime} onValueChange={setReminderTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn thời gian" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="60">60</SelectItem>
                        <SelectItem value="120">120</SelectItem>
                        <SelectItem value="1440">1 ngày</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Đơn vị</Label>
                    <Select value={reminderUnit} onValueChange={setReminderUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn đơn vị" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Phút</SelectItem>
                        <SelectItem value="hours">Giờ</SelectItem>
                        <SelectItem value="days">Ngày</SelectItem>
                        <SelectItem value="weeks">Tuần</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {previewTime && (
                  <div className="p-3 bg-muted rounded-md text-sm flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-amber-500" />
                    {previewTime}
                  </div>
                )}
              </>
            )}

            <div className="pt-2">
              <h4 className="font-medium mb-1">Kế hoạch</h4>
              <p className="text-sm">{task.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Hạn chót: {format(new Date(task.dueDate), "HH:mm - dd/MM/yyyy", { locale: vi })}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 py-4">
            {enabled && (
              <>
                <div className="space-y-3">
                  <h4 className="font-medium">Lặp lại nhắc nhở</h4>
                  <RadioGroup value={repeat} onValueChange={setRepeat} className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="none" />
                      <Label htmlFor="none">Không lặp lại</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="until-completed" id="until-completed" />
                      <Label htmlFor="until-completed">Đến khi hoàn thành</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="until-due" id="until-due" />
                      <Label htmlFor="until-due">Đến khi đến hạn</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom">Tùy chỉnh</Label>
                    </div>
                  </RadioGroup>

                  {repeat === "custom" && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="space-y-2">
                        <Label>Lặp lại mỗi</Label>
                        <Select value={repeatInterval} onValueChange={setRepeatInterval}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn khoảng thời gian" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 phút</SelectItem>
                            <SelectItem value="10">10 phút</SelectItem>
                            <SelectItem value="15">15 phút</SelectItem>
                            <SelectItem value="30">30 phút</SelectItem>
                            <SelectItem value="60">1 giờ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="font-medium">Loại thông báo</h4>
                  <RadioGroup value={notificationType} onValueChange={setNotificationType}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="visual" id="visual" />
                      <Label htmlFor="visual">Chỉ hiển thị</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sound" id="sound" />
                      <Label htmlFor="sound">Chỉ âm thanh</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="both" />
                      <Label htmlFor="both">Cả hai</Label>
                    </div>
                  </RadioGroup>
                </div>

                {(notificationType === "sound" || notificationType === "both") && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Âm thanh</h4>
                      <Button variant="outline" size="sm" onClick={playSound}>
                        Nghe thử
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Chọn âm thanh</Label>
                      <Select value={selectedSound} onValueChange={setSelectedSound}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn âm thanh" />
                        </SelectTrigger>
                        <SelectContent>
                          {sounds.map((sound) => (
                            <SelectItem key={sound.id} value={sound.id}>
                              {sound.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Âm lượng</Label>
                        <span className="text-sm text-muted-foreground">{soundVolume}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getVolumeIcon()}
                        <Slider
                          value={[soundVolume]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={(value) => setSoundVolume(value[0])}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave}>
            {enabled ? <Bell className="mr-2 h-4 w-4" /> : <BellOff className="mr-2 h-4 w-4" />}
            {enabled ? "Lưu nhắc nhở" : "Tắt nhắc nhở"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
