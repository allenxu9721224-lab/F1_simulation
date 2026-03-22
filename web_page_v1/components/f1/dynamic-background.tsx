"use client"

export type SceneState = "racing" | "pit" | "dnf"

interface DynamicBackgroundProps {
  state: SceneState
}

export function DynamicBackground({ state }: DynamicBackgroundProps) {
  return (
    <div className="absolute inset-0 transition-all duration-1000">
      {state === "racing" && <RacingScene />}
      {state === "pit" && <PitStopScene />}
      {state === "dnf" && <CrashScene />}
    </div>
  )
}

// Racing state - winding track with cars
function RacingScene() {
  return (
    <div className="w-full h-full bg-[#1a472a] relative overflow-hidden">
      {/* Pixel grass pattern */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #1a472a 25%, transparent 25%),
            linear-gradient(-45deg, #1a472a 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #1f5232 75%),
            linear-gradient(-45deg, transparent 75%, #1f5232 75%)
          `,
          backgroundSize: "8px 8px",
          backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
        }}
      />
      
      {/* Track */}
      <svg viewBox="0 0 400 300" className="w-full h-full" style={{ imageRendering: "pixelated" }}>
        {/* Track surface */}
        <path
          d="M 80 150 L 80 80 Q 80 50 110 50 L 200 50 Q 250 50 250 80 L 250 120 Q 250 150 280 150 L 340 150 Q 370 150 370 180 L 370 220 Q 370 250 340 250 L 150 250 Q 80 250 80 200 L 80 150"
          fill="none"
          stroke="#3a3a3a"
          strokeWidth="36"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Racing line */}
        <path
          d="M 80 150 L 80 80 Q 80 50 110 50 L 200 50 Q 250 50 250 80 L 250 120 Q 250 150 280 150 L 340 150 Q 370 150 370 180 L 370 220 Q 370 250 340 250 L 150 250 Q 80 250 80 200 L 80 150"
          fill="none"
          stroke="#4a4a4a"
          strokeWidth="30"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Center dashed line */}
        <path
          d="M 80 150 L 80 80 Q 80 50 110 50 L 200 50 Q 250 50 250 80 L 250 120 Q 250 150 280 150 L 340 150 Q 370 150 370 180 L 370 220 Q 370 250 340 250 L 150 250 Q 80 250 80 200 L 80 150"
          fill="none"
          stroke="#666"
          strokeWidth="2"
          strokeDasharray="10 10"
        />
        
        {/* Kerbs */}
        <rect x="60" y="45" width="80" height="6" fill="#DC0000" />
        <rect x="60" y="45" width="20" height="6" fill="white" />
        <rect x="100" y="45" width="20" height="6" fill="white" />
        
        {/* Animated cars */}
        <g className="animate-pulse" style={{ animationDuration: "0.5s" }}>
          <rect x="300" y="145" width="12" height="8" fill="#1E41FF" rx="2" />
          <rect x="260" y="145" width="12" height="8" fill="#DC0000" rx="2" />
          <rect x="220" y="80" width="12" height="8" fill="#FF8700" rx="2" />
        </g>
        
        {/* Grandstands */}
        <rect x="100" y="15" width="80" height="15" fill="#2a2a4a" rx="2" />
        <rect x="280" y="265" width="60" height="12" fill="#2a2a4a" rx="2" />
        
        {/* LIVE badge */}
        <g transform="translate(360, 20)">
          <rect x="-25" y="-10" width="50" height="24" fill="#1a1a2e" rx="4" stroke="#DC0000" strokeWidth="2" />
          <text x="0" y="5" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">LIVE</text>
        </g>
      </svg>
      
      {/* Scan lines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)`
        }}
      />
    </div>
  )
}

// Pit Stop state - garage with car
function PitStopScene() {
  return (
    <div className="w-full h-full bg-[#1a1a2e] relative overflow-hidden">
      {/* Floor tiles */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #252540 25%, transparent 25%),
            linear-gradient(-45deg, #252540 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #1f1f35 75%),
            linear-gradient(-45deg, transparent 75%, #1f1f35 75%)
          `,
          backgroundSize: "16px 16px",
        }}
      />
      
      <svg viewBox="0 0 400 300" className="w-full h-full" style={{ imageRendering: "pixelated" }}>
        {/* Garage back wall */}
        <rect x="30" y="40" width="340" height="180" fill="#2a2a3e" />
        <rect x="35" y="45" width="330" height="170" fill="#252538" />
        
        {/* Garage door frame */}
        <rect x="30" y="30" width="340" height="12" fill="#333" />
        <rect x="30" y="220" width="340" height="8" fill="#444" />
        
        {/* Screens on wall */}
        <rect x="50" y="55" width="60" height="40" fill="#111" stroke="#444" strokeWidth="2" />
        <rect x="54" y="59" width="52" height="32" fill="#0a4a0a" />
        {/* Data bars */}
        <rect x="58" y="63" width="30" height="4" fill="#0f0" />
        <rect x="58" y="70" width="20" height="4" fill="#0f0" />
        <rect x="58" y="77" width="35" height="4" fill="#ff0" />
        
        {/* Second screen */}
        <rect x="290" y="55" width="60" height="40" fill="#111" stroke="#444" strokeWidth="2" />
        <rect x="294" y="59" width="52" height="32" fill="#0a0a4a" />
        
        {/* Tire rack */}
        <rect x="130" y="50" width="140" height="60" fill="#333" />
        {/* Tires */}
        <circle cx="155" cy="75" r="18" fill="#111" stroke="#333" strokeWidth="3" />
        <circle cx="200" cy="75" r="18" fill="#111" stroke="#333" strokeWidth="3" />
        <circle cx="245" cy="75" r="18" fill="#111" stroke="#333" strokeWidth="3" />
        {/* Tire colors */}
        <circle cx="155" cy="75" r="8" fill="#DC0000" />
        <circle cx="200" cy="75" r="8" fill="#FFD700" />
        <circle cx="245" cy="75" r="8" fill="white" />
        
        {/* Car on jacks */}
        <g transform="translate(140, 160)">
          {/* Jack stands */}
          <rect x="10" y="30" width="8" height="25" fill="#FF8700" />
          <rect x="102" y="30" width="8" height="25" fill="#FF8700" />
          
          {/* Car shadow */}
          <ellipse cx="60" cy="52" rx="50" ry="8" fill="rgba(0,0,0,0.4)" />
          
          {/* Car body */}
          <rect x="0" y="10" width="120" height="35" fill="#DC0000" rx="4" />
          <rect x="5" y="15" width="110" height="25" fill="#FF3333" rx="3" />
          
          {/* Cockpit */}
          <rect x="45" y="5" width="35" height="15" fill="#111" rx="2" />
          <rect x="50" y="8" width="25" height="10" fill="#222" rx="1" />
          
          {/* Wheels (removed) */}
          <circle cx="20" cy="40" r="12" fill="#333" stroke="#555" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="100" cy="40" r="12" fill="#333" stroke="#555" strokeWidth="2" strokeDasharray="4 4" />
          
          {/* Number */}
          <text x="75" y="30" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">16</text>
        </g>
        
        {/* Pit crew silhouettes */}
        <rect x="100" y="175" width="15" height="35" fill="#DC0000" rx="2" />
        <circle cx="107" cy="168" r="8" fill="#f5d0c5" />
        
        <rect x="280" y="175" width="15" height="35" fill="#DC0000" rx="2" />
        <circle cx="287" cy="168" r="8" fill="#f5d0c5" />
        
        {/* Tire gun animation */}
        <g className="animate-pulse" style={{ animationDuration: "0.2s" }}>
          <rect x="118" y="185" width="25" height="8" fill="#666" />
          <rect x="143" y="183" width="8" height="12" fill="#888" />
        </g>
        
        {/* BOX BOX text */}
        <text 
          x="200" 
          y="260" 
          textAnchor="middle" 
          fill="#FFD700" 
          fontSize="24" 
          fontWeight="bold"
          style={{ fontFamily: "var(--font-pixel)" }}
          className="animate-pulse"
        >
          BOX BOX
        </text>
      </svg>
      
      {/* Garage lighting effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />
      
      {/* Scan lines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)`
        }}
      />
    </div>
  )
}

// Crash/DNF state - car off track with smoke
function CrashScene() {
  return (
    <div className="w-full h-full bg-[#1a1a1a] relative overflow-hidden">
      {/* Gravel trap pattern */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, #3a3528 1px, transparent 1px),
            radial-gradient(circle at 6px 6px, #4a4538 1px, transparent 1px)
          `,
          backgroundSize: "8px 8px",
          backgroundColor: "#2a2518",
        }}
      />
      
      <svg viewBox="0 0 400 300" className="w-full h-full" style={{ imageRendering: "pixelated" }}>
        {/* Track edge */}
        <path
          d="M 0 200 Q 100 180 200 200 Q 300 220 400 200"
          fill="none"
          stroke="#3a3a3a"
          strokeWidth="40"
        />
        
        {/* Kerb */}
        <rect x="0" y="175" width="400" height="8" fill="#DC0000" />
        <rect x="0" y="175" width="25" height="8" fill="white" />
        <rect x="50" y="175" width="25" height="8" fill="white" />
        <rect x="100" y="175" width="25" height="8" fill="white" />
        <rect x="150" y="175" width="25" height="8" fill="white" />
        <rect x="200" y="175" width="25" height="8" fill="white" />
        <rect x="250" y="175" width="25" height="8" fill="white" />
        <rect x="300" y="175" width="25" height="8" fill="white" />
        <rect x="350" y="175" width="25" height="8" fill="white" />
        
        {/* Tire barrier */}
        <g transform="translate(280, 60)">
          <circle cx="0" cy="0" r="12" fill="#111" stroke="#333" strokeWidth="2" />
          <circle cx="25" cy="0" r="12" fill="#111" stroke="#333" strokeWidth="2" />
          <circle cx="50" cy="0" r="12" fill="#111" stroke="#333" strokeWidth="2" />
          <circle cx="12" cy="22" r="12" fill="#111" stroke="#333" strokeWidth="2" />
          <circle cx="37" cy="22" r="12" fill="#111" stroke="#333" strokeWidth="2" />
        </g>
        
        {/* Crashed car */}
        <g transform="translate(180, 100) rotate(25)">
          {/* Car shadow */}
          <ellipse cx="60" cy="45" rx="50" ry="10" fill="rgba(0,0,0,0.5)" />
          
          {/* Car body (damaged) */}
          <rect x="0" y="5" width="120" height="35" fill="#DC0000" rx="4" />
          <rect x="5" y="10" width="110" height="25" fill="#AA0000" rx="3" />
          
          {/* Damage marks */}
          <rect x="105" y="8" width="15" height="30" fill="#333" />
          <rect x="0" y="12" width="8" height="20" fill="#222" />
          
          {/* Cockpit */}
          <rect x="45" y="0" width="35" height="15" fill="#111" rx="2" />
          
          {/* Wheels (one missing) */}
          <circle cx="25" cy="35" r="10" fill="#111" stroke="#333" strokeWidth="2" />
          <circle cx="95" cy="38" r="6" fill="#111" stroke="#555" strokeWidth="1" />
        </g>
        
        {/* Loose wheel */}
        <g transform="translate(300, 140)">
          <circle cx="0" cy="0" r="14" fill="#111" stroke="#333" strokeWidth="3" />
          <circle cx="0" cy="0" r="5" fill="#888" />
        </g>
        
        {/* Debris */}
        <rect x="220" y="145" width="8" height="4" fill="#DC0000" transform="rotate(45)" />
        <rect x="250" y="130" width="6" height="3" fill="#333" transform="rotate(-20)" />
        <rect x="270" y="155" width="10" height="5" fill="#222" transform="rotate(60)" />
        
        {/* Smoke/Steam particles */}
        <g className="animate-pulse" style={{ animationDuration: "0.5s" }}>
          <circle cx="240" cy="85" r="20" fill="rgba(100,100,100,0.6)" />
          <circle cx="255" cy="70" r="15" fill="rgba(120,120,120,0.5)" />
          <circle cx="225" cy="75" r="12" fill="rgba(80,80,80,0.4)" />
        </g>
        
        {/* More smoke rising */}
        <g className="animate-bounce" style={{ animationDuration: "1s" }}>
          <circle cx="245" cy="55" r="18" fill="rgba(90,90,90,0.4)" />
          <circle cx="260" cy="45" r="14" fill="rgba(110,110,110,0.3)" />
          <circle cx="230" cy="50" r="10" fill="rgba(70,70,70,0.3)" />
        </g>
        
        {/* Sparks */}
        <g className="animate-ping" style={{ animationDuration: "0.3s" }}>
          <circle cx="200" cy="120" r="2" fill="#FFD700" />
          <circle cx="210" cy="115" r="2" fill="#FFA500" />
          <circle cx="195" cy="125" r="2" fill="#FF6600" />
        </g>
        
        {/* Warning text */}
        <text 
          x="200" 
          y="260" 
          textAnchor="middle" 
          fill="#DC0000" 
          fontSize="20" 
          fontWeight="bold"
          style={{ fontFamily: "var(--font-pixel)" }}
          className="animate-pulse"
        >
          INCIDENT
        </text>
        
        {/* VSC flag */}
        <g transform="translate(50, 50)">
          <rect x="0" y="0" width="40" height="30" fill="#FFD700" />
          <text x="20" y="22" textAnchor="middle" fill="black" fontSize="14" fontWeight="bold">VSC</text>
        </g>
      </svg>
      
      {/* Red tint overlay */}
      <div className="absolute inset-0 bg-red-900/10 pointer-events-none animate-pulse" style={{ animationDuration: "1s" }} />
      
      {/* Scan lines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)`
        }}
      />
    </div>
  )
}
