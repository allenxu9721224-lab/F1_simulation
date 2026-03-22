import random

class Driver:
    def __init__(self, name: str, base_alt: float, starting_tire: str, team: str, pit_skill: float = 2.4, rain_ability: float = 1.0):
        self.name = name
        self.base_alt = base_alt
        self.team = team
        self.pit_skill = pit_skill 
        self.rain_ability = rain_ability 
        
        self.total_time = 0.0
        self.current_lap_time = 0.0
        self.best_lap_time = float('inf') 
        self.status = "Racing"
        
        # 轮胎与策略追踪
        self.current_tire = starting_tire 
        self.tire_age = 0
        self.used_dry_compounds = set() 
        self.stints = [] # 用于记录历史每一次换胎的配方与圈数
        
        if starting_tire in ["Soft", "Medium", "Hard"]:
            self.used_dry_compounds.add(starting_tire)
            
        self.rank = 0
        self.last_pit_lap = -1
        self.fuel_lap_benefit = 0.06 
        self.is_in_drs = False
        self.points = 0 

    def calculate_lap_time(self, lap_num: int, sc_mult: float, vsc_mult: float, gap_to_front: float, track_wetness: float, drs_enabled: bool) -> float:
        if self.status == "DNF": return 0.0

        current_base = self.base_alt - (lap_num * self.fuel_lap_benefit)
        tire_mismatch_penalty = 0.0
        
        crash_chance = 0.0003 # 调低基础 DNF 概率 (原 0.001)
        mechanical_failure_chance = 0.0005 # 原 0.0015
        
        if track_wetness < 0.2: 
            if self.current_tire in ["Intermediate", "Wet"]:
                tire_mismatch_penalty = 5.0 + (self.tire_age * 0.5) 
            elif drs_enabled and 0.2 < gap_to_front < 1.0:
                tire_mismatch_penalty = -0.8
                self.is_in_drs = True
        elif 0.2 <= track_wetness < 0.6: 
            if self.current_tire not in ["Intermediate", "Wet"]:
                tire_mismatch_penalty = 12.0 * self.rain_ability 
                crash_chance = 0.015 * self.rain_ability # 原 0.06
            else:
                tire_mismatch_penalty = 2.0 * self.rain_ability
                crash_chance = 0.002 * self.rain_ability # 原 0.01
        else: 
            if self.current_tire != "Wet":
                tire_mismatch_penalty = 25.0 * self.rain_ability
                crash_chance = 0.03 * self.rain_ability # 原 0.18
            else:
                tire_mismatch_penalty = 5.0 * self.rain_ability
                crash_chance = 0.003 * self.rain_ability # 原 0.02

        if random.random() < mechanical_failure_chance:
            self.status = "DNF"
            print(f"💥 [DNF] {self.name} 的赛车尾部冒出大量白烟！遭遇引擎机械故障，停在赛道边。")
            return 0.0
        elif random.random() < crash_chance:
            self.status = "DNF"
            weather_desc = "湿滑路面上" if track_wetness >= 0.2 else "激烈对抗中"
            print(f"🚨 [CRASH] {self.name} 在{weather_desc}失控打滑，重重撞上护墙，触发 DNF!")
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

    def pit_stop(self, new_tire: str, is_sc: bool, is_stack: bool, lap: int):
        lane_loss = 13.0 if is_sc else 21.0
        change_time = self.pit_skill + random.uniform(-0.2, 0.4)
        if is_stack: change_time += random.uniform(4.0, 6.0) 
            
        total_loss = lane_loss + change_time
        self.total_time += total_loss
        
        # 记录本次完整的Stint (轮胎配方, 跑了多少圈)
        self.stints.append((self.current_tire, self.tire_age))
        
        old_tire = self.current_tire
        old_age = self.tire_age
        
        self.current_tire = new_tire
        self.tire_age = 0
        if new_tire in ["Soft", "Medium", "Hard"]: 
            self.used_dry_compounds.add(new_tire)
            
        self.last_pit_lap = lap
        print(f"🛠️ Lap {lap}: [{self.name}] ({self.team}) 进站换上 {new_tire}. (卸下 {old_tire} 胎, 已用 {old_age} 圈) 耗时: {total_loss:.2f}s")

    def evaluate_ai_strategy(self, lap: int, total_laps: int, is_sc: bool, track_wetness: float, is_wet_race: bool, gap_to_front: float) -> str:
        if self.status == "DNF" or self.last_pit_lap == lap: return ""
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
        
        self.weather_state = "Dry" 
        self.rain_laps_remaining = 0
        self.track_wetness = 0.0 
        self.is_wet_race_declared = False 
        self.drs_enabled = True

    def print_starting_grid(self):
        print("\n" + "═"*75)
        print(f"🚥 发车顺位 (STARTING GRID) - 全程 {self.total_laps} 圈 🚥")
        print("═"*75)
        print(f"{'POS':<4} | {'车手 (DRIVER)':<15} | {'车队 (TEAM)':<15} | {'起步轮胎 (TIRE)'}")
        print("-" * 75)
        for i, d in enumerate(self.drivers):
            print(f"{i+1:<4} | {d.name:<15} | {d.team:<15} | {d.current_tire}")
        print("═"*75 + "\n")

    def update_weather(self, lap: int):
        if self.weather_state == "Dry":
            # 将单圈降雨概率从 0.025 调低至 0.006 (约千分之六)
            if random.random() < 0.006:
                self.weather_state = "Raining"
                self.rain_laps_remaining = random.randint(5, 12) 
                print(f"\n☁️ [WEATHER ALERT] 天气突变！赛道上空出现雨云，预计降雨将持续 {self.rain_laps_remaining} 圈！")
        elif self.weather_state == "Raining":
            self.rain_laps_remaining -= 1
            self.track_wetness += random.uniform(0.05, 0.12) 
            if self.rain_laps_remaining <= 0:
                self.weather_state = "Drying"
                print(f"\n🌤️ [WEATHER ALERT] 雨停了！赛道积水将逐渐消退。")
        elif self.weather_state == "Drying":
            self.track_wetness -= random.uniform(0.04, 0.08) 
            if self.track_wetness <= 0.0:
                self.weather_state = "Dry"
                self.track_wetness = 0.0

        self.track_wetness = max(0.0, min(1.0, self.track_wetness))

        if self.track_wetness >= 0.2 and not self.is_wet_race_declared:
            self.is_wet_race_declared = True
            print(f"📢 [RACE CONTROL] 官方宣布本场为湿地比赛 (WET RACE)。强制两套干胎规则已取消！")

        if self.track_wetness > 0.15 and self.drs_enabled:
            self.drs_enabled = False
            print(f"📢 [RACE CONTROL] 赛道湿滑，DRS 已被禁用。")
        elif self.track_wetness <= 0.15 and not self.drs_enabled:
            self.drs_enabled = True
            print(f"📢 [RACE CONTROL] 赛道恢复干燥，DRS 已启用。")

    def run_race(self):
        self.print_starting_grid()
        print("🟢 五盏红灯熄灭，比赛正式开始！")
        
        for lap in range(1, self.total_laps + 1):
            self.update_weather(lap)
            active_before_lap = sorted([d for d in self.drivers if d.status == "Racing"], key=lambda x: x.total_time)
            for i, d in enumerate(active_before_lap): d.rank = i + 1

            teams_pitting = set()
            for d in active_before_lap:
                idx = active_before_lap.index(d)
                gap = (d.total_time - active_before_lap[idx-1].total_time) if idx > 0 else 999.0
                new_tire = d.evaluate_ai_strategy(lap, self.total_laps, self.sc_active, self.track_wetness, self.is_wet_race_declared, gap)
                if new_tire:
                    is_stack = d.team in teams_pitting
                    d.pit_stop(new_tire, self.sc_active, is_stack, lap)
                    teams_pitting.add(d.team)

            sc_m = 1.45 if self.sc_active else 1.0
            for i, d in enumerate(active_before_lap):
                gap = (d.total_time - active_before_lap[i-1].total_time) if i > 0 else 999.0
                d.calculate_lap_time(lap, sc_m, 1.0, gap, self.track_wetness, self.drs_enabled)

            new_dnfs = [d for d in active_before_lap if d.status == "DNF"]
            if new_dnfs:
                # 只有 50% 的 DNF 会严重到需要出动实体安全车 (可以视为撞车停在赛道中间)
                if not self.sc_active and random.random() < 0.50:
                    self.sc_active = True
                    self.sc_remaining = random.randint(3, 5)
                    names = ", ".join([d.name for d in new_dnfs])
                    print(f"\n--- 🟨 LAP {lap}: 赛道出现严重事故 ({names} 退出比赛)，SAFETY CAR DEPLOYED! ---")
                elif not self.sc_active:
                    # 另外 50% 只是局部黄旗/安全停车，不出 SC
                    names = ", ".join([d.name for d in new_dnfs])
                    print(f"\n--- 🟨 LAP {lap}: 局部黄旗。{names} 已将赛车停在安全区域，不触发安全车。 ---")
                else:
                    self.sc_remaining += 2 
                    print(f"--- 🟨 LAP {lap}: 安全车带领下再次发生事故！安全车时间延长。 ---")
            
            elif self.sc_active:
                self.sc_remaining -= 1
                if self.sc_remaining <= 0:
                    self.sc_active = False
                    print(f"--- 🟩 LAP {lap}: 赛道清理完毕，SAFETY CAR ENDS. 比赛重新开始！ ---")
                    active_now = sorted([d for d in self.drivers if d.status == "Racing"], key=lambda x: x.total_time)
                    if len(active_now) > 0:
                        leader_t = active_now[0].total_time
                        for j, d in enumerate(active_now[1:], 1):
                            d.total_time = leader_t + (j * 0.6)

        # 赛后输出流
        self.print_standings()
        self.print_strategy_chart()

    def print_standings(self):
        final = sorted(self.drivers, key=lambda x: (x.status == "DNF", x.total_time))
        points_system = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
        
        finishers = [d for d in final if d.status == "Racing"]
        fastest_driver = min(finishers, key=lambda x: x.best_lap_time) if finishers else None
        
        for i, d in enumerate(finishers):
            if i < 10:
                d.points += points_system[i]
                if d == fastest_driver:
                    d.points += 1

        leader_time = finishers[0].total_time if finishers else 0.0

        print("\n" + "═"*115)
        print(f"🏁 比赛结束 (最终排名与积分榜) 🏁")
        print("═"*115)
        # 添加了“总用时”列，调整了宽度排版
        print(f"{'POS':<4} | {'车手':<12} | {'车队':<12} | {'总用时':<12} | {'状态 / Gap':<12} | {'冲线轮胎(圈数)':<15} | {'最快圈':<12} | {'PTS'}")
        print("-" * 115)
        
        for i, d in enumerate(final):
            pos = str(i + 1)
            pts = str(d.points) if d.points > 0 else "-"
            best_lap = f"{d.best_lap_time:.3f}s" if d.best_lap_time != float('inf') else "N/A"
            tire_info = f"{d.current_tire} ({d.tire_age}L)"
            
            if d.status == "Racing":
                total_time_str = f"{d.total_time:.3f}s"
                if i == 0:
                    time_info = "Leader"
                else:
                    time_info = f"+{(d.total_time - leader_time):.3f}s"
            else:
                pos = "DNF"
                total_time_str = "N/A"
                time_info = "OUT"
                pts = "0"
                
            if d == fastest_driver and d.status == "Racing":
                best_lap += " ⏱️"
                if i < 10: pts += " (+1)"

            print(f"{pos:<4} | {d.name:<12} | {d.team:<12} | {total_time_str:<12} | {time_info:<12} | {tire_info:<15} | {best_lap:<12} | {pts}")
        
        print("═"*115)
        if fastest_driver:
            point_awarded = "并获得 1 个额外积分！" if final.index(fastest_driver) < 10 else "但由于未在积分区完赛，未获额外积分。"
            print(f"🟣 获得本场最快圈速的车手是：{fastest_driver.name} ({fastest_driver.best_lap_time:.3f}s) {point_awarded}")

    def print_strategy_chart(self):
        print("\n" + "═"*115)
        print(f"📊 全场轮胎策略与进站时间轴 (TIRE STRATEGY & PIT STOPS)")
        print("═"*115)
        
        emoji_map = {
            "Soft": "🔴S", 
            "Medium": "🟡M", 
            "Hard": "⚪H", 
            "Intermediate": "🟢I", 
            "Wet": "🔵W"
        }
        
        final = sorted(self.drivers, key=lambda x: (x.status == "DNF", x.total_time))
        
        for d in final:
            pos = final.index(d) + 1 if d.status == "Racing" else "DNF"
            stint_strings = []
            
            for tire_type, laps in d.stints:
                icon = emoji_map.get(tire_type, tire_type)
                stint_strings.append(f"[{icon} {laps}L]")
                
            final_icon = emoji_map.get(d.current_tire, d.current_tire)
            final_stint_str = f"[{final_icon} {d.tire_age}L]"
            
            if d.status == "DNF":
                final_stint_str += " 💥(OUT)"
            else:
                final_stint_str += " 🏁(FIN)"
                
            stint_strings.append(final_stint_str)
            
            timeline = " ➡️ ".join(stint_strings)
            print(f"{pos:<4} | {d.name:<12} | {timeline}")
            
        print("═"*115 + "\n")

# --- 构建完整的 20 台赛车发车大名单 ---
full_grid = [
    Driver("Verstappen", 74.2, "Medium", "Red Bull", 2.1, rain_ability=0.7),
    Driver("Norris", 74.3, "Medium", "McLaren", 2.3, rain_ability=0.9),
    Driver("Leclerc", 74.4, "Medium", "Ferrari", 2.4, rain_ability=0.9),
    Driver("Hamilton", 74.5, "Medium", "Mercedes", 2.4, rain_ability=0.75),
    Driver("Sainz", 74.6, "Soft", "Ferrari", 2.5, rain_ability=1.0),
    Driver("Piastri", 74.7, "Medium", "McLaren", 2.3, rain_ability=0.95),
    Driver("Russell", 74.8, "Soft", "Mercedes", 2.4, rain_ability=1.0),
    Driver("Perez", 75.0, "Soft", "Red Bull", 2.2, rain_ability=1.15),
    Driver("Alonso", 75.2, "Medium", "Aston Martin", 2.6, rain_ability=0.8),
    Driver("Stroll", 75.5, "Hard", "Aston Martin", 2.6, rain_ability=0.9),
    Driver("Tsunoda", 75.6, "Medium", "RB", 2.5, rain_ability=1.0),
    Driver("Albon", 75.7, "Medium", "Williams", 2.7, rain_ability=1.0),
    Driver("Hulkenberg", 75.8, "Hard", "Haas", 2.8, rain_ability=0.9),
    Driver("Ricciardo", 75.9, "Medium", "RB", 2.5, rain_ability=1.1),
    Driver("Gasly", 76.0, "Hard", "Alpine", 2.9, rain_ability=0.9),
    Driver("Ocon", 76.1, "Medium", "Alpine", 2.9, rain_ability=0.95),
    Driver("Magnussen", 76.2, "Hard", "Haas", 2.8, rain_ability=1.0),
    Driver("Colapinto", 76.4, "Soft", "Williams", 2.7, rain_ability=1.2),
    Driver("Bottas", 76.5, "Hard", "Sauber", 3.2, rain_ability=0.9),
    Driver("Zhou", 76.8, "Hard", "Sauber", 3.5, rain_ability=1.0)
]

race = F1Race(50, full_grid)
race.run_race()