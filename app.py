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

class StrategyInput(BaseModel):
    action: str

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
    
    for i, d in enumerate(game_session.drivers):
        if d.status == "Racing":
            gap = "Leader" if d == active[0] else f"+{(d.total_time - leader_time):.1f}s"
            # We must map current active positions
            pos = active.index(d) + 1
        else:
            gap = "OUT"
            pos = 99
            
        leaderboard.append({
            "name": d.name,
            "team": d.team,
            "tire": {"Soft":"S", "Medium":"M", "Hard":"H", "Intermediate":"I", "Wet":"W"}.get(d.current_tire, d.current_tire[0]),
            "gap": gap,
            "isPlayer": getattr(d, 'is_player', False),
            "position": pos
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
        "push_mode": game_session.player.push_mode,
        "strategy_cooldown": game_session.player.strategy_cooldown,
        "final_results": getattr(game_session, "final_results", [])
    }

@app.post("/api/decision")
def submit_decision(decision: DecisionInput):
    global game_session
    if not game_session:
        return {"error": "Game not started"}
    
    game_session.apply_decision(decision.action, decision.tire)
    return {"status": "decision_applied"}

@app.post("/api/strategy")
def submit_strategy(strategy: StrategyInput):
    global game_session
    if not game_session:
        return {"error": "Game not started"}
    
    game_session.apply_strategy_change(strategy.action)
    return {
        "status": "strategy_updated",
        "push_mode": game_session.player.push_mode,
        "strategy_cooldown": game_session.player.strategy_cooldown
    }