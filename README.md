# F1 Strategy Simulator: Team Principal Edition

An interactive F1 race simulation game built with Python (FastAPI) and React (Next.js). Take control of the pit wall, make split-second decisions on tires and strategy, and lead your team to victory.

## Features

- **Realistic Physics Engine**: Simulates lap times, tire wear, fuel burn, and weather conditions.
- **Dynamic Decision Making**: React to Safety Cars, rain, and tire degradation in real-time.
- **Team Principal Controls**: Permanent PUSH, STD, and DEFEND strategy buttons with backend-enforced cooldowns.
- **Live Timing & Radio Feed**: Visual telemetry and a scrollable radio log for deep immersion.
- **Pixel Art Aesthetics**: A stunning, retro-modern UI that feels like a classic F1 broadcast.

## Tech Stack

- **Backend**: Python, FastAPI, Uvicorn (Physics Engine & API)
- **Frontend**: React, Next.js, Tailwind CSS, Lucide React (Game UI)
- **State Management**: Real-time server-sent telemetry and decision prompts.

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18+

### Running the Backend

1. Install dependencies (if any):

```bash
pip install fastapi uvicorn
```

2. Start the server:

```bash
python -m uvicorn app:app --port 8000
```

### Running the Frontend

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

## Key Mechanics

- **Push Mode**: 0.3% speed boost, but 5x crash risk and 2.2x tire wear.
- **Defend Mode**: 0.6% speed penalty, but 50% crash risk reduction and 20% tire preservation.
- **Overtake (Divebomb)**: 60% success rate with an initial 0.5s gain and a 3-lap temporary boost that terminates once the position is secured.
- **Tire Cliffs**: Drastic performance drop once tires exceed their limit (e.g., 15 laps for Softs).

## Author

Developed as part of an AI in Marketing Group Project.
