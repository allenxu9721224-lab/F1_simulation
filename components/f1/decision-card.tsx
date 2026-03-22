"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Radio, Timer } from "lucide-react"

interface DecisionOption {
  id: string
  label: string
  variant: "primary" | "secondary"
  icon?: string
}

interface DecisionCardProps {
  engineerMessage: string
  options: DecisionOption[]
  urgency?: "normal" | "high" | "critical"
  timeRemaining?: number
  onDecision: (optionId: string) => void
  isVisible: boolean
}

export function DecisionCard({
  engineerMessage,
  options,
  urgency = "normal",
  timeRemaining,
  onDecision,
  isVisible,
}: DecisionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  if (!isVisible) return null

  const handleDecision = (optionId: string) => {
    setSelectedOption(optionId)
    setTimeout(() => {
      onDecision(optionId)
      setSelectedOption(null)
    }, 300)
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ease-out",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      {/* Backdrop gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none h-32 -top-32" />

      <div
        className={cn(
          "relative mx-auto max-w-3xl px-4 pb-6",
          urgency === "critical" && "animate-pulse"
        )}
      >
        <div
          className={cn(
            "bg-card border rounded-2xl overflow-hidden shadow-2xl",
            urgency === "critical"
              ? "border-primary shadow-[0_0_40px_oklch(0.55_0.25_25/0.3)]"
              : urgency === "high"
                ? "border-[oklch(0.85_0.18_90)] shadow-[0_0_30px_oklch(0.85_0.18_90/0.2)]"
                : "border-border"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs font-bold tracking-wider text-muted-foreground">
                比赛工程师
              </span>
            </div>
            {timeRemaining && (
              <div className="flex items-center gap-1.5 text-primary">
                <Timer className="w-4 h-4" />
                <span className="font-mono font-bold text-sm">
                  {timeRemaining}s
                </span>
              </div>
            )}
          </div>

          {/* Message */}
          <div className="px-5 py-4">
            <p className="text-lg leading-relaxed text-foreground">
              "{engineerMessage}"
            </p>
          </div>

          {/* Decision Buttons */}
          <div className="flex gap-3 px-5 pb-5">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleDecision(option.id)}
                disabled={selectedOption !== null}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-base tracking-wide transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card",
                  option.variant === "primary"
                    ? [
                        "bg-primary text-primary-foreground",
                        "hover:bg-primary/90 hover:shadow-[0_0_25px_oklch(0.55_0.25_25/0.4)]",
                        "focus:ring-primary",
                        "active:scale-[0.98]",
                      ]
                    : [
                        "bg-secondary text-secondary-foreground border border-border",
                        "hover:bg-secondary/80 hover:border-muted-foreground/30",
                        "focus:ring-muted-foreground",
                        "active:scale-[0.98]",
                      ],
                  selectedOption === option.id && "scale-95 opacity-70"
                )}
              >
                {option.icon && <span className="text-xl">{option.icon}</span>}
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
