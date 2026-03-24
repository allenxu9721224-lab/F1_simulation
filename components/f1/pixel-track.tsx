"use client"

import { motion } from "framer-motion"
import { useRef, useState, useEffect, useMemo } from "react"

interface Car {
  id: string
  name: string
  color: string
  position: number 
  lapProgress: number 
  gap: string 
  isPlayer: boolean
}

interface TrackConfig {
  main: string
  viewBox: string
  startLine: { x: number; y: number; rotation: number }
  offsetX?: number
  offsetY?: number
}

interface PixelTrackProps {
  cars: Car[]
  trackType?: string
  isPaused?: boolean
}

export function PixelTrack({ cars, trackType = "monaco", isPaused = false }: PixelTrackProps) {
  const [dynamicConfig, setDynamicConfig] = useState<TrackConfig | null>(null)
  
  // Store the maximum progress seen for each car to prevent reverse animation (monotonic clamp)
  const maxProgressRef = useRef<Record<string, number>>({})

  // Normalize track type to match filenames
  const normalizedType = trackType.charAt(0).toUpperCase() + trackType.slice(1).toLowerCase()
  
  // 1. Try to load dynamic SVG from /public/Tracks/[TrackID].svg
  useEffect(() => {
    async function loadTrack() {
      try {
        const response = await fetch(`/Tracks/${normalizedType}.svg`)
        if (!response.ok) throw new Error("SVG not found")
        const svgText = await response.text()
        const parser = new DOMParser()
        const doc = parser.parseFromString(svgText, "image/svg+xml")
        const svgEl = doc.querySelector("svg")
        const pathEl = doc.querySelector("path")
        const lineEl = doc.querySelector("line")
        
        if (!svgEl || !pathEl) throw new Error("Invalid SVG structure")
        
        const mainPath = pathEl.getAttribute("d") || ""
        
        // Parsing the path string to find its bounding box (approximate)
        const coords = mainPath.match(/[-+]?[0-9]*\.?[0-9]+/g)?.map(Number) || []
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
        for (let i = 0; i < coords.length; i += 2) {
           if (coords[i] < minX) minX = coords[i]
           if (coords[i] > maxX) maxX = coords[i]
           if (coords[i+1] < minY) minY = coords[i+1]
           if (coords[i+1] > maxY) maxY = coords[i+1]
        }
        
        // Centering logic: If the path is tight-cropped, its center should align with the background's center (2736/2, 1536/2)
        const pathCenterX = (minX + maxX) / 2
        const pathCenterY = (minY + maxY) / 2
        const canvasCenterX = 2736 / 2
        const canvasCenterY = 1536 / 2
        
        // Best guess offset: nudge the path to center of raw canvas
        const autoOffsetX = canvasCenterX - pathCenterX
        const autoOffsetY = canvasCenterY - pathCenterY

        console.log(`Auto Alignment [${normalizedType}]: BBox(${minX},${minY}) to (${maxX},${maxY}). Offsetting by (${autoOffsetX}, ${autoOffsetY})`)

        let startLine = { x: 0, y: 0, rotation: 0 }
        if (lineEl) {
          const x1 = parseFloat(lineEl.getAttribute("x1") || "0")
          const y1 = parseFloat(lineEl.getAttribute("y1") || "0")
          const x2 = parseFloat(lineEl.getAttribute("x2") || "0")
          const y2 = parseFloat(lineEl.getAttribute("y2") || "0")
          
          startLine = {
            x: (x1 + x2) / 2 + autoOffsetX,
            y: (y1 + y2) / 2 + autoOffsetY,
            rotation: Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI) + 90
          }
        }
        
        setDynamicConfig({
          main: mainPath,
          viewBox: "0 0 2736 1536", // Standardized canvas
          startLine,
          // We apply the offset via a wrap <g transform> in the render
          offsetX: autoOffsetX,
          offsetY: autoOffsetY
        })
      } catch (err) {
        console.warn(`Dynamic track failed for ${normalizedType}, falling back to hardcoded.`, err)
        setDynamicConfig(null)
      }
    }
    loadTrack()
  }, [normalizedType, trackType])

  // Get fallback points (original hardcoded data)
  const fallbackPoints = getFallbackTrackPoints(trackType.toLowerCase())

  // Final config used for rendering
  const activeConfig = useMemo((): TrackConfig => {
    if (dynamicConfig) return dynamicConfig
    return {
      main: fallbackPoints.main,
      viewBox: "0 0 400 225",
      startLine: fallbackPoints.startLine,
      offsetX: 0,
      offsetY: 0
    }
  }, [dynamicConfig, fallbackPoints])

  // Clean the SVG path for CSS path() consumption (remove extra spaces/newlines)
  const cleanPath = useMemo(() => 
    activeConfig.main.replace(/\s+/g, ' ').trim()
  , [activeConfig.main])
  
  if (!activeConfig.main && !dynamicConfig) {
    return <div className="w-full aspect-video bg-muted animate-pulse rounded-lg" />
  }

  return (
    <div className="relative w-full h-full bg-[#1a1a1a] rounded-lg overflow-hidden border-4 border-border/80 shadow-inner flex items-center justify-center p-2">
      
      {/* Container sized by the physical image aspect ratio */}
      <div className="relative w-full max-w-5xl">
        
        {/* Physical Track Image Background */}
        <img 
          src={`/Tracks/${normalizedType}.png`} 
          alt={`${normalizedType} Track Layout`}
          className="w-full h-auto block opacity-90"
          style={{ imageRendering: "auto" }}
        />
        
        {/* Add a subtle dark overlay to the image */}
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />

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
        
        {/* The Racing Line SVG Layer - Perfectly aligned to image bounds */}
        <svg 
          viewBox={activeConfig.viewBox}
          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
          style={{ 
            filter: "drop-shadow(0 0 10px rgba(0, 0, 0, 0.5))",
            imageRendering: "pixelated" 
          }}
        >
        {/* Apply Offset if the SVG was tightly cropped */}
        <g transform={`translate(${activeConfig.offsetX || 0}, ${activeConfig.offsetY || 0})`}>
          
          {/* Invisible Track Path (Used for reference or debug) */}
          <path
            d={activeConfig.main}
            fill="none"
            stroke="transparent"
            strokeWidth="100"
          />
          
          {/* Subtle Racing Line Overlay */}
          <path
            d={activeConfig.main}
            fill="none"
            stroke="white"
            strokeWidth={dynamicConfig ? 8 : 1}
            strokeDasharray="20 40"
            className="opacity-15"
          />
          
          {/* Start/Finish line */}
          <g transform={`translate(${activeConfig.startLine.x - (activeConfig.offsetX || 0)}, ${activeConfig.startLine.y - (activeConfig.offsetY || 0)}) rotate(${activeConfig.startLine.rotation})`}>
            <rect x="-60" y="-8" width="120" height="16" fill="white" className="opacity-80" />
            <rect x="-60" y="-8" width="20" height="8" fill="black" className="opacity-80" />
            <rect x="-20" y="-8" width="20" height="8" fill="black" className="opacity-80" />
            <rect x="20" y="-8" width="20" height="8" fill="black" className="opacity-80" />
          </g>
          
          {/* Cars — using Absolute Distance + Closed Path for smooth infinite laps */}
          {cars.map((car) => {
            // Monotonic Clamp: Ensure target never decreases for a given car ID.
            // This keeps cars frozen in pits or during crashes while the leader advances.
            const prevMax = maxProgressRef.current[car.id] || 0
            const clampedProgress = Math.max(prevMax, car.lapProgress)
            maxProgressRef.current[car.id] = clampedProgress
            
            return (
              <motion.g
                key={car.id}
                style={{
                  offsetPath: `path('${cleanPath}')`,
                  offsetRotate: 'auto 90deg',
                }}
                animate={{
                  offsetDistance: `${clampedProgress * 100}%`,
                }}
                transition={{
                  duration: isPaused ? 0 : 3.0,
                  ease: "linear",
                }}
              >
                {/* Car footprint shadow */}
                <ellipse cx="1" cy="4" rx="20" ry="10" fill="rgba(0,0,0,0.6)" />
                
                {/* Car body (pixel style scaled for 2736x1536) */}
                <rect x="-30" y="-20" width="60" height="40" fill={car.color} rx="4" />
                <rect x="-10" y="-16" width="20" height="32" fill="rgba(255,255,255,0.4)" rx="2" />
                
                {/* Player highlight ring */}
                {car.isPlayer && (
                  <circle 
                    cx="0" 
                    cy="0" 
                    r="70" 
                    fill="none" 
                    stroke="#DC0000"
                    strokeWidth="10"
                    className="animate-ping"
                    style={{ animationDuration: "1.5s" }}
                  />
                )}
                
                {/* Driver name label */}
                {car.isPlayer && (
                  <text
                    x="0"
                    y="-80"
                    textAnchor="middle"
                    fill="#DC0000"
                    fontSize="60"
                    fontWeight="bold"
                    style={{ fontFamily: "var(--font-pixel)", textShadow: "0 0 20px black" }}
                  >
                    {car.name}
                  </text>
                )}
              </motion.g>
            )
          })}
        </g>
      </svg>
      </div> {/* End relative wrapper */}
    </div>
  )
}

function getFallbackTrackPoints(type: string) {
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
        Z
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
        Z
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
        Z
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
        Z
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
        Z
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
        Z
      `,
      startLine: { x: 280, y: 160, rotation: 0 }
    }
  }
  return tracks[type] || tracks.monza
}
