import random
import time
import csv
import os

class Driver:
    def __init__(self, name: str, team: str, base_alt: float, pit_skill: float, rain_ability: float, is_player: bool = False):
        self.name = name
        self.team = team
        self.base_alt = base_alt
        self.pit_skill = pit_skill
        self.rain_ability = rain_ability # 越低越强
        self.is_player = is_player
        
        self.total_time = 0.0
        self.current_lap_time = 0.0
        self.status = "Racing"
        
        self.current_tire = ""
        self.tire_age = 0
        self.used_dry_compounds = set() # 记录用过的干胎配方
        
        self.push_mode = 1.0 
        self.engine_issue = False
        self.engine_death_countdown = -1
        self.engine_death_countdown = -1
        self.tire_prompt_cooldown = 0
        self.overtake_cooldown = 0
        self.overtake_boost_laps = 0
        self.overtake_target_name = None
        self.strategy_cooldown = 0
    def execute_pit(self, new_tire: str, is_sc: bool):
        loss = 12.0 if is_sc else 21.0
        loss += self.pit_skill + random.uniform(-0.5, 0.5)
        self.total_time += loss
        self.current_tire = new_tire
        self.tire_age = 0
        if new_tire in ["Soft", "Medium", "Hard"]:
            self.used_dry_compounds.add(new_tire)
        if self.is_player:
            print(f"🛠️ [换胎完成] 你换上了 {new_tire} 胎，进站总耗时 {loss:.1f}s！")

    def calculate_lap(self, lap: int, sc_mult: float, gap_to_front: float, track_wetness: float) -> bool:
        if self.status == "DNF": return False
        
        base = self.base_alt - (lap * 0.05)
        base *= self.push_mode 
        
        # 动态获取轮胎磨损率与悬崖 (针对天气调整)
        deg_rates = {"Soft": 0.12, "Medium": 0.06, "Hard": 0.02, "Intermediate": 0.08, "Wet": 0.05}
        cliffs = {"Soft": 15, "Medium": 25, "Hard": 40, "Intermediate": 20, "Wet": 25}
        
        weather_penalty = 0.0
        crash_chance = 0.0003 # 基础极低失控率

        # --- 核心物理修正：轮胎与天气的真实匹配 ---
        if track_wetness < 0.2: # ☀️ 干地
            if self.current_tire in ["Intermediate", "Wet"]: 
                weather_penalty = 15.0 # 干地用雨胎巨慢无比
                deg_rates[self.current_tire] = 1.0 # 轮胎迅速溶解
                cliffs[self.current_tire] = 3 # 3圈必废
                crash_chance = 0.01
            elif gap_to_front < 1.0 and gap_to_front > 0: 
                weather_penalty = -0.8 # DRS激活
                
        elif 0.2 <= track_wetness < 0.6: # 🌦️ 半湿路面
            if self.current_tire not in ["Intermediate", "Wet"]:
                weather_penalty = 8.0 * self.rain_ability 
                crash_chance = 0.02 * self.rain_ability 
            elif self.current_tire == "Wet":
                weather_penalty = 3.0 # 半湿用全雨胎稍慢
                deg_rates["Wet"] = 0.15
            else: 
                weather_penalty = 1.0 * self.rain_ability 
                crash_chance = 0.0008 * self.rain_ability 
                
        else: # ⛈️ 大暴雨
            if self.current_tire not in ["Intermediate", "Wet"]:
                weather_penalty = 20.0 * self.rain_ability 
                crash_chance = 0.05 * self.rain_ability 
            elif self.current_tire == "Intermediate":
                weather_penalty = 5.0 * self.rain_ability 
                crash_chance = 0.01 * self.rain_ability
            else: 
                weather_penalty = 2.0 * self.rain_ability 
                crash_chance = 0.001 * self.rain_ability 

        if self.push_mode < 1.0: 
            crash_chance *= 5.0 # PUSH mode significantly increases risk
        elif self.push_mode > 1.0:
            crash_chance *= 0.5 # DEFEND mode is safer   
        # 应用衰减与性能悬崖
        cur_deg = deg_rates.get(self.current_tire, 0.05)
        cur_cliff = cliffs.get(self.current_tire, 20)
        
        tire_mod = self.tire_age * cur_deg
        if self.push_mode < 1.0: tire_mod *= 2.2 # PUSH mode wears tires much faster
        elif self.push_mode > 1.0: tire_mod *= 0.8 # DEFEND mode preserves tires
        
        if self.tire_age > cur_cliff:
            tire_mod += (self.tire_age - cur_cliff) * 0.7 # 越过悬崖单圈慢 0.7s (调低防止差距过大)
        
        # Overtake 动态增益
        if getattr(self, "overtake_boost_laps", 0) > 0:
            base *= 0.985 # 额外 1.5% 动力爆发
            self.overtake_boost_laps -= 1
        
        # 引擎物理
        if self.push_mode < 1.0 and not self.engine_issue:
            if random.random() < 0.04: # 4% chance per lap to trigger engine issue when pushing
                self.engine_issue = True
                self.engine_death_countdown = random.randint(3, 8)

        if self.engine_issue:
            self.engine_death_countdown -= 1
            weather_penalty += 1.5 
            if self.push_mode < 1.0: self.engine_death_countdown -= 1 
            
            if self.engine_death_countdown <= 0:
                self.status = "DNF"
                msg = f"\n💥 [悲剧] {self.name} 的赛车失去动力，引擎彻底报废！"
                print(msg)
                return True 

        # 事故判定
        if random.random() < crash_chance:
            self.status = "DNF"
            msg = f"\n🚨 [CRASH] 糟糕！{self.name} 发生严重失误，赛车撞上护墙！"
            print(msg)
            return True 

        self.current_lap_time = (base + tire_mod + weather_penalty) * sc_mult * random.uniform(0.99, 1.02)
        self.total_time += self.current_lap_time
        self.tire_age += 1
        return False

class F1Game:
    def __init__(self):
        self.current_lap = 1
        self.sc_active = False
        self.sc_laps = 0
        self.output_buffer = []
        self.lap_phase = "start"
        self.decision_required = False
        self.decision_type = None
        self.decision_prompts = []
        
        # ── Load tracks from CSV ──
        base_dir = os.path.dirname(os.path.abspath(__file__))
        tracks_path = os.path.join(base_dir, "tracks.csv")
        try:
            with open(tracks_path, newline="", encoding="utf-8") as f:
                tracks = list(csv.DictReader(f))
        except FileNotFoundError:
            tracks = [
                {"id": "monza", "name": "🇮🇹 蒙扎赛道 (Monza)", "description": "速度神殿，引擎消耗极大", "laps": "53", "base_rain_prob": "0.015", "base_lap_time": "83.5"}
            ]

        chosen = random.choice(tracks)
        self.track_info = {
            "id": chosen["id"],
            "name": chosen["name"],
            "desc": chosen["description"],
            "laps": int(chosen["laps"])
        }
        self.total_laps = self.track_info["laps"]
        self.base_rain_prob = float(chosen.get("base_rain_prob", 0.015))
        track_base_lap_time = float(chosen.get("base_lap_time", 83.5))
        
        self.weather_state = "Clear" 
        self.track_wetness = 0.0
        self.rain_countdown = 0
        self.rain_duration = 0
        self.is_wet_race = False
        self.rain_type = "Light"
        self.last_prompt_reasons = []
        
        # ── Load drivers from CSV ──
        # Dynamic ALT: driver_race_alt = track_base_lap_time * pace_modifier
        drivers_path = os.path.join(base_dir, "drivers.csv")
        try:
            with open(drivers_path, newline="", encoding="utf-8") as f:
                rows = list(csv.DictReader(f))
        except FileNotFoundError:
            rows = [
                {"name": "Leclerc", "team": "Ferrari", "pace_modifier": "0.996", "pit_skill": "2.3", "rain_ability": "0.8", "is_player": "True"}
            ]

        self.drivers = []
        for row in rows:
            pace_mod = float(row.get("pace_modifier", 1.0))
            driver_race_alt = track_base_lap_time * pace_mod
            d = Driver(
                name=row["name"],
                team=row["team"],
                base_alt=driver_race_alt,
                pit_skill=float(row["pit_skill"]),
                rain_ability=float(row["rain_ability"]),
                is_player=(row.get("is_player", "False").strip().lower() == "true")
            )
            self.drivers.append(d)
        
        # Assign player reference
        self.player = None
        for d in self.drivers:
            if d.is_player:
                self.player = d
                break
        if self.player is None and self.drivers:
            self.drivers[0].is_player = True
            self.player = self.drivers[0]

    def log(self, msg: str, type="normal"):
        self.output_buffer.append({"message": msg, "type": type})

    def simulate_qualifying(self):
        self.log("="*65)
        self.log("🏎️ 2026 F1 策略大师：排位赛阶段 (QUALIFYING) 🏎️")
        self.log("="*65)
        
        for d in self.drivers:
            q_time = d.base_alt + random.uniform(-0.4, 0.4)
            if d.is_player and random.random() < 0.15:
                self.log(f"⚠️ [灾难] 你的赛车在 Q2 遭遇底板受损，遗憾止步，只能从队尾起步！", "critical")
                q_time += 2.0 
            d.total_time = q_time

        self.drivers.sort(key=lambda x: x.total_time)
        
        self.log("\n🚥 2026 最终发车顺位 (STARTING GRID) 🚥")
        for i, d in enumerate(self.drivers):
            marker = " 👈 (你操控的车手)" if d.is_player else ""
            self.log(f"P{i+1:<2} | {d.name:<12} | {d.team:<15}{marker}")
            d.total_time = (i * 1.5) 

        self.pre_race_briefing()

    def pre_race_briefing(self):
        overall_rain_chance = (1 - (1 - self.base_rain_prob)**self.total_laps) * 100
        self.log("\n" + "═"*65)
        self.log("📋 车队指挥台赛前简报 (PRE-RACE BRIEFING) 📋")
        self.log("═"*65)
        self.log(f"📍 比赛场地：{self.track_info['name']}")
        self.log(f"📝 赛道特性：{self.track_info['desc']}")
        self.log(f"🏁 比赛长度：{self.total_laps} 圈")
        self.log(f"🌦️ 气象雷达：预测降雨概率约为 {overall_rain_chance:.1f}%")
        self.log("-" * 65)
        
        rank = self.drivers.index(self.player) + 1
        if rank <= 5: 
            self.log(f"💡 赛事工程师：'你在前排起步，建议选用 [Medium] 稳扎稳打。'", "strategy")
            default_tire = "Medium"
        else: 
            self.log(f"💡 赛事工程师：'你在 P{rank}，建议 [Soft] 起步强吃对手。'", "strategy")
            default_tire = "Soft"
            
        # For auto-play API, we'll set default tire internally.
        self.player.current_tire = default_tire
        self.player.used_dry_compounds.add(default_tire)
            
        for d in self.drivers:
            if not d.is_player: 
                d.current_tire = random.choice(["Medium", "Hard"])
                d.used_dry_compounds.add(d.current_tire)
            
        self.log(f"\n✅ 策略锁定！五盏红灯熄灭，比赛正式开始！", "critical")

    def update_weather(self) -> str:
        msg = ""
        type_str = "weather"
        if self.weather_state == "Clear":
            if random.random() < self.base_rain_prob: 
                self.weather_state = "Warning"
                self.rain_countdown = random.randint(1, 4)
                msg = f"📻 [车队 TR] '雷达显示大片云团正在逼近，预计 {self.rain_countdown} 圈后开始降雨！'"
        elif self.weather_state == "Warning":
            self.rain_countdown -= 1
            if self.rain_countdown <= 0:
                self.weather_state = "Raining"
                self.rain_duration = random.randint(5, 12)
                self.rain_type = random.choice(["Light", "Heavy"])
                self.track_wetness = 0.15
                msg = "🌧️ [天气] 滴答... 赛道上空开始飘雨了！抓地力正在下降。"
        elif self.weather_state == "Raining":
            self.rain_duration -= 1
            
            if self.rain_type == "Light":
                # Light rain: averages lower wetness, caps earlier
                change = random.uniform(-0.10, 0.18) 
                max_wet = 0.58 
            else:
                # Heavy rain: trends higher, can reach 1.0 (Full Wet)
                change = random.uniform(0.05, 0.30)
                max_wet = 1.0

            old_wet = self.track_wetness
            self.track_wetness = max(0.1, min(max_wet, self.track_wetness + change))
            
            if self.track_wetness >= 0.2 and not self.is_wet_race:
                self.is_wet_race = True
                msg += " 📢 [赛会公告] 本场宣布为湿地比赛，干胎强制两停规则解除！"
            
            if self.track_wetness - old_wet > 0.15 and self.track_wetness > 0.6: 
                msg = "⛈️ [天气] 雨势骤然增大，变成大暴雨了！赛道出现大量积水！"
            elif self.track_wetness - old_wet < -0.1: 
                msg = "🌦️ [天气] 雨势开始减弱了。"
                
            if self.rain_duration <= 0:
                self.weather_state = "Drying"
                msg = "🌤️ [天气] 雨停了！阳光重新出现，赛道将开始变干。"
        elif self.weather_state == "Drying":
            self.track_wetness -= random.uniform(0.05, 0.15)
            if self.track_wetness <= 0:
                self.track_wetness = 0.0
                self.weather_state = "Clear"
                msg = "☀️ [天气] 赛道已经完全变干，可以放心使用干胎了！"
        
        return msg

    def check_player_decision(self, active, weather_msg):
        weather_msg = weather_msg or ""
        if self.player.status != "Racing": return False, [], None
        
        idx = active.index(self.player)
        gap_front = (self.player.total_time - active[idx-1].total_time) if idx > 0 else 999.0
        # Ensure gap is positive to avoid lapping-index bugs
        if gap_front < 0: gap_front = 999.0
        cliff_age = {"Soft": 15, "Medium": 25, "Hard": 40, "Intermediate": 20, "Wet": 25}.get(self.player.current_tire, 20)
        
        engine_alert_this_lap = False
        if not self.player.engine_issue and random.random() < 0.01:
            self.player.engine_issue = True
            self.player.engine_death_countdown = random.randint(2, 5) 
            engine_alert_this_lap = True

        need_prompt = False
        prompt_reasons = []
        
        if "车队 TR" in weather_msg:
            need_prompt = True; prompt_reasons.append("🌧️ 暴雨预警！是否提前进站换雨胎赌一把？")
        elif self.track_wetness >= 0.6 and self.player.current_tire != "Wet":
            need_prompt = True; prompt_reasons.append("⚠️ 赛道出现大面积积水！必须更换全雨胎(W)！")
        elif 0.2 <= self.track_wetness < 0.6 and self.player.current_tire not in ["Intermediate", "Wet"]:
            need_prompt = True; prompt_reasons.append("⚠️ 赛道已湿滑！干胎极其危险，立刻更换半雨胎(I)！")
        elif self.track_wetness < 0.2 and self.player.current_tire in ["Intermediate", "Wet"] and self.weather_state not in ["Warning", "Raining"]:
            need_prompt = True; prompt_reasons.append("☀️ 赛道已干！雨胎正在过热溶解，必须立即换回干胎！")
        elif self.sc_active and self.sc_laps == 3: 
            need_prompt = True; prompt_reasons.append("🟨 安全车在场，进站损失减半，是否进站？")
        elif self.player.tire_age >= cliff_age - 1:
            need_prompt = True; prompt_reasons.append(f"📉 你的 {self.player.current_tire} 胎即将耗尽，抓地力马上断崖式下跌！")
            
        if not self.is_wet_race and len(self.player.used_dry_compounds) < 2 and (self.total_laps - self.current_lap <= 2):
            need_prompt = True; prompt_reasons.append("🚨 规则警告：你尚未达成【至少使用两款干胎】的要求，本圈必须进站！")

        if engine_alert_this_lap:
            need_prompt = True; prompt_reasons.append("⚙️ [严重警告] 引擎传来异常抖动，动力正在流失！")

        # If we have pit-related prompts, prioritize them and don't trigger overtake
        if need_prompt and self.player.tire_prompt_cooldown <= 0:
            return True, prompt_reasons, "pit"
            
        # Overtake logic (gap <= 1.0s and positive)
        if 0.1 <= gap_front <= 1.0 and self.player.overtake_cooldown <= 0 and idx > 0:
            target = active[idx-1]
            return True, [f"💨 你追进了 {target.name} 的 DRS 区 (差距 {gap_front:.1f}s)！是否尝试超越？"], "overtake"

        return False, [], None

    def advance_lap(self):
        self.output_buffer = [] # Clear buffer for this tick
        
        # Always progress strategy cooldown at the start of any tick
        if self.player.strategy_cooldown > 0:
            self.player.strategy_cooldown -= 1
            
        if self.current_lap > self.total_laps:
            if self.lap_phase != "finished":
                self.print_results()
                self.lap_phase = "finished"
            return
            
        if self.lap_phase == "start":
            weather_msg = self.update_weather()
            if weather_msg: self.log(weather_msg, "weather")
            
            active = sorted([d for d in self.drivers if d.status == "Racing"], key=lambda x: x.total_time)
            self.active_drivers = active
            
            need_prompt, reasons, dtype = self.check_player_decision(active, weather_msg)
            if need_prompt:
                self.decision_required = True
                self.decision_prompts = reasons
                self.decision_type = dtype
                if dtype == "pit":
                    self.last_prompt_reasons = reasons
                for r in reasons: self.log(f"🔔 {r}", "strategy")
                self.lap_phase = "waiting_decision"
                return
            else:
                self.lap_phase = "process"
                
        if self.lap_phase == "process":
            # AI Decisions
            for d in self.active_drivers:
                if d.is_player: continue
                cliff = {"Soft": 15, "Medium": 25, "Hard": 40}.get(d.current_tire, 20)
                if self.track_wetness >= 0.6 and d.current_tire != "Wet":
                    d.execute_pit("Wet", self.sc_active) 
                elif 0.2 <= self.track_wetness < 0.6 and d.current_tire not in ["Intermediate", "Wet"]:
                    d.execute_pit("Intermediate", self.sc_active) 
                elif self.track_wetness < 0.2 and d.current_tire in ["Intermediate", "Wet"]:
                    d.execute_pit("Medium" if self.total_laps - self.current_lap > 15 else "Soft", self.sc_active)
                elif d.tire_age > cliff and self.track_wetness < 0.2:
                    d.execute_pit("Hard" if self.current_lap < 15 else "Soft", self.sc_active)
                elif not self.is_wet_race and len(d.used_dry_compounds) < 2 and (self.total_laps - self.current_lap <= 2):
                    avail = [t for t in ["Soft", "Medium", "Hard"] if t not in d.used_dry_compounds]
                    if avail: d.execute_pit(avail[0], self.sc_active)

            # Lap Simulation
            sc_m = 1.4 if self.sc_active else 1.0
            sc_triggered_this_lap = False
            for i, d in enumerate(self.active_drivers):
                gap = (d.total_time - self.active_drivers[i-1].total_time) if i > 0 else 999.0
                
                # 如果是正在进行超车冲刺的玩家，检查是否已超过目标
                if d.is_player and d.overtake_boost_laps > 0 and d.overtake_target_name:
                    target_d = next((x for x in self.drivers if x.name == d.overtake_target_name), None)
                    if target_d and d.total_time < target_d.total_time:
                        d.overtake_boost_laps = 0 # 位置已发生变化，终结超车增益
                        self.log("🏁 [Overtake] 任务达成！你已成功拉开差距，超车增益结束。", "strategy")

                old_status = d.status
                is_dnf = d.calculate_lap(self.current_lap, sc_m, gap, self.track_wetness)
                if is_dnf:
                    if d.status == "DNF" and old_status != "DNF":
                         if d.engine_death_countdown <= 0 and d.engine_issue:
                             self.log(f"💥 [悲剧] {d.name} 的赛车失去动力，引擎彻底报废！", "critical")
                         else:
                             self.log(f"🚨 [CRASH] 糟糕！{d.name} 发生严重失误，赛车撞上护墙！", "critical")
                    if random.random() < 0.5: sc_triggered_this_lap = True

            # Safety Car logic
            if sc_triggered_this_lap:
                if not self.sc_active:
                    self.sc_active = True; self.sc_laps = 3
                    self.log(f"🟨 赛会提示：事故引发 SAFETY CAR (安全车) 出动！赛道禁止超车。", "critical")
                else: self.sc_laps += 2 
            elif self.sc_active:
                self.sc_laps -= 1
                if self.sc_laps <= 0:
                    self.sc_active = False
                    self.log(f"🟩 赛会提示：安全车撤离，绿旗比赛重新开始！", "critical")
                    
            if self.player.status == "Racing" and not self.decision_required:
                if self.current_lap % 5 == 0 or self.sc_active:
                    try:
                        p_idx = self.active_drivers.index(self.player) + 1
                        self.log(f"🏎️ 比赛推进中... [Lap {self.current_lap}/{self.total_laps}] 你当前处于 P{p_idx}")
                    except ValueError:
                        pass # Player is no longer racing

            self.current_lap += 1
            if self.player.tire_prompt_cooldown > 0:
                self.player.tire_prompt_cooldown -= 1
            if self.player.overtake_cooldown > 0:
                self.player.overtake_cooldown -= 1
            
        self.lap_phase = "start"

    def apply_decision(self, choice: str, tire: str = None):
        if choice.lower() == "stay_out":
            self.player.tire_prompt_cooldown = 3
            self.log("📻 [Strategy] 你选择了 Stay Out。接下来 3 圈将不会提示进站。", "strategy")
        elif choice.lower() == "push":
            self.player.push_mode = 0.997
            self.log("📻 [Mode] 进入全攻模式！压榨引擎极限，轮胎面临过度磨损，事故风险极高！", "critical")
        elif choice.lower() == "defend":
            self.player.push_mode = 1.006
            self.log("📻 [Mode] 防守模式启动。保护轮胎与引擎，降低事故风险，但单圈速度略微下降。", "strategy")
        elif choice.lower() == "neutral":
            self.player.push_mode = 1.0
            self.log("📻 [Mode] 恢复标准比赛节奏。", "strategy")
        elif choice.lower() == "overtake":
            self.player.overtake_cooldown = 3
            success = random.random() < 0.6
            if success:
                self.player.total_time -= 0.5 # 初始动作身位赚 0.5s
                self.player.overtake_boost_laps = 3 # 接下来 3 圈享有额外动力直到完成超越
                idx = self.active_drivers.index(self.player)
                self.player.overtake_target_name = self.active_drivers[idx-1].name
                self.log(f"⚡ [Overtake] 极其精彩的晚杀车！你切入内线，正在全力超越 {self.player.overtake_target_name}！", "critical")
            else:
                self.player.total_time += 1.0
                self.log("⚠️ [Overtake] 超车失败！你在弯角走大了，损失了时间。", "warning")
        elif choice.lower() == "abort_overtake":
            self.player.overtake_cooldown = 3
            self.log("📻 [Strategy] 你选择了稳妥起见，放弃本次超车机会。", "strategy")
        
        self.log(f"📻 收到指令：{choice} {tire if tire else ''}", "strategy")
        if choice.lower() == "box" and tire:
            t_map = {
                'S':"Soft", 'SOFT':"Soft",
                'M':"Medium", 'MEDIUM':"Medium",
                'H':"Hard", 'HARD':"Hard",
                'I':"Intermediate", 'INTERMEDIATE':"Intermediate",
                'W':"Wet", 'WET':"Wet"
            }
            mapped = t_map.get(tire.upper(), "Medium")
            loss = 12.0 if self.sc_active else 21.0
            loss += self.player.pit_skill + random.uniform(-0.5, 0.5)
            self.player.total_time += loss
            self.player.current_tire = mapped
            self.player.tire_age = 0
            if mapped in ["Soft", "Medium", "Hard"]:
                self.player.used_dry_compounds.add(mapped)
            self.log(f"🛠️ [换胎完成] 你换上了 {mapped} 胎，进站总耗时 {loss:.1f}s！", "strategy")
        
        self.decision_required = False
        self.lap_phase = "process"
        # Removed redundant self.advance_lap() to prevent double-skipping laps
        return

    def apply_strategy_change(self, action: str):
        if action.lower() == "push":
            self.player.push_mode = 0.997
            self.log("📻 [Strategy] 指令确认：全进击模式！增加引擎出力。", "strategy")
        elif action.lower() == "defend":
            self.player.push_mode = 1.006
            self.log("📻 [Strategy] 指令确认：防守模式。开始保护轮胎。", "strategy")
        elif action.lower() == "neutral":
            self.player.push_mode = 1.0
            self.log("📻 [Strategy] 指令确认：恢复标准节奏。", "strategy")
        
        self.player.strategy_cooldown = 1 # 1 lap cooldown

    def print_results(self):
        self.log("🏁 冲线！比赛结束！(FINAL CLASSIFICATION) 🏁", "critical")
        final = sorted(self.drivers, key=lambda x: (x.status == "DNF", x.total_time))
        leader_time = final[0].total_time if final and final[0].status == "Racing" else 0.0
        self.final_results = []
        for i, d in enumerate(final):
            pos = i + 1 if d.status == "Racing" else -1
            gap = "Winner" if i == 0 else (f"+{(d.total_time - leader_time):.2f}s" if d.status == "Racing" else "DNF")
            self.final_results.append({
                "position": pos,
                "name": d.name,
                "team": d.team,
                "gap": gap,
                "tire": {"Soft":"S","Medium":"M","Hard":"H","Intermediate":"I","Wet":"W"}.get(d.current_tire, d.current_tire[0] if d.current_tire else "?"),
                "isPlayer": getattr(d, 'is_player', False),
                "status": d.status
            })

if __name__ == "__main__":
    # Test script locally
    game = F1Game()
    game.simulate_qualifying()
    while game.current_lap <= game.total_laps:
        game.advance_lap()
        if game.decision_required:
            game.apply_decision("stay")
        for msg in game.output_buffer:
            print(msg)