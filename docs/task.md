# Connect Backend API to Frontend

## Phase 1: Backend Refactoring (`app.py` & `f1_sim.py`)
- [x] Add `simulate_single_lap` to `f1_sim.py`.
- [x] Publish Group Project as a GitHub Repo
    - [x] Initialize git and configure `.gitignore`
    - [x] Create comprehensive `README.md`
    - [x] Push to remote repository
- [x] Flatten project structure for V0 compatibility
    - [x] Move `web_page_v1` contents to root
    - [x] Update documentation and configuration
    - [x] Sync changes to GitHub
- [x] Refactor decision prompts to suspend the game loop instead of calling `input()`.
- [x] Create `app.py` and mount FastAPI with `CORSMiddleware`.
- [x] Implement permanent strategy controls (PUSH/STD/DEFEND)
    - [x] Add strategy cooldown logic to backend
    - [x] Add `/api/strategy` endpoint to backend
    - [x] Move strategy buttons to permanent UI location in frontend
    - [x] Implement 1-lap cooldown UI feedback
- [x] Implement player DNF early exit
- [x] Fix P1 Overtake Bug (lapping issues)
- [x] Rebalance Push/Defend and Overtake rewards/risks
- [x] Dynamic Overtake Boost (position-limited)
- [x] Rain Logic Overhaul (50/50 Light/Heavy)
- [x] Implement `POST /api/start` directly returning the starting grid.
- [x] Implement `POST /api/advance` returning telemetry and radio logs.
- [x] Implement `POST /api/decision` to accept user input.
- [x] Test the backend locally using `curl` or FastAPI docs.

## Phase 2: React Frontend Wiring (`web_page_v1`)
- [x] Add state hooks to `broadcast-screen.tsx`: `gameState`, `leaderboard`, `radioFeed`.
- [x] Replace `setInterval` dummy data with live pull logic using an `isAutoPlaying` Auto-Play loop.
- [x] Build `startGame()`, `nextLap()`, and `submitDecision()` API fetchers.
- [x] Add a prominent "Next Lap" button to manually drive the simulation forward. (Replaced with Auto-Play Status indicator)
- [x] Auto-scroll the `TEAM RADIO` logs container.

## Phase 3: Integration & Validation
- [x] Ensure cars render smoothly based on API state.
- [x] Validate decision pop-ups trigger properly at the correct laps.
- [x] Ensure the full race can be completed end-to-end via the UI.

## Phase 4: UI Polish & New Features
- [x] Add `Spa` and `Suzuka` to the track selection screen (including track image logic and SVG pixel paths).
- [x] Redesign the decision modal to be a non-blocking sidebar to keep track info visible.
- [x] Implement a results visualization dashboard with final classification data.
- [x] Add a "Back to Start" button on the results screen.

## Phase 5: Data-Driven Refactor (CSV & Dynamic ALT)
- [x] Create `drivers.csv` and `tracks.csv`
- [x] Extract 16+ drivers and 6 tracks from hardcoded logic
- [x] Implement `base_lap_time` for tracks (Silverstone/Shanghai/Singapore verified)
- [x] Implement `pace_modifier` for drivers (3 performance tiers)
- [x] Update `F1Game` to calculate `driver_race_alt` dynamically
- [x] Verify lap time scaling across different tracks
