"use client"

import type * as React from "react"
import { Chart as ChartJS, registerables } from "chart.js"
import { Pie, Bar, Line } from "react-chartjs-2"
import { cn } from "@/lib/utils"

ChartJS.register(...registerables)

const ChartContainer = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("relative w-full", className)} {...props} />
}

const ChartLegend = ({ position = "bottom" }: { position?: "top" | "bottom" | "left" | "right" }) => {
  return null
}

const ChartTooltip = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const ChartTooltipContent = () => {
  return null
}

const ChartTooltipItem = () => {
  return null
}

const ChartTooltipTitle = () => {
  return null
}

const Chart = ({ type, data, options }: { type: "pie" | "bar" | "line"; data: any; options?: any }) => {
  if (type === "pie") {
    return <Pie data={data} options={options} />
  } else if (type === "bar") {
    return <Bar data={data} options={options} />
  } else if (type === "line") {
    return <Line data={data} options={options} />
  }
  return null
}

const ChartPie = () => {
  return null
}

const ChartBar = () => {
  return null
}

const ChartLine = () => {
  return null
}

const ChartArea = () => {
  return null
}

const ChartGrid = () => {
  return null
}

const ChartXAxis = () => {
  return null
}

const ChartYAxis = () => {
  return null
}

export {
  Chart,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
  ChartTooltipItem,
  ChartTooltipTitle,
  ChartBar,
  ChartPie,
  ChartLine,
  ChartGrid,
  ChartXAxis,
  ChartYAxis,
  ChartArea,
}
