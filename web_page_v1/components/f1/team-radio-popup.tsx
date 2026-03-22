"use client"

import { useEffect, useState } from "react"

export type RadioEventType = "racing" | "pit" | "dnf"

interface TeamRadioPopupProps {
  eventType: RadioEventType
  isVisible: boolean
  onComplete?: () => void
}

// Meme-worthy radio messages for each event type
const radioMessages: Record<RadioEventType, string[]> = {
  racing: [
    "Keep pushing, we are looking good.",
    "Gap is stable, hold position.",
    "Tires are looking fine, stay out.",
  ],
  pit: [
    "Box now, Box now... wait, stay out! Actually, box.",
    "Okay we are boxing. Softs ready. No wait, Mediums!",
    "IN IN IN IN IN... Sorry, stay out, stay out!",
    "Box this lap. Actually next lap. No, this lap!",
  ],
  dnf: [
    "Is there a leakage?!",
    "Stop the car, stop the car!",
    "Something's wrong. Turn off the engine!",
    "We have smoke. Park it, park it!",
    "Engine, engine! Slow button ON!",
  ],
}

export function TeamRadioPopup({ eventType, isVisible, onComplete }: TeamRadioPopupProps) {
  const [message, setMessage] = useState("")
  const [showWaveform, setShowWaveform] = useState(false)

  useEffect(() => {
    if (isVisible) {
      const messages = radioMessages[eventType]
      setMessage(messages[Math.floor(Math.random() * messages.length)])
      setShowWaveform(true)
      
      // Auto-hide waveform after animation
      const timer = setTimeout(() => {
        setShowWaveform(false)
        onComplete?.()
      }, 4000)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, eventType, onComplete])

  if (!isVisible) return null

  return (
    <div 
      className={`
        absolute bottom-20 left-4 z-40
        transition-all duration-500 ease-out
        ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"}
      `}
    >
      <div className="relative bg-card/95 border-2 border-primary rounded-lg overflow-hidden shadow-[0_0_30px_rgba(220,0,0,0.4)] max-w-sm">
        {/* F1 TV Style Header */}
        <div className="flex items-center gap-2 px-3 py-2 bg-primary">
          <span 
            className="text-[10px] text-primary-foreground tracking-widest font-bold"
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            TEAM RADIO
          </span>
          {showWaveform && (
            <div className="flex items-center gap-0.5 h-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary-foreground rounded-full animate-pulse"
                  style={{
                    height: `${8 + Math.random() * 12}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "0.3s",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-start gap-3 p-4">
          {/* Pixel Art Avatar */}
          <div className="shrink-0">
            <PixelEngineer eventType={eventType} />
          </div>

          {/* Message */}
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "var(--font-pixel)" }}>
              {eventType === "dnf" ? "DRIVER" : "ENGINEER"}
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Animated border glow */}
        <div className="absolute inset-0 pointer-events-none border-2 border-primary/50 rounded-lg animate-pulse" />
      </div>
    </div>
  )
}

// Pixel art engineer/driver avatar
function PixelEngineer({ eventType }: { eventType: RadioEventType }) {
  const isDriver = eventType === "dnf"
  
  return (
    <svg 
      width="48" 
      height="48" 
      viewBox="0 0 16 16" 
      className="rounded-lg bg-muted/50"
      style={{ imageRendering: "pixelated" }}
    >
      {isDriver ? (
        // Driver helmet
        <>
          {/* Helmet base */}
          <rect x="3" y="2" width="10" height="10" fill="#DC0000" />
          <rect x="4" y="3" width="8" height="8" fill="#FF3333" />
          {/* Visor */}
          <rect x="4" y="5" width="8" height="4" fill="#1a1a2e" />
          <rect x="5" y="6" width="6" height="2" fill="#333" />
          {/* Helmet stripe */}
          <rect x="7" y="2" width="2" height="8" fill="white" />
          {/* Neck */}
          <rect x="6" y="12" width="4" height="2" fill="#333" />
        </>
      ) : (
        // Engineer with headphones
        <>
          {/* Head */}
          <rect x="5" y="3" width="6" height="6" fill="#f5d0c5" />
          {/* Hair */}
          <rect x="5" y="3" width="6" height="2" fill="#333" />
          {/* Eyes */}
          <rect x="6" y="5" width="1" height="1" fill="#333" />
          <rect x="9" y="5" width="1" height="1" fill="#333" />
          {/* Headphones */}
          <rect x="4" y="4" width="1" height="4" fill="#444" />
          <rect x="11" y="4" width="1" height="4" fill="#444" />
          <rect x="4" y="3" width="8" height="1" fill="#555" />
          {/* Mic */}
          <rect x="3" y="6" width="2" height="1" fill="#666" />
          {/* Shirt */}
          <rect x="4" y="9" width="8" height="5" fill="#DC0000" />
          <rect x="7" y="9" width="2" height="3" fill="white" />
        </>
      )}
    </svg>
  )
}
