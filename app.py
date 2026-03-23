from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os

from f1_sim import F1Game

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Instance
game_session = None

from typing import Optional

class DecisionInput(BaseModel):
    action: str
    tire: Optional[str] = None


@app.post("/api/start")
def start_game():
    global game_session
    game_session = F1Game()
    game_session.simulate_qualifying()
    
    leaderboard = []
    for i, d in enumerate(game_session.drivers):
        leaderboard.append({
            "name": d.name,
            "team": d.team,
            "tire": {"Soft":"S", "Medium":"M", "Hard":"H", "Intermediate":"I", "Wet":"W"}.get(d.current_tire, d.current_tire[0]),
            "gap": "Leader" if i == 0 else f"+{d.total_time - game_session.drivers[0].total_time:.1f}s",
            "isPlayer": getattr(d, 'is_player', False),
            "position": i + 1
        })

    return {
        "status": "started",
        "current_lap": game_session.current_lap,
        "track_info": game_session.track_info,
        "total_laps": game_session.total_laps,
        "leaderboard": leaderboard,
        "radio_messages": game_session.output_buffer
    }

@app.post("/api/advance")
def advance_lap():
    global game_session
    if not game_session:
        return {"error": "Game not started"}
        
    game_session.advance_lap()
    
    # Sort active drivers
    active = sorted([d for d in game_session.drivers if d.status == "Racing"], key=lambda x: x.total_time)
    
    leaderboard = []
    leader_time = active[0].total_time if active else 0.0
    current_lap = game_session.current_lap
    
    # Estimate base lap time for gap-to-progress conversion
    # Use the player's base_alt as a reasonable approximation
    base_lap_time = game_session.player.base_alt if game_session.player else 90.0
    
    for i, d in enumerate(game_session.drivers):
        if d.status == "Racing":
            gap = "Leader" if d == active[0] else f"+{(d.total_time - leader_time):.1f}s"
            pos = active.index(d) + 1
            
            # Accumulated lap_progress: leader is at (current_lap - 1) + 0.5 (mid-lap)
            # Other drivers are offset backwards based on their gap in seconds
            gap_seconds = d.total_time - leader_time
            leader_progress = (current_lap - 1) + 0.5
            gap_as_laps = gap_seconds / base_lap_time if base_lap_time > 0 else 0
            lap_progress = max(0.0, leader_progress - gap_as_laps)
        else:
            gap = "OUT"
            pos = 99
            # DNF: freeze at last known position
            lap_progress = getattr(d, '_last_lap_progress', 0.0)
            
        # Store for DNF freeze
        d._last_lap_progress = lap_progress
            
        leaderboard.append({
            "name": d.name,
            "team": d.team,
            "tire": {"Soft":"S", "Medium":"M", "Hard":"H", "Intermediate":"I", "Wet":"W"}.get(d.current_tire, d.current_tire[0]),
            "gap": gap,
            "isPlayer": getattr(d, 'is_player', False),
            "position": pos,
            "lapProgress": round(lap_progress, 4)
        })

    # Ensure leaderboard is sorted by position
    leaderboard.sort(key=lambda x: x["position"])

    # Check if player just DNF'd this lap
    player_dnf = game_session.player.status == "DNF"
    if player_dnf and not hasattr(game_session, '_player_dnf_results'):
        game_session.print_results()
        game_session._player_dnf_results = True

    return {
        "current_lap": game_session.current_lap,
        "leaderboard": leaderboard,
        "radio_messages": game_session.output_buffer,
        "decision_required": game_session.decision_required,
        "decision_type": getattr(game_session, "decision_type", "pit"),
        "decision_prompts": getattr(game_session, "decision_prompts", []),
        "race_finished": game_session.lap_phase == "finished",
        "player_dnf": player_dnf,
        "final_results": getattr(game_session, "final_results", [])
    }

@app.post("/api/decision")
def submit_decision(decision: DecisionInput):
    global game_session
    if not game_session:
        return {"error": "Game not started"}
    
    game_session.apply_decision(decision.action, decision.tire)
    return {"status": "decision_applied"}