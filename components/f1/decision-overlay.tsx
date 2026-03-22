"use client"

import { useEffect, useState, useCallback } from "react"

export type DecisionType = "pit" | "dnf"

interface DecisionOption {
  label: string
  description: string
  action: string
}

interface DecisionOverlayProps {
  type: DecisionType
  isVisible: boolean
  onDecision: (choice: "option1" | "option2") => void
  timeLimit?: number
}

const decisionContent: Record<DecisionType, {
  title: string
  message: string
  option1: DecisionOption
  option2: DecisionOption
}> = {
  pit: {
    title: "STRATEGY CALL",
    message: "Tire deg is critical. Box now for fresh rubber or stay out and defend?",
    option1: {
      label: "BOX NOW",
      description: "Fresh Mediums",
      action: "Pit for new tires",
    },
    option2: {
      label: "STAY OUT",
      description: "Push to the limit",
      action: "Continue on track",
    },
  },
  dnf: {
    title: "CRITICAL FAILURE",
    message: "Car is smoking. Engine temps critical. Save the power unit or push for points?",
    option1: {
      label: "RETIRE CAR",
      description: "Save Engine",
      action: "Park the car safely",
    },
    option2: {
      label: "KEEP PUSHING",
      description: "Risk It All",
      action: "Continue racing",
    },
  },
}

export function DecisionOverlay({ type, isVisible, onDecision, timeLimit = 10 }: DecisionOverlayProps) {
  const [timer, setTimer] = useState(timeLimit)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const content = decisionContent[type]

  useEffect(() => {
    if (isVisible) {
      setTimer(timeLimit)
      setIsTransitioning(true)
      const transitionTimer = setTimeout(() => setIsTransitioning(false), 100)
      return () => clearTimeout(transitionTimer)
    }
  }, [isVisible, timeLimit])

  useEffect(() => {
    if (!isVisible || timer <= 0) return
    
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          onDecision("option2") // Default to second option on timeout
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isVisible, timer, onDecision])

  const handleChoice = useCallback((choice: "option1" | "option2") => {
    onDecision(choice)
  }, [onDecision])

  if (!isVisible) return null

  return (
    <div 
      className={`
        absolute inset-0 z-50 flex items-center justify-center
        transition-all duration-500
        ${isTransitioning ? "opacity-0" : "opacity-100"}
      `}
    >
      {/* Glassmorphism backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/50 pointer-events-none" />
      
      {/* Decision Card */}
      <div 
        className={`
          relative z-10 w-full max-w-xl mx-4
          bg-card/95 border-2 rounded-xl overflow-hidden
          shadow-[0_0_60px_rgba(220,0,0,0.4)]
          transition-all duration-500
          ${type === "dnf" ? "border-primary" : "border-[var(--safety-car-yellow)]"}
          ${isTransitioning ? "scale-95 opacity-0" : "scale-100 opacity-100"}
        `}
      >
        {/* Header with timer */}
        <div 
          className={`
            flex items-center justify-between px-6 py-4
            ${type === "dnf" ? "bg-primary" : "bg-[var(--safety-car-yellow)]"}
          `}
        >
          <span 
            className={`text-sm tracking-widest font-bold ${type === "dnf" ? "text-primary-foreground" : "text-black"}`}
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            {content.title}
          </span>
          
          {/* Countdown Timer */}
          <div className="flex items-center gap-3">
            <div className="w-24 h-3 bg-black/30 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  timer <= 3 ? "bg-primary animate-pulse" : type === "dnf" ? "bg-white" : "bg-black"
                }`}
                style={{ width: `${(timer / timeLimit) * 100}%` }}
              />
            </div>
            <span 
              className={`text-xl font-bold ${timer <= 3 ? "text-white animate-pulse" : type === "dnf" ? "text-primary-foreground" : "text-black"}`}
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              {timer}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning icon for DNF */}
          {type === "dnf" && (
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-8 h-8 text-primary"
                  fill="currentColor"
                >
                  <path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
                </svg>
              </div>
            </div>
          )}
          
          {/* Message */}
          <p className="text-foreground text-center text-lg mb-8 leading-relaxed">
            {content.message}
          </p>

          {/* Decision Buttons */}
          <div className="grid grid-cols-2 gap-4">
            {/* Option 1 */}
            <button
              onClick={() => handleChoice("option1")}
              className={`
                group relative py-6 px-4 rounded-lg font-bold
                transition-all duration-300
                hover:scale-105 hover:shadow-[0_0_30px_rgba(220,0,0,0.5)]
                ${type === "dnf" ? "bg-primary text-primary-foreground" : "bg-[var(--safety-car-yellow)] text-black"}
              `}
            >
              <span 
                className="block text-lg mb-1"
                style={{ fontFamily: "var(--font-pixel)" }}
              >
                {content.option1.label}
              </span>
              <span className="block text-xs opacity-80 font-normal">
                {content.option1.description}
              </span>
              
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-lg border-2 border-white/0 group-hover:border-white/50 transition-all" />
            </button>
            
            {/* Option 2 */}
            <button
              onClick={() => handleChoice("option2")}
              className={`
                group relative py-6 px-4 rounded-lg font-bold
                bg-muted text-foreground border border-border
                transition-all duration-300
                hover:scale-105 hover:bg-muted/80 hover:border-foreground/30
              `}
            >
              <span 
                className="block text-lg mb-1"
                style={{ fontFamily: "var(--font-pixel)" }}
              >
                {content.option2.label}
              </span>
              <span className="block text-xs opacity-60 font-normal">
                {content.option2.description}
              </span>
              
              {/* Hover effect */}
              <div className="absolute inset-0 rounded-lg border-2 border-white/0 group-hover:border-white/20 transition-all" />
            </button>
          </div>
        </div>

        {/* Animated border effect */}
        <div 
          className={`
            absolute inset-0 pointer-events-none rounded-xl
            border-2 animate-pulse
            ${type === "dnf" ? "border-primary/50" : "border-[var(--safety-car-yellow)]/50"}
          `} 
          style={{ animationDuration: "1.5s" }}
        />
      </div>
    </div>
  )
}
