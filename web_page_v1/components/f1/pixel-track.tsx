"use client"

import { useEffect, useState } from "react"

interface Car {
  id: string
  name: string
  color: string
  position: number // 0-1 representing position on track
  isPlayer: boolean
}

interface PixelTrackProps {
  cars: Car[]
  trackType?: string
}

export function PixelTrack({ cars, trackType = "monaco" }: PixelTrackProps) {
  // Normalize track type to match filenames
  const normalizedType = trackType.charAt(0).toUpperCase() + trackType.slice(1).toLowerCase()
  
  // Track path points
  const trackPoints = getTrackPoints(trackType.toLowerCase())
  
  return (
    <div className="relative w-full h-full bg-[#1a1a1a] rounded-lg overflow-hidden border-4 border-border/80 shadow-inner flex items-center justify-center">
      
      {/* 16:9 Layout Constraint Wrapper for perfect alignment between PNG and SVG */}
      <div className="relative w-full max-w-5xl aspect-video">
        
        {/* Physical Track Image Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src={`/Tracks/${normalizedType}.png`} 
            alt={`${normalizedType} Track Layout`}
            className="w-full h-full object-contain opacity-80"
            style={{ imageRendering: "auto" }}
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Scan line effect */}
        <div 
          className="absolute inset-0 pointer-events-none z-20 opacity-5"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.3) 2px,
              rgba(0,0,0,0.4) 4px
            )`
          }}
        />
        
        {/* CRT glow effect */}
        <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-radial from-transparent via-transparent to-black/40" />
        
        <svg 
          viewBox="0 0 400 225" 
          className="absolute inset-0 w-full h-full opacity-80 z-10"
          style={{ 
            filter: "drop-shadow(0 0 10px rgba(0, 0, 0, 0.5))",
            imageRendering: "pixelated" 
          }}
        >
        {/* Invisible Track Path (Used for cars to follow) */}
        <path
          d={trackPoints.main}
          fill="none"
          stroke="transparent"
          strokeWidth="32"
        />
        
        {/* Subtle Racing Line Overlay (Optional, low opacity) */}
        <path
          d={trackPoints.main}
          fill="none"
          stroke="white"
          strokeWidth="1"
          strokeDasharray="4 8"
          className="opacity-10"
        />
        
        {/* Start/Finish line */}
        <g transform={`translate(${trackPoints.startLine.x}, ${trackPoints.startLine.y}) rotate(${trackPoints.startLine.rotation})`}>
          <rect x="-15" y="-2" width="30" height="4" fill="white" className="opacity-40" />
          <rect x="-15" y="-2" width="5" height="2" fill="black" className="opacity-40" />
          <rect x="-5" y="-2" width="5" height="2" fill="black" className="opacity-40" />
          <rect x="5" y="-2" width="5" height="2" fill="black" className="opacity-40" />
        </g>
        
        {/* Cars */}
        {cars.map((car) => {
          const pos = getCarPosition(car.position, trackPoints.main)
          return (
            <g key={car.id} transform={`translate(${pos.x}, ${pos.y})`}>
              {/* Car shadow */}
              <ellipse cx="2" cy="2" rx="6" ry="3" fill="rgba(0,0,0,0.5)" />
              
              {/* Car body (pixel style) */}
              <rect x="-5" y="-3" width="10" height="6" fill={car.color} rx="1" />
              <rect x="-2" y="-2" width="4" height="4" fill="rgba(255,255,255,0.3)" rx="0.5" />
              
              {/* Player highlight ring */}
              {car.isPlayer && (
                <circle 
                  cx="0" 
                  cy="0" 
                  r="10" 
                  fill="none" 
                  stroke="#DC0000"
                  strokeWidth="1.5"
                  className="animate-ping"
                  style={{ animationDuration: "1.5s" }}
                />
              )}
              
              {/* Driver name (only for player) */}
              {car.isPlayer && (
                <text
                  x="0"
                  y="-10"
                  textAnchor="middle"
                  fill="#DC0000"
                  fontSize="7"
                  fontWeight="bold"
                  style={{ fontFamily: "var(--font-pixel)", textShadow: "0 0 4px black" }}
                >
                  {car.name}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      </div> {/* End aspect-video wrapper */}
    </div>
  )
}

function getTrackPoints(type: string) {
  const tracks: Record<string, { main: string; startLine: { x: number; y: number; rotation: number } }> = {
    monza: {
      main: `
        M 290 169
        L 150 169
        Q 80 169 80 142
        L 60 105
        Q 50 45 80 30
        Q 100 15 120 30
        L 210 120
        Q 220 135 250 135
        L 340 135
        Q 370 135 370 150
        Q 370 169 340 169
        L 290 169
      `,
      startLine: { x: 290, y: 169, rotation: 0 }
    },
    shanghai: {
      main: `
        M 180 202
        L 60 202
        Q 30 202 40 187
        Q 50 172 130 172
        L 180 37
        Q 190 15 220 22
        Q 250 30 240 52
        Q 230 75 200 67
        Q 180 60 190 52
        L 320 67
        Q 350 67 350 75
        Q 350 82 320 82
        L 230 82
        Q 220 82 220 112
        Q 220 135 200 135
        L 230 154
        L 320 161
        Q 350 165 350 184
        Q 350 202 320 202
        L 180 202
      `,
      startLine: { x: 180, y: 202, rotation: 0 }
    },
    silverstone: {
      main: `
        M 180 187
        Q 120 187 100 165
        L 60 135
        Q 40 120 50 105
        Q 60 90 80 90
        L 60 60
        Q 60 30 100 30
        L 140 52
        L 190 105
        Q 200 112 210 127
        Q 220 142 230 142
        L 280 60
        Q 290 37 310 37
        Q 330 37 320 60
        L 330 150
        Q 330 172 300 172
        L 250 172
        Q 220 172 180 187
      `,
      startLine: { x: 180, y: 187, rotation: -20 }
    },
    singapore: {
      main: `
        M 342 112
        L 320 26
        Q 310 7 290 15
        Q 275 22 300 45
        L 310 101
        L 200 101
        L 165 71
        Q 130 37 100 67
        L 40 142
        Q 30 165 60 187
        L 100 210
        L 130 165
        L 160 135
        L 260 135
        L 265 161
        L 335 161
        L 342 112
      `,
      startLine: { x: 342, y: 112, rotation: -80 }
    },
    spa: {
      main: `
        M 100 170
        L 70 180
        Q 40 190 50 150
        L 130 60
        Q 180 10 240 30
        L 330 60
        Q 350 70 330 90
        L 230 140
        Q 200 150 250 190
        L 300 210
        Q 330 220 310 190
        L 210 100
        Q 180 80 140 120
        L 120 150
      `,
      startLine: { x: 90, y: 175, rotation: -20 }
    },
    suzuka: {
      main: `
        M 300 160
        L 200 160
        Q 150 160 120 180
        L 80 200
        Q 50 210 40 180
        L 70 120
        Q 90 90 130 100
        L 170 120
        Q 200 140 230 110
        L 280 60
        Q 310 20 350 50
        L 370 100
        Q 380 150 340 180
        L 310 160
      `,
      startLine: { x: 280, y: 160, rotation: 0 }
    }
  }
  return tracks[type] || tracks.monza
}

function getCarPosition(progress: number, pathData: string): { x: number; y: number } {
  // Parse M, L, Q commands from the SVG path
  const points: { x: number; y: number }[] = []
  const commands = pathData.trim().split(/\s+(?=[MLQZ])/i)
  
  let currentPos = { x: 0, y: 0 }
  
  for (const cmd of commands) {
    if (!cmd.trim()) continue
    const type = cmd[0].toUpperCase()
    const args = cmd.slice(1).trim().split(/[\s,]+/).map(Number)
    
    if (type === 'M' || type === 'L') {
      currentPos = { x: args[0], y: args[1] }
      points.push({ ...currentPos })
    } else if (type === 'Q') {
      // Approximate quadratic bezier with 5 segments
      const cp = { x: args[0], y: args[1] }
      const endPos = { x: args[2], y: args[3] }
      for (let t = 0.2; t <= 1; t += 0.2) {
        const x = Math.pow(1 - t, 2) * currentPos.x + 2 * (1 - t) * t * cp.x + t * t * endPos.x
        const y = Math.pow(1 - t, 2) * currentPos.y + 2 * (1 - t) * t * cp.y + t * t * endPos.y
        points.push({ x, y })
      }
      currentPos = endPos
    } else if (type === 'Z') {
      if (points.length > 0) {
        points.push({ ...points[0] })
      }
    }
  }

  // Calculate total length and segment lengths
  let totalLength = 0
  const lengths = [0]
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    const dist = Math.sqrt(dx * dx + dy * dy)
    totalLength += dist
    lengths.push(totalLength)
  }

  // Find exact position along the path
  const targetLength = progress * totalLength
  let segmentIndex = lengths.findIndex(l => l >= targetLength)
  
  if (segmentIndex <= 0) return points[0] || { x: 0, y: 0 }
  if (segmentIndex >= points.length) return points[points.length - 1]

  const prevLength = lengths[segmentIndex - 1]
  const segmentLength = lengths[segmentIndex] - prevLength
  const segmentProgress = segmentLength === 0 ? 0 : (targetLength - prevLength) / segmentLength

  const prevPoint = points[segmentIndex - 1]
  const nextPoint = points[segmentIndex]

  return {
    x: prevPoint.x + (nextPoint.x - prevPoint.x) * segmentProgress,
    y: prevPoint.y + (nextPoint.y - prevPoint.y) * segmentProgress,
  }
}
