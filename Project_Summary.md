# Project Summary: F1 Pixel-Art Strategy Simulator

This document provides a technical overview of the current state of the F1 Strategy Simulator project to facilitate synchronization with external consultants.

## 1. Project Directory Structure

```text
.
├── app.py                  # FastAPI Server (Entry Point)
├── f1_sim.py               # Core Game Engine (State Machine)
├── drivers.csv             # Data-driven Driver Roster
├── tracks.csv              # Data-driven Track Database
├── package.json            # Node.js dependencies (Next.js 15.1.11, Framer Motion)
├── components/
│   └── f1/
│       ├── broadcast-screen.tsx  # Main Race UI & Auto-Play Logic (3s heartbeat)
│       ├── pixel-track.tsx       # Framer Motion JS Tweening & Car Rendering
│       └── ...                   # UI Components (Leaderboard, Radio, etc.)
├── app/
│   ├── layout.tsx          # Root Layout (Fonts & Metadata)
│   └── page.tsx            # App Entry (View Switching)
├── public/
│   └── Tracks/             # Track Background Images (.png)
└── docs/                   # Project Documentation (Walkthroughs, Tasks)
```

---

## 2. Backend State (FastAPI & F1 Engine)

### Data Architecture
The project uses a **Data-Driven Design**. Race pace and track characteristics are externalized in CSVs.

**drivers.csv (Sample):**
```csv
name,team,pace_modifier,pit_skill,rain_ability,is_player
Verstappen,Red Bull,0.995,2.1,0.6,False
Leclerc,Ferrari,0.996,2.3,0.8,True
```

**tracks.csv (Sample):**
```csv
id,name,description,laps,base_rain_prob,base_lap_time
monza,🇮🇹 蒙扎赛道 (Monza),速度神殿,53,0.015,83.5
spa,🇧🇪 斯帕赛道 (Spa-Francorchamps),多雨微气候,44,0.025,108.0
```

### Engine Logic: State Machine & Interruption
- **Deterministic Step-based Physics**: `advance_lap()` calculates physics for 20 drivers.
- **Decision Interrupts**: The engine checks for critical events (Weather, Tyre Cliff, SC) *before* processing a lap. If `decision_required` is True, simulation halts.
- **Smart Silence Logic**: If a player selects "Stay Out" 3+ times during wet weather prompts, the engine triggers a **5-lap silence period** (`tire_prompt_cooldown`) to avoids pestering.
- **Monotonic Safety**: The engine ensures `lap_progress` only increases (except for player-visible data where "clamping" is handled in frontend).

---

## 3. Frontend Architecture (Precision Animation)

### Visual Paradigm: Absolute Distance + Closed Path
We transitioned from discrete CSS loops to **Continuous JS Tweening** via `framer-motion`:
- **Closed SVG Loops**: All track paths end with the `Z` command. This makes them mathematically circular, allowing `offset-distance` to wrap around.
- **Absolute Distance**: Car position is set to `clampedProgress * 100%`. For example, $120.5\%$ automatically renders at $20.5\%$ on Lap 2, maintaining perfect tween continuity.
- **Monotonic Clamp (Ratchet)**: A `useRef` based ratchet ensure cars NEVER move backwards, even if their data-driven progress drops during a multi-lap pit stop.

### Interactive Pausing & Pace
- **Broadcast Heartbeat**: The system polls every **3000ms**.
- **Synced Transitions**: Framer Motion tweens the position over exactly **3.0s**, ensuring the cars move continuously without snapping at poll intervals.
- **State-Driven Pausing**: When `isPaused` (Decision Mode), the car's transition duration drops to 0, freezing them instantly.

---

## 4. Critical Code Snippets

### 1. Absolute Tweening & Ratchet (`pixel-track.tsx`)
```typescript
const prevMax = maxProgressRef.current[car.id] || 0;
const clampedProgress = Math.max(prevMax, car.lapProgress);
maxProgressRef.current[car.id] = clampedProgress;

return (
  <motion.g
    animate={{ offsetDistance: `${clampedProgress * 100}%` }}
    transition={{ duration: isPaused ? 0 : 3.0, ease: "linear" }}
  />
);
```

### 2. Smart Pit Silence Logic (`f1_sim.py`)
```python
def check_player_decision(self, active, weather_msg):
    # Skip pestering if silenced by 3 consecutive "stay outs"
    if need_prompt and self.player.tire_prompt_cooldown <= 0:
        return True, prompt_reasons, "pit"

    if self.player.tire_prompt_cooldown > 0:
        self.player.tire_prompt_cooldown -= 1
```

---

## 5. Implementation Status

### Completed ✅
- **20-Car Grid**: Full field rendered with high-fidelity pixel sprites.
- **Zero-Jitter Movement**: Framer Motion + 3s Polling removes all stuttering.
- **Infinite Laps**: Closed-loop SVG architecture supports unlimited race lengths.
- **Strategy Simplification**: Focus shifted entirely to Pit/Overtake (Push/Std/Def removed).

### Roadmap 🔍
- **Safety Car Entity**: A visible safety car for track-neutralization periods.
- **Telemetry Dashboard**: Dynamic charts for tyre thermal degradation.
- **Live Sound Scape**: Audio synthesis for engine notes and pit lane noise.
