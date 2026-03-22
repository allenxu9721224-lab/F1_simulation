"use client"

import { useState } from "react"
import { StartScreen } from "@/components/f1/start-screen"
import { BroadcastScreen } from "@/components/f1/broadcast-screen"
import { EventDemo } from "@/components/f1/event-demo"

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

export default function F1StrategyGame() {
  const [view, setView] = useState<"start" | "race" | "demo">("start")
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  const handleStartRace = (track: Track, team: Team) => {
    setSelectedTrack(track)
    setSelectedTeam(team)
    setView("race")
  }

  const handleOpenDemo = () => {
    setView("demo")
  }

  const handleExit = () => {
    setView("start")
  }

  if (view === "demo") {
    return <EventDemo onExit={handleExit} />
  }

  if (view === "race" && selectedTrack && selectedTeam) {
    return (
      <BroadcastScreen 
        track={selectedTrack} 
        team={selectedTeam} 
        onExit={handleExit} 
      />
    )
  }

  return <StartScreen onStartRace={handleStartRace} onOpenDemo={handleOpenDemo} />
}
