"use client"

import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Radio, AlertTriangle, CloudRain, Info, Zap } from "lucide-react"

type EventType = "normal" | "critical" | "weather" | "strategy" | "overtake"

interface RaceEvent {
  id: string
  lap: number
  type: EventType
  message: string
  timestamp?: string
}

interface RadioFeedProps {
  events: RaceEvent[]
}

const eventConfig: Record<EventType, { icon: typeof Radio; colorClass: string; bgClass: string }> = {
  normal: {
    icon: Info,
    colorClass: "text-muted-foreground",
    bgClass: "bg-transparent",
  },
  critical: {
    icon: AlertTriangle,
    colorClass: "text-[oklch(0.55_0.25_25)]",
    bgClass: "bg-[oklch(0.55_0.25_25/0.1)] border-l-2 border-[oklch(0.55_0.25_25)]",
  },
  weather: {
    icon: CloudRain,
    colorClass: "text-[oklch(0.6_0.15_240)]",
    bgClass: "bg-[oklch(0.6_0.15_240/0.1)] border-l-2 border-[oklch(0.6_0.15_240)]",
  },
  strategy: {
    icon: Radio,
    colorClass: "text-[oklch(0.85_0.18_90)]",
    bgClass: "bg-[oklch(0.85_0.18_90/0.08)] border-l-2 border-[oklch(0.85_0.18_90)]",
  },
  overtake: {
    icon: Zap,
    colorClass: "text-[oklch(0.6_0.2_145)]",
    bgClass: "bg-[oklch(0.6_0.2_145/0.1)] border-l-2 border-[oklch(0.6_0.2_145)]",
  },
}

export function RadioFeed({ events }: RadioFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [events])

  return (
    <div className="flex-1 flex flex-col bg-card/30 rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
        <Radio className="w-4 h-4 text-primary animate-pulse" />
        <h2 className="text-sm font-bold tracking-wider text-foreground">
          实时无线电通讯
        </h2>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">
          LIVE
        </span>
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      </div>

      <div ref={feedRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {events.map((event, index) => {
          const config = eventConfig[event.type]
          const Icon = config.icon

          return (
            <div
              key={event.id}
              className={cn(
                "flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all",
                config.bgClass,
                index === events.length - 1 && "animate-in slide-in-from-bottom-2 duration-300"
              )}
            >
              <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", config.colorClass)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    LAP {event.lap}
                  </span>
                  {event.timestamp && (
                    <span className="text-[10px] text-muted-foreground/50">
                      {event.timestamp}
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "text-sm leading-relaxed mt-0.5",
                    event.type === "critical"
                      ? "font-bold text-[oklch(0.55_0.25_25)]"
                      : event.type === "weather"
                        ? "text-[oklch(0.7_0.12_240)]"
                        : "text-foreground"
                  )}
                >
                  {event.message}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
