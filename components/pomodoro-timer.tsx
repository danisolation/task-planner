"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Chart,
  ChartContainer
} from "@/components/ui/chart"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ChartData, PomodoroSettings, PomodoroStats, Task } from "@/lib/types"
import { BarChart3, Clock, Pause, Play, Settings, SkipForward, Volume2, VolumeX } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface PomodoroTimerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tasks: Task[]
}

export function PomodoroTimer({ open, onOpenChange, tasks }: PomodoroTimerProps) {
  // Cài đặt mặc định
  const defaultSettings: PomodoroSettings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    sound: "bell",
    volume: 80,
  }

  // Thống kê mặc định
  const defaultStats: PomodoroStats = {
    completedPomodoros: 0,
    totalWorkTime: 0,
    completedTasks: 0,
    dailyStats: [],
  }

  // State
  const [isClient, setIsClient] = useState(false)
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings)
  const [stats, setStats] = useState<PomodoroStats>(defaultStats)
  const [activeTab, setActiveTab] = useState("timer")
  const [timerMode, setTimerMode] = useState<"work" | "shortBreak" | "longBreak">("work")
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Danh sách âm thanh
  const sounds = [
    { id: "bell", name: "Chuông", url: "/bell.mp3" },
    { id: "chime", name: "Chime", url: "/chime.mp3" },
    { id: "alert", name: "Cảnh báo", url: "/alert.mp3" },
    { id: "none", name: "Không có âm thanh", url: "" },
  ]

  // Load settings và stats từ localStorage
  useEffect(() => {
    setIsClient(true)

    // Chỉ load từ localStorage khi ở phía client
    const savedSettings = localStorage.getItem("pomodoroSettings")
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error("Failed to parse saved settings", e)
      }
    }

    const savedStats = localStorage.getItem("pomodoroStats")
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats))
      } catch (e) {
        console.error("Failed to parse saved stats", e)
      }
    }
  }, [])

  // Lưu settings và stats vào localStorage khi thay đổi
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("pomodoroSettings", JSON.stringify(settings))
    }
  }, [settings, isClient])

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("pomodoroStats", JSON.stringify(stats))
    }
  }, [stats, isClient])

  // Cập nhật timeLeft khi settings hoặc timerMode thay đổi
  useEffect(() => {
    let duration = 0

    switch (timerMode) {
      case "work":
        duration = settings.workDuration
        break
      case "shortBreak":
        duration = settings.shortBreakDuration
        break
      case "longBreak":
        duration = settings.longBreakDuration
        break
    }

    setTimeLeft(duration * 60)
  }, [settings, timerMode])

  // Xử lý timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout)

            // Phát âm thanh khi hết thời gian
            if (settings.sound !== "none") {
              const sound = sounds.find((s) => s.id === settings.sound)
              if (sound && sound.url) {
                audioRef.current = new Audio(sound.url)
                audioRef.current.volume = settings.volume / 100
                audioRef.current.play()
              }
            }

            // Xử lý khi kết thúc một pomodoro
            if (timerMode === "work") {
              // Cập nhật thống kê
              const today = new Date().toISOString().split("T")[0]
              const updatedStats = { ...stats }

              updatedStats.completedPomodoros += 1
              updatedStats.totalWorkTime += settings.workDuration

              // Cập nhật thống kê hàng ngày
              const dailyStatIndex = updatedStats.dailyStats.findIndex((stat) => stat.date === today)

              if (dailyStatIndex >= 0) {
                updatedStats.dailyStats[dailyStatIndex].pomodoros += 1
                updatedStats.dailyStats[dailyStatIndex].workTime += settings.workDuration
              } else {
                updatedStats.dailyStats.push({
                  date: today,
                  pomodoros: 1,
                  workTime: settings.workDuration,
                })
              }

              setStats(updatedStats)

              // Tăng số pomodoro đã hoàn thành
              const newCount = pomodoroCount + 1
              setPomodoroCount(newCount)

              // Kiểm tra xem có nên chuyển sang nghỉ dài không
              if (newCount % settings.longBreakInterval === 0) {
                setTimerMode("longBreak")

                // Tự động bắt đầu nghỉ nếu được bật
                if (settings.autoStartBreaks) {
                  setTimeLeft(settings.longBreakDuration * 60)
                  return settings.longBreakDuration * 60
                } else {
                  setIsRunning(false)
                }
              } else {
                setTimerMode("shortBreak")

                // Tự động bắt đầu nghỉ nếu được bật
                if (settings.autoStartBreaks) {
                  setTimeLeft(settings.shortBreakDuration * 60)
                  return settings.shortBreakDuration * 60
                } else {
                  setIsRunning(false)
                }
              }
            } else {
              // Kết thúc thời gian nghỉ
              setTimerMode("work")

              // Tự động bắt đầu pomodoro mới nếu được bật
              if (settings.autoStartPomodoros) {
                setTimeLeft(settings.workDuration * 60)
                return settings.workDuration * 60
              } else {
                setIsRunning(false)
              }
            }

            return 0
          }

          return prevTime - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRunning, timerMode, settings, pomodoroCount, stats])

  // Format thời gian
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Xử lý bắt đầu/tạm dừng timer
  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  // Xử lý bỏ qua thời gian hiện tại
  const skipTimer = () => {
    setIsRunning(false)

    if (timerMode === "work") {
      // Cập nhật thống kê nếu bỏ qua pomodoro
      const workTimeCompleted = settings.workDuration * 60 - timeLeft
      if (workTimeCompleted > 0) {
        const minutesCompleted = Math.floor(workTimeCompleted / 60)

        const today = new Date().toISOString().split("T")[0]
        const updatedStats = { ...stats }

        updatedStats.totalWorkTime += minutesCompleted

        // Cập nhật thống kê hàng ngày
        const dailyStatIndex = updatedStats.dailyStats.findIndex((stat) => stat.date === today)

        if (dailyStatIndex >= 0) {
          updatedStats.dailyStats[dailyStatIndex].workTime += minutesCompleted
        } else {
          updatedStats.dailyStats.push({
            date: today,
            pomodoros: 0,
            workTime: minutesCompleted,
          })
        }

        setStats(updatedStats)
      }

      // Chuyển sang thời gian nghỉ
      if ((pomodoroCount + 1) % settings.longBreakInterval === 0) {
        setTimerMode("longBreak")
        setTimeLeft(settings.longBreakDuration * 60)
      } else {
        setTimerMode("shortBreak")
        setTimeLeft(settings.shortBreakDuration * 60)
      }
    } else {
      // Chuyển sang thời gian làm việc
      setTimerMode("work")
      setTimeLeft(settings.workDuration * 60)
    }
  }

  // Xử lý hoàn thành task
  const completeTask = () => {
    if (selectedTask) {
      // Cập nhật thống kê
      setStats({
        ...stats,
        completedTasks: stats.completedTasks + 1,
      })

      // Reset selected task
      setSelectedTask(null)
    }
  }

  // Tạo dữ liệu biểu đồ
  const getChartData = (): ChartData => {
    // Lấy 7 ngày gần nhất có dữ liệu
    const recentStats = [...stats.dailyStats]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7)
      .reverse()

    return {
      labels: recentStats.map((stat) => {
        const date = new Date(stat.date)
        return `${date.getDate()}/${date.getMonth() + 1}`
      }),
      datasets: [
        {
          label: "Số Pomodoro",
          data: recentStats.map((stat) => stat.pomodoros),
          backgroundColor: ["#ef4444"],
        },
        {
          label: "Giờ làm việc",
          data: recentStats.map((stat) => Math.round((stat.workTime / 60) * 10) / 10),
          backgroundColor: ["#3b82f6"],
        },
      ],
    }
  }

  // Tính toán tiến trình
  const calculateProgress = () => {
    let totalSeconds = 0

    switch (timerMode) {
      case "work":
        totalSeconds = settings.workDuration * 60
        break
      case "shortBreak":
        totalSeconds = settings.shortBreakDuration * 60
        break
      case "longBreak":
        totalSeconds = settings.longBreakDuration * 60
        break
    }

    return 100 - (timeLeft / totalSeconds) * 100
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] animate-scale-in">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <div className={`p-2 rounded-full ${
              timerMode === "work" 
                ? "bg-red-100 dark:bg-red-900/50" 
                : timerMode === "shortBreak" 
                  ? "bg-green-100 dark:bg-green-900/50" 
                  : "bg-blue-100 dark:bg-blue-900/50"
            }`}>
              <Clock className={`h-5 w-5 ${
                timerMode === "work" 
                  ? "text-red-600 dark:text-red-400" 
                  : timerMode === "shortBreak" 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-blue-600 dark:text-blue-400"
              }`} />
            </div>
            Pomodoro Timer
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 p-1 bg-muted/50 rounded-lg">
            <TabsTrigger value="timer" className="rounded-md">
              <Clock className="h-4 w-4 mr-2" />
              Hẹn giờ
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-md">
              <BarChart3 className="h-4 w-4 mr-2" />
              Thống kê
            </TabsTrigger>
            <TabsTrigger value="settings" onClick={() => setShowSettings(true)} className="rounded-md">
              <Settings className="h-4 w-4 mr-2" />
              Cài đặt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timer" className="space-y-4 py-4">
            <div className="flex flex-col items-center">
              <div className="flex gap-2 mb-6 p-1 bg-muted/30 rounded-full">
                <button
                  onClick={() => {
                    setIsRunning(false)
                    setTimerMode("work")
                    setTimeLeft(settings.workDuration * 60)
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    timerMode === "work" 
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/30" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Làm việc
                </button>
                <button
                  onClick={() => {
                    setIsRunning(false)
                    setTimerMode("shortBreak")
                    setTimeLeft(settings.shortBreakDuration * 60)
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    timerMode === "shortBreak" 
                      ? "bg-green-500 text-white shadow-lg shadow-green-500/30" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Nghỉ ngắn
                </button>
                <button
                  onClick={() => {
                    setIsRunning(false)
                    setTimerMode("longBreak")
                    setTimeLeft(settings.longBreakDuration * 60)
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    timerMode === "longBreak" 
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Nghỉ dài
                </button>
              </div>

              {/* Timer display with circular progress */}
              <div className="relative mb-6">
                <div className={`absolute inset-0 rounded-full blur-2xl opacity-30 ${
                  timerMode === "work" 
                    ? "bg-red-500" 
                    : timerMode === "shortBreak" 
                      ? "bg-green-500" 
                      : "bg-blue-500"
                }`}></div>
                <div className={`relative w-48 h-48 rounded-full flex items-center justify-center border-4 ${
                  timerMode === "work" 
                    ? "border-red-500/30" 
                    : timerMode === "shortBreak" 
                      ? "border-green-500/30" 
                      : "border-blue-500/30"
                }`}>
                  <div className="text-5xl font-bold tabular-nums">
                    {formatTime(timeLeft)}
                  </div>
                </div>
              </div>

              <Progress value={calculateProgress()} className={`w-full h-2 mb-6 ${
                timerMode === "work" 
                  ? "[&>div]:bg-red-500" 
                  : timerMode === "shortBreak" 
                    ? "[&>div]:bg-green-500" 
                    : "[&>div]:bg-blue-500"
              }`} />

              <div className="flex gap-3 mb-6">
                <Button 
                  onClick={toggleTimer} 
                  size="lg" 
                  className={`rounded-full px-8 ${
                    timerMode === "work" 
                      ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30" 
                      : timerMode === "shortBreak" 
                        ? "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30" 
                        : "bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/30"
                  }`}
                >
                  {isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {isRunning ? "Tạm dừng" : "Bắt đầu"}
                </Button>
                <Button variant="outline" onClick={skipTimer} size="lg" className="rounded-full">
                  <SkipForward className="mr-2 h-4 w-4" />
                  Bỏ qua
                </Button>
              </div>

              <div className="w-full space-y-4">
                <Separator />

                <div className="space-y-2">
                  <Label>Kế hoạch hiện tại</Label>
                  <Select value={selectedTask || ""} onValueChange={setSelectedTask}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn kế hoạch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không có kế hoạch</SelectItem>
                      {tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTask && (
                  <Button variant="outline" className="w-full" onClick={completeTask}>
                    Đánh dấu hoàn thành
                  </Button>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Pomodoro hôm nay</p>
                    <p className="text-2xl font-bold">
                      {stats.dailyStats.find((stat) => stat.date === new Date().toISOString().split("T")[0])
                        ?.pomodoros || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tổng thời gian</p>
                    <p className="text-2xl font-bold">{Math.round((stats.totalWorkTime / 60) * 10) / 10}h</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Kế hoạch hoàn thành</p>
                    <p className="text-2xl font-bold">{stats.completedTasks}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle>Thống kê Pomodoro</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {stats.dailyStats.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Chưa có dữ liệu thống kê
                  </div>
                ) : (
                  <ChartContainer className="h-full">
                    <Chart
                      type="bar"
                      data={getChartData()}
                      options={{
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                        maintainAspectRatio: false,
                      }}
                    />
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tổng số Pomodoro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedPomodoros}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tổng thời gian làm việc</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round((stats.totalWorkTime / 60) * 10) / 10}h</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Kế hoạch hoàn thành</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedTasks}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Hiệu suất trung bình</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.completedPomodoros > 0
                      ? Math.round((stats.completedTasks / stats.completedPomodoros) * 100) / 100
                      : 0}{" "}
                    kế hoạch/pomodoro
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (confirm("Bạn có chắc chắn muốn đặt lại tất cả thống kê không?")) {
                  setStats(defaultStats)
                }
              }}
            >
              Đặt lại thống kê
            </Button>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 py-4">
            <div className="space-y-4">
              <h3 className="font-medium">Thời gian (phút)</h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Làm việc</Label>
                  <Select
                    value={settings.workDuration.toString()}
                    onValueChange={(value) => setSettings({ ...settings, workDuration: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                      {[15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map((value) => (
                        <SelectItem key={value} value={value.toString()}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nghỉ ngắn</Label>
                  <Select
                    value={settings.shortBreakDuration.toString()}
                    onValueChange={(value) => setSettings({ ...settings, shortBreakDuration: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 5, 7, 10, 15].map((value) => (
                        <SelectItem key={value} value={value.toString()}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nghỉ dài</Label>
                  <Select
                    value={settings.longBreakDuration.toString()}
                    onValueChange={(value) => setSettings({ ...settings, longBreakDuration: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 15, 20, 25, 30].map((value) => (
                        <SelectItem key={value} value={value.toString()}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Số Pomodoro trước khi nghỉ dài</Label>
                <Select
                  value={settings.longBreakInterval.toString()}
                  onValueChange={(value) => setSettings({ ...settings, longBreakInterval: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn số lượng" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6].map((value) => (
                      <SelectItem key={value} value={value.toString()}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <h3 className="font-medium">Tự động</h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tự động bắt đầu nghỉ</Label>
                  <p className="text-sm text-muted-foreground">
                    Tự động bắt đầu thời gian nghỉ sau khi kết thúc Pomodoro
                  </p>
                </div>
                <Switch
                  checked={settings.autoStartBreaks}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoStartBreaks: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tự động bắt đầu Pomodoro</Label>
                  <p className="text-sm text-muted-foreground">
                    Tự động bắt đầu Pomodoro sau khi kết thúc thời gian nghỉ
                  </p>
                </div>
                <Switch
                  checked={settings.autoStartPomodoros}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoStartPomodoros: checked })}
                />
              </div>

              <Separator />

              <h3 className="font-medium">Âm thanh</h3>

              <div className="space-y-2">
                <Label>Âm thanh thông báo</Label>
                <div className="flex gap-2">
                  <Select
                    value={settings.sound}
                    onValueChange={(value) => setSettings({ ...settings, sound: value })}
                  >
                    <SelectTrigger className="flex-1">
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

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const sound = sounds.find((s) => s.id === settings.sound)
                      if (sound && sound.url) {
                        const audio = new Audio(sound.url)
                        audio.volume = settings.volume / 100
                        audio.play()
                      }
                    }}
                    disabled={settings.sound === "none"}
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Âm lượng</Label>
                  <span className="text-sm text-muted-foreground">{settings.volume}%</span>
                </div>
                <div className="flex items-center gap-2">
                  {settings.volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  <Slider
                    value={[settings.volume]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(value) => setSettings({ ...settings, volume: value[0] })}
                    className="flex-1"
                    disabled={settings.sound === "none"}
                  />
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (confirm("Bạn có chắc chắn muốn đặt lại tất cả cài đặt về mặc định không?")) {
                    setSettings(defaultSettings)
                  }
                }}
              >
                Đặt lại cài đặt mặc định
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
