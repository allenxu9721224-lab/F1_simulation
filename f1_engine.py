# f1_engine.py
import random
from typing import Dict, Any, Optional

class Driver:
    def __init__(self, name: str, base_alt: float, starting_tire: str, team: str, pit_skill: float = 2.4, rain_ability: float = 1.0, is_player: bool = False):
        self.name = name
        self.base_alt = base_alt
        self.team = team
        self.pit_skill = pit_skill 
        self.rain_ability = rain_ability 
        self.is_player = is_player
        
        self.total_time = 0.0
        self.current_lap_time = 0.0
        self.best_lap_time = float('inf') 
        self.status = "Racing"
        
        self.current_tire = starting_tire 
        self.tire_age = 0
        self.used_dry_compounds = set() 
        self.stints = [] 
        
        if starting_tire in ["Soft", "Medium", "Hard"]:
            self.used_dry_compounds.add(starting_tire)
            
        self.rank = 0
        self.last_pit_lap = -1
        self.fuel_lap_benefit = 0.06 
        self.is_in_drs = False
        self.points = 0 

    def calculate_lap_time(self, lap_num: int, sc_mult: float, vsc_mult: float, gap_to_front: float, track_wetness: float, drs_enabled: bool, race_ref: Any) -> float:
        if self.status == "DNF": return 0.0

        current_base = self.base_alt - (lap_num * self.fuel_lap_benefit)
        tire_mismatch_penalty = 0.0
        
        crash_chance = 0.0003 
        mechanical_failure_chance = 0.0005 

        if track_wetness < 0.2: 
            if self.current_tire in ["Intermediate", "Wet"]:
                tire_mismatch_penalty = 5.0 + (self.tire_age * 0.5) 
            elif drs_enabled and 0.2 < gap_to_front < 1.0:
                tire_mismatch_penalty = -0.8
                self.is_in_drs = True
        elif 0.2 <= track_wetness < 0.6: 
            if self.current_tire not in ["Intermediate", "Wet"]:
                tire_mismatch_penalty = 12.0 * self.rain_ability 
                crash_chance = 0.015 * self.rain_ability 
            else:
                tire_mismatch_penalty = 2.0 * self.rain_ability
                crash_chance = 0.002 * self.rain_ability 
        else: 
            if self.current_tire != "Wet":
                tire_mismatch_penalty = 25.0 * self.rain_ability
                crash_chance = 0.03 * self.rain_ability 
            else:
                tire_mismatch_penalty = 5.0 * self.rain_ability
                crash_chance = 0.003 * self.rain_ability 

        if random.random() < mechanical_failure_chance:
            self.status = "DNF"
            race_ref.log(f"💥 {self.name} suffers engine failure. DNF.")
            return 0.0
        elif random.random() < crash_chance:
            self.status = "DNF"
            weather_desc = "slippery conditions" if track_wetness >= 0.2 else "heavy traffic"
            race_ref.log(f"🚨 {self.name} crashes in {weather_desc}! DNF.")
            return 0.0

        tire_mod = 0.0
        cliff_threshold = {"Soft": 15, "Medium": 25, "Hard": 40, "Intermediate": 20, "Wet": 25}
        deg_rate = {"Soft": 0.12, "Medium": 0.06, "Hard": 0.02, "Intermediate": 0.08, "Wet": 0.05}
        
        tire_mod = self.tire_age * deg_rate.get(self.current_tire, 0.05)
        if self.tire_age > cliff_threshold.get(self.current_tire, 20):
            tire_mod += (self.tire_age - cliff_threshold.get(self.current_tire, 20)) * 0.8 

        fluctuation = random.uniform(0.99, 1.02)
        self.current_lap_time = ((current_base * sc_mult * fluctuation) + tire_mod + tire_mismatch_penalty) * vsc_mult
        self.total_time += self.current_lap_time
        self.tire_age += 1
        
        if sc_mult == 1.0 and vsc_mult == 1.0 and self.current_lap_time < self.best_lap_time:
            self.best_lap_time = self.current_lap_time
            
        return self.current_lap_time

    def pit_stop(self, new_tire: str, is_sc: bool, is_stack: bool, lap: int, race_ref: Any):
        lane_loss = 13.0 if is_sc else 21.0
        change_time = self.pit_skill + random.uniform(-0.2, 0.4)
        if is_stack: change_time += random.uniform(4.0, 6.0) 
            
        total_loss = lane_loss + change_time
        self.total_time += total_loss
        
        self.stints.append((self.current_tire, self.tire_age))
        
        self.current_tire = new_tire
        self.tire_age = 0
        if new_tire in ["Soft", "Medium", "Hard"]: 
            self.used_dry_compounds.add(new_tire)
            
        self.last_pit_lap = lap
        race_ref.log(f"🛠️ {self.name} boxes for {new_tire} ({total_loss:.1f}s).")

    def evaluate_ai_strategy(self, lap: int, total_laps: int, is_sc: bool, track_wetness: float, is_wet_race: bool, gap_to_front: float) -> str:
        if self.status == "DNF" or self.last_pit_lap == lap or self.is_player: 
            return "" # Player strategy is governed by manual input
            
        rem_laps = total_laps - lap
        
        if track_wetness >= 0.2:
            if rem_laps <= 2 and track_wetness < 0.6 and self.current_tire not in ["Intermediate", "Wet"]:
                return ""
            if track_wetness >= 0.6 and self.current_tire != "Wet": return "Wet"
            if 0.2 <= track_wetness < 0.6 and self.current_tire not in ["Intermediate", "Wet"]: return "Intermediate"
        
        if track_wetness < 0.2 and self.current_tire in ["Intermediate", "Wet"]:
            if rem_laps < 15: return "Soft"
            if rem_laps < 30: return "Medium"
            return "Hard"

        must_pit_rule = (not is_wet_race) and (len(self.used_dry_compounds) < 2) and (rem_laps < 6)
        can_undercut = gap_to_front < 1.0 and self.tire_age > 12 and not is_sc
        sc_advantage = is_sc and self.tire_age > 10

        if self.tire_age > 28 or sc_advantage or must_pit_rule or can_undercut:
            if must_pit_rule:
                available = [t for t in ["Soft", "Medium", "Hard"] if t not in self.used_dry_compounds]
                if available: return available[0]
            if rem_laps < 15: return "Soft"
            if rem_laps < 30: return "Medium"
            return "Hard"
            
        return ""

class F1Race:
    def __init__(self, total_laps: int, drivers: list):
        self.total_laps = total_laps
        self.drivers = drivers
        self.sc_active = False
        self.sc_remaining = 0
        
        self.current_lap = 0
        
        self.weather_state = "Dry" 
        self.rain_laps_remaining = 0
        self.track_wetness = 0.0 
        self.is_wet_race_declared = False 
        self.drs_enabled = True
        
        self.race_logs = []
        
        self._prev_sc_active = False
        self._prev_weather_state = "Dry"
        self._prev_track_wetness = 0.0
        self._event_cooldown = 0
        self._mid_lap_pause = False
        
    def log(self, message: str):
        self.race_logs.append(message)
        
    def consume_logs(self):
        logs = self.race_logs.copy()
        self.race_logs.clear()
        return logs

    def get_optimal_tire(self, rem_laps: int, track_wetness: float, current_tire: str, used_coms: set) -> str:
        if track_wetness >= 0.6: return "Wet"
        if 0.2 <= track_wetness < 0.6: return "Intermediate"
        
        must_use = [t for t in ["Soft", "Medium", "Hard"] if t not in used_coms]
        if must_use and rem_laps < 6:
            return must_use[0]
            
        if rem_laps < 15: return "Soft"
        if rem_laps < 30: return "Medium"
        return "Hard"

    def update_weather(self, lap: int):
        self._prev_weather_state = self.weather_state
        self._prev_track_wetness = self.track_wetness
        
        if self.weather_state == "Dry":
            if random.random() < 0.006:
                self.weather_state = "Raining"
                self.rain_laps_remaining = random.randint(5, 12) 
                self.log("☁️ Rain reported in Sector 2.")
        elif self.weather_state == "Raining":
            self.rain_laps_remaining -= 1
            self.track_wetness += random.uniform(0.05, 0.12) 
            if self.rain_laps_remaining <= 0:
                self.weather_state = "Drying"
                self.log("🌤️ Rain passing. Track is drying.")
        elif self.weather_state == "Drying":
            self.track_wetness -= random.uniform(0.04, 0.08) 
            if self.track_wetness <= 0.0:
                self.weather_state = "Dry"
                self.track_wetness = 0.0

        self.track_wetness = max(0.0, min(1.0, self.track_wetness))

        if self.track_wetness >= 0.2 and not self.is_wet_race_declared:
            self.is_wet_race_declared = True
            self.log("📢 Race Control: Official Wet Race declared.")

        if self.track_wetness > 0.15 and self.drs_enabled:
            self.drs_enabled = False
            self.log("📢 Race Control: DRS disabled due to track conditions.")
        elif self.track_wetness <= 0.15 and not self.drs_enabled:
            self.drs_enabled = True
            self.log("📢 Race Control: DRS enabled.")

    def try_trigger_event(self) -> Optional[Dict[str, Any]]:
        player_driver = next((d for d in self.drivers if d.is_player), None)
        if not player_driver or player_driver.status == "DNF":
            return None
            
        if self._event_cooldown > 0:
            self._event_cooldown -= 1
            return None

        # 1. SC deployed
        sc_just_deployed = self.sc_active and not self._prev_sc_active
        if sc_just_deployed:
            return {
                "type": "SC_PIT",
                "message": "Safety Car deployed. Take a cheap pit stop?",
                "options": ["Yes", "No"]
            }
            
        # 2. Weather
        weather_changed_to_rain = (self.weather_state == "Raining" and self._prev_weather_state != "Raining")
        wetness_crossed = (self.track_wetness >= 0.2 and self._prev_track_wetness < 0.2)
        if weather_changed_to_rain or wetness_crossed:
            target_tire = "Inters" if self.track_wetness < 0.6 else "Wets"
            return {
                "type": "WEATHER_PIT",
                "message": f"Rain is hitting the track. Box for {target_tire}?",
                "options": ["Yes", "No"],
                "target_tire": "Intermediate" if target_tire == "Inters" else "Wet"
            }
            
        # 3. Tire Cliff
        cliff_threshold = {"Soft": 15, "Medium": 25, "Hard": 40, "Intermediate": 20, "Wet": 25}
        max_age = cliff_threshold.get(player_driver.current_tire, 20)
        trigger_age = int(max_age * 0.85)
        if player_driver.tire_age == trigger_age and player_driver.tire_age > 0:
            return {
                "type": "TIRE_CLIFF",
                "message": "Tyres are fading fast. Driver requests to box.",
                "options": ["Yes", "No"]
            }
            
        return None

    def advance_until_event(self) -> Dict[str, Any]:
        """
        Advances the race lap by lap until an event triggers or the race finishes.
        """
        while self.current_lap < self.total_laps:
            
            if not self._mid_lap_pause:
                self._prev_sc_active = self.sc_active
                self.current_lap += 1
                self.update_weather(self.current_lap)
                
                event = self.try_trigger_event()
                if event:
                    self._mid_lap_pause = True
                    return {
                        "status": "PAUSED",
                        "current_lap": self.current_lap,
                        "event": event,
                        "logs": self.consume_logs(),
                        "standings": self.get_standings()
                    }

            self._mid_lap_pause = False
            
            active_before_lap = sorted([d for d in self.drivers if d.status == "Racing"], key=lambda x: x.total_time)
            for i, d in enumerate(active_before_lap): d.rank = i + 1

            teams_pitting = set()
            for d in active_before_lap:
                idx = active_before_lap.index(d)
                gap = (d.total_time - active_before_lap[idx-1].total_time) if idx > 0 else 999.0
                new_tire = d.evaluate_ai_strategy(self.current_lap, self.total_laps, self.sc_active, self.track_wetness, self.is_wet_race_declared, gap)
                if new_tire:
                    is_stack = d.team in teams_pitting
                    d.pit_stop(new_tire, self.sc_active, is_stack, self.current_lap, self)
                    teams_pitting.add(d.team)

            sc_m = 1.45 if self.sc_active else 1.0
            for i, d in enumerate(active_before_lap):
                gap = (d.total_time - active_before_lap[i-1].total_time) if i > 0 else 999.0
                d.calculate_lap_time(self.current_lap, sc_m, 1.0, gap, self.track_wetness, self.drs_enabled, self)

            new_dnfs = [d for d in active_before_lap if d.status == "DNF"]
            if new_dnfs:
                if not self.sc_active and random.random() < 0.50:
                    self.sc_active = True
                    self.sc_remaining = random.randint(3, 5)
                    self.log("🟨 SC deployed! Major incident on track.")
                elif not self.sc_active:
                    self.log("🟨 Local Yellow. Car pulled over safely.")
                else:
                    self.sc_remaining += 2 
                    self.log("🟨 Incident under SC! SC window extended.")
            
            elif self.sc_active:
                self.sc_remaining -= 1
                if self.sc_remaining <= 0:
                    self.sc_active = False
                    self.log("🟩 Safety Car in! Green flag racing!")
                    active_now = sorted([d for d in self.drivers if d.status == "Racing"], key=lambda x: x.total_time)
                    if len(active_now) > 0:
                        leader_t = active_now[0].total_time
                        for j, d in enumerate(active_now[1:], 1):
                            d.total_time = leader_t + (j * 0.6)

            if self.current_lap % 5 == 0 and not self.sc_active and active_before_lap:
                self.log(f"Lap {self.current_lap}/{self.total_laps}: {active_before_lap[0].name} leads the race.")

        return {
            "status": "FINISHED",
            "current_lap": self.total_laps,
            "event": None,
            "logs": self.consume_logs(),
            "standings": self.get_standings()
        }

    def get_standings(self):
        final = sorted(self.drivers, key=lambda x: (x.status == "DNF", x.total_time))
        points_system = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
        finishers = [d for d in final if d.status == "Racing"]
        fastest_driver = min(finishers, key=lambda x: x.best_lap_time) if finishers else None
        
        results = []
        leader_time = finishers[0].total_time if finishers else 0.0
        
        for i, d in enumerate(final):
            pts = 0
            if d.status == "Racing" and i < 10:
                pts = points_system[i]
                if d == fastest_driver:
                    pts += 1
            
            gap_str = ""
            if d.status == "Racing":
                if i == 0: gap_str = "Leader"
                else: gap_str = f"+{(d.total_time - leader_time):.3f}s"
            else:
                gap_str = "OUT"
                
            results.append({
                "rank": i + 1 if d.status == "Racing" else "DNF",
                "name": d.name,
                "team": d.team,
                "gap": gap_str,
                "tire": f"{d.current_tire} ({d.tire_age}L)",
                "points": pts
            })
        return results

def create_grid(player_name="Leclerc"):
    drivers_data = [
        ("Verstappen", 74.2, "Medium", "Red Bull", 2.1, 0.7),
        ("Norris", 74.3, "Medium", "McLaren", 2.3, 0.9),
        ("Leclerc", 74.4, "Medium", "Ferrari", 2.4, 0.9),
        ("Hamilton", 74.5, "Medium", "Mercedes", 2.4, 0.75),
        ("Sainz", 74.6, "Soft", "Ferrari", 2.5, 1.0),
        ("Piastri", 74.7, "Medium", "McLaren", 2.3, 0.95),
        ("Russell", 74.8, "Soft", "Mercedes", 2.4, 1.0),
        ("Perez", 75.0, "Soft", "Red Bull", 2.2, 1.15),
        ("Alonso", 75.2, "Medium", "Aston Martin", 2.6, 0.8),
        ("Stroll", 75.5, "Hard", "Aston Martin", 2.6, 0.9),
        ("Tsunoda", 75.6, "Medium", "RB", 2.5, 1.0),
        ("Albon", 75.7, "Medium", "Williams", 2.7, 1.0),
        ("Hulkenberg", 75.8, "Hard", "Haas", 2.8, 0.9),
        ("Ricciardo", 75.9, "Medium", "RB", 2.5, 1.1),
        ("Gasly", 76.0, "Hard", "Alpine", 2.9, 0.9),
        ("Ocon", 76.1, "Medium", "Alpine", 2.9, 0.95),
        ("Magnussen", 76.2, "Hard", "Haas", 2.8, 1.0),
        ("Colapinto", 76.4, "Soft", "Williams", 2.7, 1.2),
        ("Bottas", 76.5, "Hard", "Sauber", 3.2, 0.9),
        ("Zhou", 76.8, "Hard", "Sauber", 3.5, 1.0)
    ]
    grid = []
    for d in drivers_data:
        is_p = (d[0] == player_name)
        grid.append(Driver(d[0], d[1], d[2], d[3], d[4], d[5], is_player=is_p))
    return grid
