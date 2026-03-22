"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, CloudRain, Sun, Cloud } from "lucide-react"

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

const tracks: Track[] = [
  { id: "monza", name: "Monza", country: "意大利", laps: 53, weatherChance: 20, layout: "classic" },
  { id: "shanghai", name: "Shanghai", country: "中国", laps: 56, weatherChance: 35, layout: "modern" },
  { id: "silverstone", name: "Silverstone", country: "英国", laps: 52, weatherChance: 45, layout: "classic" },
  { id: "singapore", name: "Singapore", country: "新加坡", laps: 62, weatherChance: 25, layout: "street" },
  { id: "spa", name: "Spa", country: "比利时", laps: 44, weatherChance: 50, layout: "classic" },
  { id: "suzuka", name: "Suzuka", country: "日本", laps: 53, weatherChance: 30, layout: "classic" },
]

const teams: Team[] = [
  { id: "ferrari", name: "Ferrari", color: "#DC0000", driver1: "LEC", driver2: "SAI" },
  { id: "redbull", name: "Red Bull", color: "#1E41FF", driver1: "VER", driver2: "PER" },
  { id: "mercedes", name: "Mercedes", color: "#00D2BE", driver1: "HAM", driver2: "RUS" },
  { id: "mclaren", name: "McLaren", color: "#FF8700", driver1: "NOR", driver2: "PIA" },
  { id: "astonmartin", name: "Aston Martin", color: "#006F62", driver1: "ALO", driver2: "STR" },
  { id: "alpine", name: "Alpine", color: "#0090FF", driver1: "GAS", driver2: "OCO" },
]

interface StartScreenProps {
  onStartRace: (track: Track, team: Team) => void
  onOpenDemo?: () => void
}

export function StartScreen({ onStartRace, onOpenDemo }: StartScreenProps) {
  const [selectedTrack, setSelectedTrack] = useState(tracks[0])
  const [selectedTeam, setSelectedTeam] = useState(teams[0])
  const [isPulsing, setIsPulsing] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollTracks = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 280
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden border-2 border-primary/20">
      {/* Carbon fiber background pattern */}
      <div 
        className="absolute inset-0 opacity-5"
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

      {/* Header */}
      <header className="relative z-10 border-b border-border p-6 bg-card/30 backdrop-blur-sm">
        <h1 
          className="text-center text-primary text-3xl tracking-widest font-black italic"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          F1 STRATEGY
        </h1>
        <p className="text-center text-muted-foreground text-xs mt-2 tracking-[0.4em] uppercase font-bold">
          Team Principal Mode // VER 1.0
        </p>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col justify-center p-6 gap-6 max-w-6xl mx-auto w-full">
        {/* Track Selection */}
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 
              className="text-[10px] text-muted-foreground tracking-[0.3em] uppercase font-bold"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              / SELECT GRAND PRIX /
            </h2>
            <div className="h-[1px] flex-1 bg-border mx-4 opacity-50" />
            <span className="text-[10px] text-primary/50 font-mono">01 - TRACKS</span>
          </div>
          
          <div className="relative group">
            <button
              onClick={() => scrollTracks("left")}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center hover:bg-primary/20 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0"
            >
              <ChevronLeft className="w-6 h-6 text-primary" />
            </button>
            
            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide px-2 py-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {tracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  isSelected={selectedTrack.id === track.id}
                  onClick={() => setSelectedTrack(track)}
                />
              ))}
            </div>

            <button
              onClick={() => scrollTracks("right")}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center hover:bg-primary/20 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
            >
              <ChevronRight className="w-6 h-6 text-primary" />
            </button>
          </div>
        </section>

        {/* Team Selection */}
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 
              className="text-[10px] text-muted-foreground tracking-[0.3em] uppercase font-bold"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              / SELECT TEAM /
            </h2>
            <div className="h-[1px] flex-1 bg-border mx-4 opacity-50" />
            <span className="text-[10px] text-primary/50 font-mono">02 - TEAMS</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                isSelected={selectedTeam.id === team.id}
                onClick={() => setSelectedTeam(team)}
              />
            ))}
          </div>
        </section>

        {/* Start Button */}
        <div className="flex justify-center pt-6">
          <div className="relative group">
            <div className={`absolute -inset-4 bg-primary/20 blur-2xl rounded-full transition-all duration-500 opacity-0 group-hover:opacity-100 ${isPulsing ? "animate-pulse" : ""}`} />
            <button
              onClick={() => onStartRace(selectedTrack, selectedTeam)}
              onMouseEnter={() => setIsPulsing(false)}
              onMouseLeave={() => setIsPulsing(true)}
              className={`
                relative px-20 py-5 bg-primary text-primary-foreground
                border-2 border-white/20 overflow-hidden
                transition-all duration-300 transform
                hover:scale-105 active:scale-95
                shadow-[0_0_50px_rgba(220,0,0,0.3)]
                hover:shadow-[0_0_80px_rgba(220,0,0,0.5)]
              `}
              style={{ 
                fontFamily: "var(--font-pixel)",
                clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0% 100%)"
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer" />
              <span className="text-xl tracking-[0.2em] font-black italic">START RACE</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="relative z-10 border-t border-border p-4 bg-card/50 backdrop-blur-md flex items-center justify-between px-12">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[8px] text-muted-foreground uppercase tracking-widest">Selected Track</span>
            <span className="text-[10px] text-foreground font-bold uppercase">{selectedTrack.name} GP</span>
          </div>
          <div className="w-[1px] h-6 bg-border opacity-50" />
          <div className="flex flex-col">
            <span className="text-[8px] text-muted-foreground uppercase tracking-widest">Conditions</span>
            <span className="text-[10px] text-foreground font-bold uppercase">{selectedTrack.laps} LAPS / {selectedTrack.weatherChance}% RAIN</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {onOpenDemo && (
            <button
              onClick={onOpenDemo}
              className="px-4 py-1.5 border border-primary/30 text-[10px] text-primary hover:bg-primary/10 transition-all rounded-sm font-bold tracking-widest"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              [ RUN SYSTEM DIAGNOSTIC ]
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

function TrackCard({ 
  track, 
  isSelected, 
  onClick 
}: { 
  track: Track
  isSelected: boolean
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 w-72 group relative overflow-hidden rounded-xl border-2 transition-all duration-500
        ${isSelected 
          ? "border-primary bg-primary/5 shadow-[0_0_40px_rgba(220,0,0,0.15)] scale-[1.02] z-10" 
          : "border-border bg-card/40 hover:border-primary/40 hover:bg-card/60"
        }
      `}
    >
      {/* Selection Glow */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
      )}

      {/* Track Image */}
      <div className="w-full h-40 bg-zinc-900 overflow-hidden relative border-b border-border/50">
        <img 
          src={`/Tracks/${track.name}.png`} 
          alt={`${track.name} Track`}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isSelected ? "scale-105" : ""}`}
          style={{ imageRendering: "auto" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Track Title Overlay */}
        <div className="absolute bottom-3 left-4">
          <h3 className="text-white font-black italic text-lg tracking-tighter uppercase">{track.name}</h3>
          <p className="text-white/60 text-[8px] tracking-[0.3em] font-bold uppercase">{track.country}</p>
        </div>
      </div>
      
      <div className="p-4 bg-background/40 backdrop-blur-sm">
        <div className="flex items-center justify-between text-[10px] font-bold opacity-80 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-primary" />
            <span className="text-muted-foreground uppercase">{track.laps} LAPS</span>
          </div>
          <div className="flex items-center gap-1.5">
            {track.weatherChance > 40 ? (
              <CloudRain className="w-3 h-3 text-blue-400" />
            ) : track.weatherChance > 20 ? (
              <Cloud className="w-3 h-3 text-zinc-400" />
            ) : (
              <Sun className="w-3 h-3 text-yellow-500" />
            )}
            <span className="text-muted-foreground uppercase">{track.weatherChance}% RAIN</span>
          </div>
        </div>
      </div>
      
      {/* Scanline pattern overlay for unselected cards */}
      {!isSelected && (
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10" />
      )}
    </button>
  )
}

function TeamCard({ 
  team, 
  isSelected, 
  onClick 
}: { 
  team: Team
  isSelected: boolean
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={`
        p-3 rounded-lg border-2 transition-all duration-200 text-center
        ${isSelected 
          ? "border-primary shadow-[0_0_20px_rgba(220,0,0,0.3)]" 
          : "border-border bg-card/50 hover:border-muted-foreground"
        }
      `}
      style={{
        backgroundColor: isSelected ? `${team.color}20` : undefined,
      }}
    >
      {/* Team color bar */}
      <div 
        className="w-full h-2 rounded-full mb-2"
        style={{ backgroundColor: team.color }}
      />
      
      <p className="text-foreground text-sm font-medium truncate">{team.name}</p>
      <p className="text-muted-foreground text-xs mt-1">
        {team.driver1} / {team.driver2}
      </p>
    </button>
  )
}

