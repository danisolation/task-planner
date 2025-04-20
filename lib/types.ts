export interface Task {
  id: string
  title: string
  description: string
  category: string
  priority: string
  dueDate: Date
  status: "completed" | "incomplete" | "overdue"
  tags?: string[]
  isRecurring?: boolean
  recurringPattern?: string
  recurringCustom?: {
    frequency: string
    interval: number
    weekdays: string[]
    monthDay: number
    endType: string
    endDate: Date
    endCount: number
  }
  notes?: string
  reminder?: {
    enabled: boolean
    time: number
    unit: string
    repeat?: string
    repeatInterval?: number
    notificationType?: string
    soundVolume?: number
    sound?: string
    notified?: boolean
  }
  importance?: number
  subTasks?: SubTask[]
  timeEstimate?: TimeEstimate
  dependencies?: string[]
  startDate?: Date | null
  startTime?: string
  endTime?: string
  allDay?: boolean
  energy?: string
  location?: string
}

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export interface TimeEstimate {
  hours: number
  minutes: number
  type: "fixed" | "flexible"
}

export interface PomodoroSettings {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  longBreakInterval: number
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  sound: string
  volume: number
}

export interface PomodoroStats {
  completedPomodoros: number
  totalWorkTime: number
  completedTasks: number
  dailyStats: {
    date: string
    pomodoros: number
    workTime: number
  }[]
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string
    borderWidth?: number
    fill?: boolean
  }[]
}
