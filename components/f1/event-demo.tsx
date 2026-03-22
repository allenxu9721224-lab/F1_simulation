"use client"

import { useState, useCallback } from "react"
import { DynamicBackground, type SceneState } from "./dynamic-background"
import { TeamRadioPopup, type RadioEventType } from "./team-radio-popup"
import { DecisionOverlay, type DecisionType } from "./decision-overlay"
import { Flag, Radio, AlertTriangle } from "lucide-react"

interface EventDemoProps {
  onExit?: () => void
}

export function EventDemo({ onExit }: EventDemoProps) {
  const [sceneState, setSceneState] = useState<SceneState>("racing")
  const [showRadio, setShowRadio] = useState(false)
  const [showDecision, setShowDecision] = useState(false)
  const [currentEventType, setCurrentEventType] = useState<RadioEventType>("racing")
  const [lastDecision, setLastDecision] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const triggerEvent = useCallback((type: SceneState) => {
    // Prevent rapid clicking during transitions
    if (isTransitioning) return
    
    setIsTransitioning(true)
    setShowDecision(false)
    setShowRadio(false)
    setLastDecision(null)
    
    // Transition to new scene
    setTimeout(() => {
      setSceneState(type)
      setCurrentEventType(type as RadioEventType)
      
      // Show radio popup after background change
      setTimeout(() => {
        setShowRadio(true)
        setIsTransitioning(false)
      }, 500)
    }, 300)
  }, [isTransitioning])

  const handleRadioComplete = useCallback(() => {
    // Show decision overlay after radio popup for pit/dnf events
    if (sceneState === "pit" || sceneState === "dnf") {
      setTimeout(() => {
        setShowDecision(true)
      }, 500)
    }
    setShowRadio(false)
  }, [sceneState])

  const handleDecision = useCallback((choice: "option1" | "option2") => {
    setShowDecision(false)
    
    const decisionTexts = {
      pit: {
        option1: "Driver confirmed: BOX BOX - Pitting for fresh tires",
        option2: "Driver confirmed: STAY OUT - Defending position",
      },
      dnf: {
        option1: "Driver confirmed: Retiring the car to save engine",
        option2: "Driver confirmed: PUSHING - Going for broke!",
      },
    }
    
    const type = sceneState as "pit" | "dnf"
    setLastDecision(decisionTexts[type]?.[choice] || "Decision made")
    
    // Return to racing after a delay
    setTimeout(() => {
      setSceneState("racing")
      setLastDecision(null)
    }, 3000)
  }, [sceneState])

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Layer 1: Dynamic Background */}
      <div className="absolute inset-0 transition-all duration-700">
        <DynamicBackground state={sceneState} />
      </div>

      {/* Layer 2: Team Radio Popup */}
      <TeamRadioPopup 
        eventType={currentEventType}
        isVisible={showRadio}
        onComplete={handleRadioComplete}
      />

      {/* Layer 3: Decision Overlay */}
      {(sceneState === "pit" || sceneState === "dnf") && (
        <DecisionOverlay
          type={sceneState as DecisionType}
          isVisible={showDecision}
          onDecision={handleDecision}
          timeLimit={10}
        />
      )}

      {/* Top Status Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-4">
          {onExit && (
            <button 
              onClick={onExit}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Exit Demo
            </button>
          )}
          <div className="h-6 w-px bg-border" />
          <h1 
            className="text-primary text-sm tracking-wider"
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            EVENT INTERRUPT DEMO
          </h1>
        </div>

        {/* State indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Current State:</span>
          <span 
            className={`
              px-3 py-1 rounded text-xs font-bold uppercase
              ${sceneState === "racing" ? "bg-[var(--green-flag)] text-white" : ""}
              ${sceneState === "pit" ? "bg-[var(--safety-car-yellow)] text-black" : ""}
              ${sceneState === "dnf" ? "bg-primary text-primary-foreground" : ""}
            `}
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            {sceneState}
          </span>
        </div>
      </div>

      {/* Decision Result Toast */}
      {lastDecision && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-card border border-primary px-6 py-3 rounded-lg shadow-[0_0_20px_rgba(220,0,0,0.3)]">
            <p className="text-sm text-foreground">{lastDecision}</p>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card/95 border border-border rounded-xl p-4 backdrop-blur-sm shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span 
                className="text-xs text-muted-foreground tracking-widest"
                style={{ fontFamily: "var(--font-pixel)" }}
              >
                TESTING CONTROLS
              </span>
              <span className="text-xs text-muted-foreground">
                Click to trigger different race events
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {/* Normal Racing Button */}
              <button
                onClick={() => triggerEvent("racing")}
                disabled={isTransitioning}
                className={`
                  flex flex-col items-center gap-2 py-4 px-4 rounded-lg
                  transition-all duration-300
                  ${sceneState === "racing" 
                    ? "bg-[var(--green-flag)] text-white" 
                    : "bg-muted text-foreground hover:bg-[var(--green-flag)]/20"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <Flag className="w-6 h-6" />
                <span className="text-xs font-bold" style={{ fontFamily: "var(--font-pixel)" }}>
                  RACING
                </span>
                <span className="text-[10px] opacity-70">Normal State</span>
              </button>

              {/* Pit Stop Button */}
              <button
                onClick={() => triggerEvent("pit")}
                disabled={isTransitioning}
                className={`
                  flex flex-col items-center gap-2 py-4 px-4 rounded-lg
                  transition-all duration-300
                  ${sceneState === "pit" 
                    ? "bg-[var(--safety-car-yellow)] text-black" 
                    : "bg-muted text-foreground hover:bg-[var(--safety-car-yellow)]/20"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <Radio className="w-6 h-6" />
                <span className="text-xs font-bold" style={{ fontFamily: "var(--font-pixel)" }}>
                  PIT STOP
                </span>
                <span className="text-[10px] opacity-70">Strategy Call</span>
              </button>

              {/* DNF Button */}
              <button
                onClick={() => triggerEvent("dnf")}
                disabled={isTransitioning}
                className={`
                  flex flex-col items-center gap-2 py-4 px-4 rounded-lg
                  transition-all duration-300
                  ${sceneState === "dnf" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-foreground hover:bg-primary/20"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <AlertTriangle className="w-6 h-6" />
                <span className="text-xs font-bold" style={{ fontFamily: "var(--font-pixel)" }}>
                  DNF EVENT
                </span>
                <span className="text-[10px] opacity-70">Critical Failure</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cinematic letterbox bars */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-black pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-black pointer-events-none" />
    </div>
  )
}
