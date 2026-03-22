"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Cloud, CloudRain, Sun, Radio, Flag, Pause, Trophy, RotateCcw } from "lucide-react"
import { PixelTrack } from "./pixel-track"

// Generate unique IDs
let messageIdCounter = 0
function generateMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${++messageIdCounter}-${Math.random().toString(36).slice(2, 7)}`
}

interface Driver {
  position: number
  name: string
  team: string
  tire: string
  gap: string
  isPlayer: boolean
  trackPosition: number
  status?: string
}

interface RadioMessage {
  id: string
  lap: number
  type: "normal" | "critical" | "weather" | "strategy"
  message: string
  timestamp: string
}

interface Track {
  id: string
  name: string
  country: string
  laps: number
  weatherChance: number
  layout: "street" | "classic" | "modern"
}

interface Team {
  id: string
  name: string
  color: string
  driver1: string
  driver2: string
}

interface BroadcastScreenProps {
  track: Track
  team: Team
  onExit: () => void
}

interface FinalResult {
  position: number
  name: string
  team: string
  gap: string
  tire: string
  isPlayer: boolean
  status: string
}

const teamColors: Record<string, string> = {
  "Red Bull": "#1E41FF",
  "Ferrari": "#DC0000",
  "McLaren": "#FF8700",
  "Mercedes": "#00D2BE",
  "Aston Martin": "#006F62",
  "Alpine": "#0090FF",
  "Williams": "#005AFF",
  "RB": "#6692FF",
  "Sauber": "#52E252",
  "Haas": "#B6BABD",
  "Audi": "#F50000"
}

const API_URL = "http://127.0.0.1:8000"

// ==================== FIREWORKS ANIMATION ====================
function Fireworks() {
  const [particles, setParticles] = useState<Array<{
    id: number
    x: number
    y: number
    color: string
    size: number
    velocityX: number
    velocityY: number
    opacity: number
    type: 'burst' | 'trail'
  }>>([])

  const particleIdRef = useRef(0)

  useEffect(() => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE']
    
    const createFirework = () => {
      const startX = Math.random() * 100
      const startY = 60 + Math.random() * 30
      const color = colors[Math.floor(Math.random() * colors.length)]
      const burstCount = 12 + Math.floor(Math.random() * 8)
      
      const newParticles: any[] = []
      for (let i = 0; i < burstCount; i++) {
        const angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.3
        const speed = 1.5 + Math.random() * 2
        newParticles.push({
          id: particleIdRef.current++,
          x: startX,
          y: startY,
          color,
          size: 3 + Math.random() * 3,
          velocityX: Math.cos(angle) * speed,
          velocityY: Math.sin(angle) * speed,
          opacity: 1,
          type: 'burst' as const
        })
      }
      
      setParticles(prev => [...prev.slice(-100), ...newParticles])
    }

    const interval = setInterval(createFirework, 800)
    createFirework()
    setTimeout(createFirework, 300)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (particles.length === 0) return
    
    const animationFrame = requestAnimationFrame(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.velocityX * 0.3,
            y: p.y + p.velocityY * 0.3 + 0.1,
            velocityY: p.velocityY + 0.05,
            opacity: p.opacity - 0.015
          }))
          .filter(p => p.opacity > 0)
      )
    })
    
    return () => cancelAnimationFrame(animationFrame)
  }, [particles])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}
    </div>
  )
}

// ==================== PIXEL PODIUM ====================
function PixelPodium({ topThree }: { topThree: FinalResult[] }) {
  const podiumOrder = [1, 0, 2] // 2nd, 1st, 3rd for visual layout
  const heights = [80, 110, 60] // Heights for 2nd, 1st, 3rd
  const positions = ['2ND', '1ST', '3RD']
  const medalColors = ['#C0C0C0', '#FFD700', '#CD7F32'] // Silver, Gold, Bronze
  
  return (
    <div className="flex items-end justify-center gap-2 mb-6">
      {podiumOrder.map((orderIndex, visualIndex) => {
        const driver = topThree[orderIndex]
        if (!driver || driver.status !== 'Racing') return null
        
        const height = heights[visualIndex]
        const position = positions[visualIndex]
        const medalColor = medalColors[visualIndex]
        const teamColor = teamColors[driver.team] || '#888'
        
        return (
          <div key={driver.name} className="flex flex-col items-center">
            {/* Medal */}
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center mb-2 border-4 shadow-lg"
              style={{ 
                backgroundColor: medalColor,
                borderColor: visualIndex === 1 ? '#B8860B' : visualIndex === 0 ? '#A8A8A8' : '#8B4513',
                boxShadow: `0 0 20px ${medalColor}40`
              }}
            >
              <Trophy className="w-5 h-5 text-white drop-shadow-md" />
            </div>
            
            {/* Driver Name */}
            <div 
              className={`text-xs font-bold mb-2 px-2 py-1 rounded ${driver.isPlayer ? 'text-primary bg-primary/20' : 'text-foreground'}`}
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              {driver.name.split(' ').pop()}
            </div>
            
            {/* Pixel Podium Block */}
            <div 
              className="relative flex flex-col items-center justify-start pt-3 transition-all duration-500"
              style={{ 
                width: '80px',
                height: `${height}px`,
                imageRendering: 'pixelated'
              }}
            >
              {/* Podium base - pixel style with team color */}
              <div 
                className="absolute inset-0 border-4 border-border"
                style={{
                  background: `linear-gradient(180deg, ${teamColor}40 0%, ${teamColor}20 100%)`,
                  boxShadow: `
                    inset 4px 4px 0 rgba(255,255,255,0.2),
                    inset -4px -4px 0 rgba(0,0,0,0.2),
                    0 4px 0 rgba(0,0,0,0.3)
                  `
                }}
              />
              
              {/* Position number - pixel style */}
              <span 
                className="relative z-10 text-2xl font-black text-foreground drop-shadow-lg"
                style={{ 
                  fontFamily: "var(--font-pixel)",
                  textShadow: '2px 2px 0 rgba(0,0,0,0.5)'
                }}
              >
                {position}
              </span>
              
              {/* Team color indicator */}
              <div 
                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-2 rounded-full"
                style={{ backgroundColor: teamColor }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function BroadcastScreen({ track, team, onExit }: BroadcastScreenProps) {
  const [currentLap, setCurrentLap] = useState(0)
  const [totalLaps, setTotalLaps] = useState(track.laps)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [radioMessages, setRadioMessages] = useState<RadioMessage[]>([])
  const [weather, setWeather] = useState<"sunny" | "cloudy" | "rain">("cloudy")
  
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [showDecision, setShowDecision] = useState(false)
  const [decisionType, setDecisionType] = useState<"pit" | "overtake">("pit")
  const [strategyCooldown, setStrategyCooldown] = useState(0)
  const [isUpdatingStrategy, setIsUpdatingStrategy] = useState(false)
  const [decisionPrompts, setDecisionPrompts] = useState<string[]>([])
  
  const [raceFinished, setRaceFinished] = useState(false)
  const [finalResults, setFinalResults] = useState<FinalResult[]>([])
  const [pushMode, setPushMode] = useState(1.0)

  const endRadioRef = useRef<HTMLDivElement>(null)

  // Start game remotely on mount
  useEffect(() => {
    const startRemoteGame = async () => {
      try {
        const res = await fetch(`${API_URL}/api/start`, { method: "POST" })
        const data = await res.json()
        if (data.status === "started") {
          setTotalLaps(data.total_laps || track.laps)
          setDrivers(data.leaderboard.map((d: any) => ({
             ...d,
             trackPosition: 1 - ((d.position - 1) * 0.05)
          })))
          setCurrentLap(1)
          const logs = data.radio_messages.map((rawMsg: any) => ({
             id: generateMessageId("msg"),
             lap: 0,
             type: rawMsg.type || "normal",
             message: rawMsg.message,
             timestamp: new Date().toLocaleTimeString("zh-CN")
          }))
          setRadioMessages(logs)
          setIsAutoPlaying(true)
        }
      } catch (e) {
        console.error("Failed to start F1 API", e)
      }
    }
    startRemoteGame()
  }, [])

  const nextLap = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/advance`, { method: "POST" })
      const data = await res.json()
      
      if (data.error) {
         console.error(data.error)
         setIsAutoPlaying(false)
         return
      }

      // Check race finish
      if (data.race_finished || data.player_dnf) {
        setIsAutoPlaying(false)
        setRaceFinished(true)
        setFinalResults(data.final_results || [])
        if (data.radio_messages?.length > 0) {
          const newLogs = data.radio_messages.map((rawMsg: any) => ({
            id: generateMessageId("msg"),
            lap: data.current_lap,
            type: rawMsg.type || "normal",
            message: rawMsg.message,
            timestamp: new Date().toLocaleTimeString("zh-CN")
          }))
          setRadioMessages(prev => [...prev, ...newLogs])
        }
        return
      }
      
      if (data.decision_required) {
        setIsAutoPlaying(false)
        setShowDecision(true)
        setDecisionType(data.decision_type || "pit")
        setDecisionPrompts(data.decision_prompts)
        // Still update radio with strategy prompts
        if (data.radio_messages?.length > 0) {
          const newLogs = data.radio_messages.map((rawMsg: any) => ({
            id: generateMessageId("msg"),
            lap: data.current_lap,
            type: rawMsg.type || "normal",
            message: rawMsg.message,
            timestamp: new Date().toLocaleTimeString("zh-CN")
          }))
          setRadioMessages(prev => [...prev, ...newLogs])
        }
      } else {
        if (data.current_lap) {
          setCurrentLap(data.current_lap)
          if (data.push_mode !== undefined) setPushMode(data.push_mode)
          setDrivers(prev => data.leaderboard.map((apiDriver: any) => {
              const old = prev.find(d => d.name === apiDriver.name)
              return {
                  ...apiDriver,
                  trackPosition: old ? (old.trackPosition + 0.033) % 1 : 1 - ((apiDriver.position - 1) * 0.05)
              }
          }))
          
          if (data.radio_messages?.length > 0) {
             const newLogs = data.radio_messages.map((rawMsg: any) => ({
                 id: generateMessageId("msg"),
                 lap: data.current_lap,
                 type: rawMsg.type === "critical" ? "critical" : rawMsg.type === "weather" ? "weather" : rawMsg.type === "strategy" ? "strategy" : "normal",
                 message: rawMsg.message,
                 timestamp: new Date().toLocaleTimeString("zh-CN")
             }))
             
             const hasRainMsg = data.radio_messages.some((m: any) => m.message.includes("雨") || m.message.includes("Rain"))
             const hasSunMsg = data.radio_messages.some((m: any) => m.message.includes("变干") || m.message.includes("晴"))
             if (hasRainMsg) setWeather("rain")
             if (hasSunMsg) setWeather("sunny")

             setRadioMessages(prev => [...prev, ...newLogs])
          }
        }
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Auto-Play Loop
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
        nextLap()
    }, 1500)
    return () => clearInterval(interval)
  }, [isAutoPlaying, nextLap])

  // Fake smooth car movement between lap jumps
  useEffect(() => {
    if (raceFinished) return
    if (!isAutoPlaying && !showDecision) return
    const interval = setInterval(() => {
      setDrivers(prev => prev.map(d => ({
        ...d,
        trackPosition: (d.trackPosition + 0.003 + (d.position === 1 ? 0.001 : 0)) % 1
      })))
    }, 100)
    return () => clearInterval(interval)
  }, [isAutoPlaying, showDecision, raceFinished])

  // Auto-scroll radio feed
  useEffect(() => {
    endRadioRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [radioMessages])

  const submitDecision = async (choice: string, tire?: string) => {
    try {
      const body = { action: choice, tire: tire || "" }
      await fetch(`${API_URL}/api/decision`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(body)
      })
      setShowDecision(false)
      setIsAutoPlaying(true)
    } catch (e) {
      console.error(e)
    }
  }

  const submitStrategyChange = async (action: string) => {
    if (strategyCooldown > 0 || isUpdatingStrategy) return
    setIsUpdatingStrategy(true)
    try {
      const res = await fetch(`${API_URL}/api/strategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      })
      const data = await res.json()
      if (data.push_mode) {
        const m = data.push_mode
        setPushMode(m < 1.0 ? 0.997 : m > 1.0 ? 1.006 : 1.0)
      }
      if (typeof data.strategy_cooldown === 'number') {
        setStrategyCooldown(data.strategy_cooldown)
      }
      
    } catch (e) {
      console.error("Strategy update failed", e)
    } finally {
      setIsUpdatingStrategy(false)
    }
  }

  const cars = drivers.slice(0, 10).map(d => ({
    id: d.name,
    name: d.name,
    color: teamColors[d.team] || "#888",
    position: d.trackPosition,
    isPlayer: d.isPlayer
  }))

  const WeatherIcon = weather === "rain" ? CloudRain : weather === "cloudy" ? Cloud : Sun

  // ==================== RESULTS SCREEN ====================
  if (raceFinished) {
    const playerResult = finalResults.find(r => r.isPlayer)
    const topThree = finalResults.filter(r => r.status === 'Racing').slice(0, 3)
    
    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden relative">
        {/* Fireworks Animation */}
        <Fireworks />
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none z-0"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)`
          }}
        />

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Trophy className="w-6 h-6 text-yellow-500 animate-bounce" />
            <h1 className="text-primary text-lg tracking-wider font-black" style={{ fontFamily: "var(--font-pixel)" }}>
              RACE RESULTS — {track.name.toUpperCase()} GP
            </h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 rounded border border-primary/50">
            <Flag className="w-4 h-4 text-primary" />
            <span className="text-xs text-primary font-bold" style={{ fontFamily: "var(--font-pixel)" }}>FINISHED</span>
          </div>
        </header>

        {/* Results Content */}
        <div className="relative z-10 flex-1 flex overflow-hidden">
          {/* Main Results Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Pixel Podium for Top 3 */}
            {topThree.length >= 3 && (
              <div className="mb-8">
                <h2 className="text-xs text-center text-muted-foreground tracking-[0.2em] mb-4 font-bold" style={{ fontFamily: "var(--font-pixel)" }}>
                  PODIUM
                </h2>
                <PixelPodium topThree={topThree} />
              </div>
            )}

            {/* Player summary card */}
            {playerResult && (
              <div className="mb-6 p-5 bg-primary/10 border-2 border-primary/40 rounded-xl relative overflow-hidden">
                {/* Decorative pixel corners */}
                <div className="absolute top-0 left-0 w-3 h-3 bg-primary" />
                <div className="absolute top-0 right-0 w-3 h-3 bg-primary" />
                <div className="absolute bottom-0 left-0 w-3 h-3 bg-primary" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary" />
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground tracking-widest" style={{ fontFamily: "var(--font-pixel)" }}>YOUR FINISH</span>
                    <div className="flex items-center gap-4 mt-2">
                      {/* Medal for player if top 3 */}
                      {playerResult.status === "Racing" && playerResult.position <= 3 && (
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center border-4 shadow-lg animate-pulse"
                          style={{ 
                            backgroundColor: playerResult.position === 1 ? '#FFD700' : playerResult.position === 2 ? '#C0C0C0' : '#CD7F32',
                            borderColor: playerResult.position === 1 ? '#B8860B' : playerResult.position === 2 ? '#A8A8A8' : '#8B4513',
                            boxShadow: `0 0 30px ${playerResult.position === 1 ? '#FFD70060' : playerResult.position === 2 ? '#C0C0C060' : '#CD7F3260'}`
                          }}
                        >
                          <Trophy className="w-6 h-6 text-white drop-shadow-md" />
                        </div>
                      )}
                      <span className="text-5xl font-black text-primary" style={{ fontFamily: "var(--font-pixel)" }}>
                        {playerResult.status === "Racing" ? `P${playerResult.position}` : "DNF"}
                      </span>
                      <div>
                        <p className="text-foreground font-bold text-lg">{playerResult.name}</p>
                        <p className="text-muted-foreground text-sm">{playerResult.team} · {playerResult.gap}</p>
                      </div>
                    </div>
                  </div>
                  <TireBadge compound={playerResult.tire} />
                </div>
              </div>
            )}

            {/* Full classification */}
            <h2 className="text-xs text-muted-foreground tracking-[0.2em] mb-3 font-bold" style={{ fontFamily: "var(--font-pixel)" }}>
              FINAL CLASSIFICATION
            </h2>
            <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[50px_1fr_140px_80px_60px] px-4 py-2 bg-muted/50 text-[10px] text-muted-foreground tracking-widest font-bold border-b border-border"
                style={{ fontFamily: "var(--font-pixel)" }}>
                <span>POS</span>
                <span>DRIVER</span>
                <span>TEAM</span>
                <span>GAP</span>
                <span>TIRE</span>
              </div>
              {/* Table rows */}
              {finalResults.map((r, i) => (
                <div key={r.name}
                  className={`grid grid-cols-[50px_1fr_140px_80px_60px] px-4 py-3 items-center border-b border-border/30 transition-colors ${
                    r.isPlayer ? "bg-primary/15 border-l-4 border-l-primary" : i % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                  }`}
                >
                  {/* Position with Medal for Top 3 */}
                  <span className="flex items-center gap-1">
                    {r.status === "Racing" && r.position <= 3 ? (
                      <span 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ 
                          backgroundColor: r.position === 1 ? '#FFD700' : r.position === 2 ? '#C0C0C0' : '#CD7F32',
                          boxShadow: `0 0 8px ${r.position === 1 ? '#FFD70050' : r.position === 2 ? '#C0C0C050' : '#CD7F3250'}`
                        }}
                      >
                        {r.position}
                      </span>
                    ) : (
                      <span className={`text-sm font-bold ${r.status !== "Racing" ? "text-muted-foreground" : "text-muted-foreground"}`}>
                        {r.status === "Racing" ? r.position : "DNF"}
                      </span>
                    )}
                  </span>
                  <span className={`text-sm font-medium ${r.isPlayer ? "text-primary font-bold" : "text-foreground"}`}>
                    <span className="w-1.5 h-4 rounded-full inline-block mr-2" style={{ backgroundColor: teamColors[r.team] || '#888' }} />
                    {r.name} {r.isPlayer && "(YOU)"}
                  </span>
                  <span className="text-xs text-muted-foreground">{r.team}</span>
                  <span className={`text-xs font-medium ${r.gap === "Winner" ? "text-yellow-400 font-bold" : r.gap === "DNF" ? "text-red-400" : "text-muted-foreground"}`}>
                    {r.gap}
                  </span>
                  <TireBadge compound={r.tire} />
                </div>
              ))}
            </div>

            {/* Back button */}
            <div className="flex justify-center mt-8">
              <button
                onClick={onExit}
                className="flex items-center gap-3 px-10 py-4 bg-primary text-primary-foreground font-bold rounded-lg transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(220,0,0,0.4)]"
                style={{ fontFamily: "var(--font-pixel)" }}
              >
                <RotateCcw className="w-5 h-5" />
                BACK TO TRACK SELECT
              </button>
            </div>
          </div>

          {/* Right: Race Radio Log */}
          <aside className="w-72 border-l border-border bg-card/50 backdrop-blur-sm flex flex-col">
            <div className="p-3 border-b border-border flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary" />
              <h2 className="text-[10px] text-muted-foreground tracking-[0.15em] font-bold" style={{ fontFamily: "var(--font-pixel)" }}>
                RACE LOG
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {radioMessages.slice(-20).map((msg) => (
                <div key={msg.id} className={`text-xs tracking-wide ${
                  msg.type === "critical" ? "text-primary font-bold" :
                  msg.type === "weather" ? "text-blue-400" :
                  msg.type === "strategy" ? "text-yellow-400" :
                  "text-foreground/70"
                }`}>
                  <span className="text-muted-foreground mr-2">L{msg.lap}</span>
                  {msg.message}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    )
  }

  // ==================== RACE BROADCAST SCREEN ====================
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      {/* Carbon fiber background */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.03) 2px,
            rgba(255,255,255,0.03) 4px
          )`
        }}
      />

      {/* Top Bar - F1 TV Style */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onExit}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← 退出
          </button>
          <div className="h-6 w-px bg-border" />
          <h1 
            className="text-primary text-sm tracking-wider"
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            {track.name.toUpperCase()} GP
          </h1>
        </div>

        {/* Broadcast Status Indicator */}
        <div className="flex items-center gap-3">
            {isAutoPlaying ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded border border-green-500/50">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-500 font-bold tracking-widest" style={{ fontFamily: "var(--font-pixel)" }}>🟢 LIVE</span>
                </div>
            ) : showDecision ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded border border-red-500/50 animate-pulse">
                    <Pause className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-red-500 font-bold tracking-widest" style={{ fontFamily: "var(--font-pixel)" }}>⏸️ DECISION</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded border border-border">
                    <Pause className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-bold tracking-widest" style={{ fontFamily: "var(--font-pixel)" }}>PAUSED</span>
                </div>
            )}
        </div>

        <div className="flex items-center gap-6">
          {/* Lap counter */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">LAP</span>
            <span 
              className="text-foreground text-lg font-bold"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              {currentLap}
            </span>
            <span className="text-muted-foreground text-xs">/ {totalLaps}</span>
          </div>

          {/* Weather */}
          <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded">
            <WeatherIcon className={`w-5 h-5 ${weather === "rain" ? "text-[var(--weather-blue)]" : weather === "sunny" ? "text-[var(--safety-car-yellow)]" : "text-muted-foreground"}`} />
            <span className="text-xs text-muted-foreground">
              {weather === "rain" ? "雨天" : weather === "cloudy" ? "多云" : "晴天"}
            </span>
          </div>

          {/* Flag status */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[var(--green-flag)]/20 rounded border border-[var(--green-flag)]/50">
            <Flag className="w-4 h-4 text-[var(--green-flag)]" />
            <span className="text-xs text-[var(--green-flag)] font-medium">绿旗</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* Left Panel - Live Timing */}
        <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-sm overflow-y-auto">
          <div className="sticky top-0 p-3 border-b border-border bg-card z-10">
            <h2 
              className="text-[10px] text-muted-foreground tracking-[0.15em]"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              LIVE TIMING
            </h2>
          </div>
          
          <div className="flex-1 relative pb-4 overflow-y-auto" style={{ height: `${drivers.length * 42}px` }}>
            {drivers.map((driver, index) => (
              <div 
                key={driver.name}
                className={`absolute w-full flex items-center gap-2 px-3 py-2 transition-all duration-500 ease-in-out border-b border-border/10 ${
                  driver.isPlayer ? "bg-primary/20 border-l-4 border-primary" : ""
                }`}
                style={{ top: `${index * 42}px`, height: "42px" }}
              >
                <span className={`w-6 text-center text-sm font-bold ${
                  driver.position <= 3 ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {driver.position}
                </span>
                <div 
                  className="w-1 h-6 rounded-full"
                  style={{ backgroundColor: teamColors[driver.team] || '#888' }}
                />
                <span className={`flex-1 text-sm font-medium ${
                  driver.isPlayer ? "text-primary font-bold" : "text-foreground"
                }`}>
                  {driver.name} 
                  {driver.isPlayer && " (YOU)"}
                </span>
                <TireBadge compound={driver.tire} />
                <span className="text-xs text-muted-foreground w-14 text-right">
                  {driver.gap}
                </span>
              </div>
            ))}
          </div>

          {/* Permanent Strategy Controls */}
          <div className="p-3 border-t border-border bg-card/80">
            <h3 className="text-[9px] text-muted-foreground font-pixel mb-2 tracking-widest uppercase flex justify-between items-center">
              STRATEGY CONTROL
              {strategyCooldown > 0 && <span className="text-primary animate-pulse">LOCKED</span>}
            </h3>
            <div className="grid grid-cols-3 gap-1.5">
              <button 
                onClick={() => submitStrategyChange("push")}
                disabled={strategyCooldown > 0 || isUpdatingStrategy}
                className={`py-2 text-[8px] font-bold rounded transition-all ${
                  strategyCooldown > 0 ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-105'
                } ${
                  pushMode < 1.0 ? 'bg-red-600 text-white ring-1 ring-red-400' : 'bg-red-950/40 text-red-500 hover:bg-red-900/60'
                }`}
                style={{ fontFamily: "var(--font-pixel)" }}>
                PUSH
              </button>
              <button 
                onClick={() => submitStrategyChange("neutral")}
                disabled={strategyCooldown > 0 || isUpdatingStrategy}
                className={`py-2 text-[8px] font-bold rounded transition-all ${
                  strategyCooldown > 0 ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-105'
                } ${
                  pushMode === 1.0 ? 'bg-gray-500 text-white ring-1 ring-gray-400' : 'bg-gray-900/40 text-gray-400 hover:bg-gray-800/60'
                }`}
                style={{ fontFamily: "var(--font-pixel)" }}>
                STD
              </button>
              <button 
                onClick={() => submitStrategyChange("defend")}
                disabled={strategyCooldown > 0 || isUpdatingStrategy}
                className={`py-2 text-[8px] font-bold rounded transition-all ${
                  strategyCooldown > 0 ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-105'
                } ${
                  pushMode > 1.0 ? 'bg-blue-600 text-white ring-1 ring-blue-400' : 'bg-blue-950/40 text-blue-500 hover:bg-blue-900/60'
                }`}
                style={{ fontFamily: "var(--font-pixel)" }}>
                DEFEND
              </button>
            </div>
            {strategyCooldown > 0 && (
              <p className="text-[7px] text-muted-foreground mt-1 text-center font-pixel opacity-50">
                LOCKED FOR NEXT {strategyCooldown} LAP(S)
              </p>
            )}
          </div>
        </aside>

        {/* Center - Pixel Track */}
        <main className="flex-1 flex flex-col p-4">
          <div className="flex-1 relative border border-border bg-black/40 rounded-xl overflow-hidden shadow-2xl">
            <PixelTrack 
              cars={cars} 
              trackType={track.id} 
            />
            
            {/* Radio Feed Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-6 pt-16">
              <div className="flex items-center gap-2 mb-3">
                <Radio className="w-5 h-5 text-primary animate-pulse" />
                <span 
                  className="text-xs text-muted-foreground tracking-widest font-bold"
                  style={{ fontFamily: "var(--font-pixel)" }}
                >
                  TEAM RADIO FEED
                </span>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                {radioMessages.slice(-5).map((msg) => (
                  <div 
                    key={msg.id}
                    className={`text-sm tracking-wide ${
                      msg.type === "critical" ? "text-primary font-bold" :
                      msg.type === "weather" ? "text-[var(--weather-blue)]" :
                      msg.type === "strategy" ? "text-yellow-400" :
                      "text-foreground/90"
                    }`}
                  >
                    <span className="text-muted-foreground text-xs mr-3 inline-block w-8">L{msg.lap}</span>
                    <span className="opacity-75 text-xs mr-2">[{msg.timestamp}]</span>
                    {msg.message}
                  </div>
                ))}
                <div ref={endRadioRef} />
              </div>
            </div>
          </div>
        </main>

        {/* Right Panel - Decision (Non-blocking sidebar, slides in when needed) */}
        <aside className={`transition-all duration-500 ease-in-out border-l border-border bg-card/80 backdrop-blur-lg overflow-y-auto flex flex-col ${
          showDecision ? "w-80 opacity-100" : "w-0 opacity-0 overflow-hidden"
        }`}>
          {showDecision && (
            <div className="p-4 flex flex-col gap-4 min-w-[320px]">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold tracking-[0.15em] ${decisionType === "overtake" ? "text-yellow-400" : "text-primary"}`} style={{ fontFamily: "var(--font-pixel)" }}>
                  {decisionType === "overtake" ? "OVERTAKE WINDOW" : "STRATEGY CALL"}
                </span>
                <div className={`w-2.5 h-2.5 rounded-full animate-ping ${decisionType === "overtake" ? "bg-yellow-400" : "bg-primary"}`} />
              </div>

              {/* Prompts */}
              <div className={`space-y-2 bg-black/30 p-3 rounded-lg border ${decisionType === "overtake" ? "border-yellow-400/30" : "border-primary/30"}`}>
                {decisionPrompts.map((p, i) => (
                  <p key={i} className="text-foreground text-xs font-medium leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>

              {decisionType === "pit" ? (
                <>
                  {/* Tire Options */}
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-2" style={{ fontFamily: "var(--font-pixel)" }}>
                    PIT STOP TIRE:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => submitDecision("box", "Soft")}
                      className="py-2.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded transition-all hover:scale-105"
                      style={{ fontFamily: "var(--font-pixel)" }}>
                      SOFT
                    </button>
                    <button onClick={() => submitDecision("box", "Medium")}
                      className="py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-bold rounded transition-all hover:scale-105"
                      style={{ fontFamily: "var(--font-pixel)" }}>
                      MEDIUM
                    </button>
                    <button onClick={() => submitDecision("box", "Hard")}
                      className="py-2.5 bg-white hover:bg-gray-200 text-black text-[10px] font-bold rounded transition-all hover:scale-105"
                      style={{ fontFamily: "var(--font-pixel)" }}>
                      HARD
                    </button>
                    <button onClick={() => submitDecision("box", "Intermediate")}
                      className="py-2.5 bg-green-500 hover:bg-green-400 text-white text-[10px] font-bold rounded transition-all hover:scale-105"
                      style={{ fontFamily: "var(--font-pixel)" }}>
                      INTER
                    </button>
                  </div>
                  <button onClick={() => submitDecision("box", "Wet")}
                    className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded transition-all hover:scale-105 w-full"
                    style={{ fontFamily: "var(--font-pixel)" }}>
                    FULL WET
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-border" />
                    <span className="flex-shrink-0 mx-3 text-muted-foreground text-[10px] uppercase">OR</span>
                    <div className="flex-grow border-t border-border" />
                  </div>

                  <button onClick={() => submitDecision("stay")}
                    className="w-full py-3 bg-transparent border-2 border-muted-foreground text-foreground hover:border-foreground hover:bg-foreground/5 text-xs font-bold rounded transition-all"
                    style={{ fontFamily: "var(--font-pixel)" }}>
                    STAY OUT
                  </button>
                </>
              ) : (
                <>
                  {/* Overtake Options */}
                  <div className="grid grid-cols-1 gap-3 mt-4">
                    <button onClick={() => submitDecision("overtake")}
                      className="py-4 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black rounded-lg transition-all hover:scale-105 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                      style={{ fontFamily: "var(--font-pixel)" }}>
                      ⚡ DIVEBOMB (ATTACK)
                    </button>
                    <button onClick={() => submitDecision("abort_overtake")}
                      className="py-4 bg-transparent border-2 border-muted-foreground text-foreground hover:border-foreground hover:bg-foreground/5 text-xs font-bold rounded-lg transition-all"
                      style={{ fontFamily: "var(--font-pixel)" }}>
                      🛡️ HOLD POSITION
                    </button>
                  </div>
                </>
              )}

              {/* Driving Mode */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-border" />
                <span className="flex-shrink-0 mx-3 text-muted-foreground text-[10px] uppercase">DRIVING MODE</span>
                <div className="flex-grow border-t border-border" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setPushMode(0.95)}
                  className={`py-2.5 text-[10px] font-bold rounded transition-all hover:scale-105 ${
                    pushMode < 1.0 ? 'bg-red-600 text-white ring-2 ring-red-400' : 'bg-red-600/30 text-red-400 hover:bg-red-600/50'
                  }`}
                  style={{ fontFamily: "var(--font-pixel)" }}>
                  🔥 PUSH
                </button>
                <button onClick={() => setPushMode(1.0)}
                  className={`py-2.5 text-[10px] font-bold rounded transition-all hover:scale-105 ${
                    pushMode === 1.0 ? 'bg-gray-500 text-white ring-2 ring-gray-400' : 'bg-gray-500/30 text-gray-400 hover:bg-gray-500/50'
                  }`}
                  style={{ fontFamily: "var(--font-pixel)" }}>
                  ⚖️ STD
                </button>
                <button onClick={() => setPushMode(1.05)}
                  className={`py-2.5 text-[10px] font-bold rounded transition-all hover:scale-105 ${
                    pushMode > 1.0 ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-blue-600/30 text-blue-400 hover:bg-blue-600/50'
                  }`}
                  style={{ fontFamily: "var(--font-pixel)" }}>
                  🛡️ DEFEND
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function TireBadge({ compound }: { compound: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    S: { bg: "bg-red-500", text: "text-white" },
    M: { bg: "bg-yellow-400", text: "text-black" },
    H: { bg: "bg-white", text: "text-black" },
    I: { bg: "bg-green-500", text: "text-white" },
    W: { bg: "bg-blue-500", text: "text-white" },
  }
  const style = colors[compound] || colors.M

  return (
    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${style.bg} ${style.text}`}>
      {compound}
    </span>
  )
}
