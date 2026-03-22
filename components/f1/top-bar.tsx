"use client"

import { Cloud, Flag, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface TopBarProps {
  gpName: string
  currentLap: number
  totalLaps: number
  weather: {
    condition: string
    alert?: string
  }
  trackStatus: "green" | "yellow" | "red" | "vsc"
}

export function TopBar({
  gpName,
  currentLap,
  totalLaps,
  weather,
  trackStatus,
}: TopBarProps) {
  const statusConfig = {
    green: {
      label: "GREEN FLAG",
      bgClass: "bg-[oklch(0.6_0.2_145)]",
      glowClass: "shadow-[0_0_20px_oklch(0.6_0.2_145/0.5)]",
      icon: Flag,
    },
    yellow: {
      label: "SAFETY CAR",
      bgClass: "bg-[oklch(0.85_0.18_90)]",
      glowClass: "shadow-[0_0_20px_oklch(0.85_0.18_90/0.6)] animate-pulse",
      icon: AlertTriangle,
    },
    red: {
      label: "RED FLAG",
      bgClass: "bg-[oklch(0.55_0.25_25)]",
      glowClass: "shadow-[0_0_25px_oklch(0.55_0.25_25/0.7)] animate-pulse",
      icon: Flag,
    },
    vsc: {
      label: "VSC",
      bgClass: "bg-[oklch(0.85_0.18_90)]",
      glowClass: "shadow-[0_0_15px_oklch(0.85_0.18_90/0.5)]",
      icon: AlertTriangle,
    },
  }

  const status = statusConfig[trackStatus]
  const StatusIcon = status.icon

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-secondary/50 border-b border-border backdrop-blur-sm">
      {/* GP Name & Lap */}
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {gpName}
        </h1>
        <div className="flex items-baseline gap-2 px-4 py-1.5 bg-muted rounded-md">
          <span className="text-xs text-muted-foreground font-medium tracking-wider">LAP</span>
          <span className="text-2xl font-mono font-bold text-primary">
            {currentLap}
          </span>
          <span className="text-muted-foreground font-mono">/ {totalLaps}</span>
        </div>
      </div>

      {/* Weather */}
      <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg">
        <Cloud className="w-5 h-5 text-[oklch(0.6_0.15_240)]" />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{weather.condition}</span>
          {weather.alert && (
            <span className="text-xs text-[oklch(0.6_0.15_240)] font-medium animate-pulse">
              {weather.alert}
            </span>
          )}
        </div>
      </div>

      {/* Track Status */}
      <div
        className={cn(
          "flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm tracking-wider transition-all",
          status.bgClass,
          status.glowClass,
          trackStatus === "green" || trackStatus === "yellow" || trackStatus === "vsc"
            ? "text-[oklch(0.15_0_0)]"
            : "text-white"
        )}
      >
        <StatusIcon className="w-4 h-4" />
        {status.label}
      </div>
    </header>
  )
}
