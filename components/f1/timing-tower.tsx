"use client"

import { cn } from "@/lib/utils"

type TireCompound = "S" | "M" | "H" | "I" | "W"

interface Driver {
  position: number
  name: string
  team: string
  tire: TireCompound
  tireLaps: number
  gap: string
  isPlayer?: boolean
  isDNF?: boolean
}

interface TimingTowerProps {
  drivers: Driver[]
}

const tireColors: Record<TireCompound, string> = {
  S: "bg-red-500 text-white",
  M: "bg-yellow-400 text-black",
  H: "bg-white text-black",
  I: "bg-green-500 text-white",
  W: "bg-blue-500 text-white",
}

const tireLabels: Record<TireCompound, string> = {
  S: "软",
  M: "中",
  H: "硬",
  I: "中性",
  W: "雨胎",
}

export function TimingTower({ drivers }: TimingTowerProps) {
  const activeDrivers = drivers.filter((d) => !d.isDNF)
  const dnfDrivers = drivers.filter((d) => d.isDNF)

  return (
    <aside className="w-72 bg-card/50 border-r border-border overflow-y-auto">
      <div className="sticky top-0 bg-card/90 backdrop-blur-sm border-b border-border px-4 py-3">
        <h2 className="text-xs font-bold tracking-widest text-muted-foreground">
          实时排名
        </h2>
      </div>

      <div className="p-2 space-y-1">
        {activeDrivers.map((driver) => (
          <DriverRow key={driver.name} driver={driver} />
        ))}

        {dnfDrivers.length > 0 && (
          <>
            <div className="pt-3 pb-1 px-2">
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground/50">
                退赛
              </span>
            </div>
            {dnfDrivers.map((driver) => (
              <DriverRow key={driver.name} driver={driver} />
            ))}
          </>
        )}
      </div>
    </aside>
  )
}

function DriverRow({ driver }: { driver: Driver }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
        driver.isDNF
          ? "opacity-40 bg-muted/30"
          : driver.isPlayer
            ? "bg-primary/20 border border-primary/40 shadow-[0_0_15px_oklch(0.55_0.25_25/0.2)]"
            : "bg-muted/40 hover:bg-muted/60"
      )}
    >
      {/* Position */}
      <span
        className={cn(
          "w-7 text-center font-mono font-bold text-lg",
          driver.position <= 3 && !driver.isDNF ? "text-primary" : "text-muted-foreground"
        )}
      >
        {driver.isDNF ? "—" : driver.position}
      </span>

      {/* Driver Name */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "block font-bold text-sm truncate",
            driver.isPlayer ? "text-primary" : "text-foreground"
          )}
        >
          {driver.name}
        </span>
        <span className="text-[10px] text-muted-foreground truncate">
          {driver.team}
        </span>
      </div>

      {/* Tire Status */}
      {!driver.isDNF && (
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold",
              tireColors[driver.tire]
            )}
            title={tireLabels[driver.tire]}
          >
            {driver.tire}
          </span>
          <span className="text-xs text-muted-foreground font-mono w-4 text-right">
            {driver.tireLaps}
          </span>
        </div>
      )}

      {/* Gap */}
      <span
        className={cn(
          "text-xs font-mono w-16 text-right",
          driver.position === 1 && !driver.isDNF
            ? "text-primary font-bold"
            : "text-muted-foreground"
        )}
      >
        {driver.isDNF ? "DNF" : driver.gap}
      </span>
    </div>
  )
}
