# Project Summary: F1 Pixel-Art Strategy Simulator

This document provides a technical overview of the current state of the F1 Strategy Simulator project to facilitate synchronization with external consultants.

## 1. Project Directory Structure

```text
.
├── app.py                  # FastAPI Server (Entry Point)
├── f1_sim.py               # Core Game Engine (State Machine)
├── drivers.csv             # Data-driven Driver Roster
├── tracks.csv              # Data-driven Track Database
├── package.json            # Node.js dependencies (Next.js 15.1.11)
├── components/
│   └── f1/
│       ├── broadcast-screen.tsx  # Main Race UI & Auto-Play Logic
│       ├── pixel-track.tsx       # Motion Path Animation & Car Rendering
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
- **Smart Silence Logic**: If a player selects "Stay Out" 3+ times during wet weather prompts, the engine triggers a **5-lap silence period** (`tire_prompt_cooldown`) to avoid "spamming" the user.

### API Contract (Simplified)
- `POST /api/advance`: Main heartbeat. Advances simulation.
- `POST /api/decision`: Submits "Box" or "Stay Out" choices.
- `POST /api/start`: Manual/Remote reset of the game session.

---

## 3. Frontend Architecture (Autonomous Movement)

### Visual Decoupling (Motion Path)
Unlike typical simulators where UI polls for every pixel move, this project uses **Autonomous CSS Loops**:
- **8s Continuous Loop**: Each car is assigned a CSS `offset-path` (SVG) and animates from 0% to 100% over 8 seconds.
- **Accumulated Distance**: The backend returns `lapProgress` (e.g., `13.5` for someone halfway through Lap 14).
- **Dynamic Delay**: Cars maintain relative spacing via `animation-delay: -((lapProgress % 1) * 8000)ms`.

### Interactive Pausing
- The `PixelTrack` component receives an `isPaused` prop (linked to `showDecision`).
- Animation is paused via `animation-play-state: paused` to ensure the cars "freeze" in place while the user makes a pit/DRS decision.

---

## 4. Critical Code Snippets

### 1. Autonomous Movement Calculation (`pixel-track.tsx`)
```typescript
const animDuration = 8000; // 8 seconds per visible lap
const progressDecimal = car.lapProgress % 1;
const delay = -(progressDecimal * animDuration);

return (
  <div 
    key={car.id}
    style={{
      offsetPath: `path('${SVG_PATHS[trackType]}')`,
      animation: `driveCircuit ${animDuration}ms linear infinite`,
      animationDelay: `${delay}ms`,
      animationPlayState: isPaused ? 'paused' : 'running'
    }}
  />
);
```

### 2. Smart Pit Silence Logic (`f1_sim.py`)
```python
def check_player_decision(self, active, weather_msg):
    # Skip pestering if silenced
    if need_prompt and self.player.tire_prompt_cooldown <= 0:
        return True, prompt_reasons, "pit"

    if self.player.tire_prompt_cooldown > 0:
        self.player.tire_prompt_cooldown -= 1
        
    # Overtake logic remains always active
    if 0.1 <= gap_front <= 1.0 and self.player.overtake_cooldown <= 0:
        return True, ["...overtake..."], "overtake"
```

---

## 5. Implementation Status

### Completed ✅
- **20-Car Grid**: Full field rendered with reduced-size pixel sprites.
- **Buttery-Smooth Movement**: CSS Motion Path removes polling stuttering.
- **Strategy Simplification**: Focus shifted entirely to Pit/Overtake (Push/Std/Def removed).
- **Audio/Radio Narrative**: Integrated team logs for immersion.

### Roadmap 🔍
- **Safety Car Visuals**: Actual car entity for SC periods.
- **Telemetry View**: Advanced data charts for tyre wear and fuel.
- **Audio Overhaul**: Engine sound synthesis linked to lap progress.
