import { useMemo } from "react"
import { Event } from "@/types"
import { cn } from "@/lib/utils"
import { format, startOfWeek, endOfWeek, addDays, getDay, isWithinInterval } from "date-fns"
import { Clock, MapPin } from "lucide-react"

interface AgendaGridProps {
  events: Event[]
  orientation: "horizontal" | "vertical"
  currentDayOfWeek: number // 0=Sun, 1=Mon...
}

const WEEKDAYS_PT = [
  { index: 0, label: "Dom", short: "D" },
  { index: 1, label: "Seg", short: "S" },
  { index: 2, label: "Ter", short: "T" },
  { index: 3, label: "Qua", short: "Q" },
  { index: 4, label: "Qui", short: "Q" },
  { index: 5, label: "Sex", short: "S" },
  { index: 6, label: "Sab", short: "S" },
]

export function AgendaGrid({
  events,
  orientation,
  currentDayOfWeek,
}: AgendaGridProps) {
  const weekDays = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekStart, i)
      return {
        date: day,
        dayOfWeek: getDay(day),
        label: WEEKDAYS_PT[getDay(day)].label,
        dateLabel: format(day, "dd/MM"),
      }
    })
  }, [])

  const grouped = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 })
    
    const map = new Map<number, Event[]>()
    weekDays.forEach((wd) => {
      map.set(wd.dayOfWeek, [])
    })
    
    // Filtrar apenas eventos da semana atual
    events
      .filter((event) => {
        const start = new Date(event.startDateTime)
        return isWithinInterval(start, { start: weekStart, end: weekEnd })
      })
      .forEach((event) => {
        const start = new Date(event.startDateTime)
        const eventDay = getDay(start)
        if (map.has(eventDay)) {
          map.get(eventDay)!.push(event)
        }
      })
    
    map.forEach((dayEvents) => {
      dayEvents.sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime()
      )
    })
    return map
  }, [events, weekDays])

  if (events.length === 0) {
    return (
      <div className="flex-1 bg-[#F5A623] flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-gray-900 text-2xl font-bold">
            Nenhum evento programado
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-row overflow-hidden">
      {/* Header column */}
      <div className="flex-shrink-0 w-[200px] bg-[#F5A623] flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-6 left-6 right-6 h-1 bg-gray-900 rounded-full" />

        <div className="flex flex-col items-center text-center gap-2 mt-4">
          <h2 className="text-gray-900 font-black text-xl leading-tight">
            Calendario de eventos
          </h2>
          <h1 className="text-gray-900 font-black text-3xl leading-none">
            Agora Tech Park
          </h1>
          <p className="text-[#c47d00] font-bold text-xs mt-3 uppercase tracking-wide">
            Acompanhe a programacao
          </p>
          <p className="text-gray-900 font-bold text-sm">
            De {weekDays[1]?.dateLabel} a {weekDays[5]?.dateLabel}
          </p>
        </div>
      </div>

      {/* Day columns */}
      {weekDays.map((wd) => {
        // Skip weekend
        if (wd.dayOfWeek === 0 || wd.dayOfWeek === 6) return null

        const dayEvents = grouped.get(wd.dayOfWeek) || []
        const isToday = wd.dayOfWeek === currentDayOfWeek

        return (
          <div
            key={wd.dayOfWeek}
            className={cn(
              "flex-1 min-w-0 flex flex-col border-r border-[#e6a020]/30 last:border-r-0",
              isToday && "ring-2 ring-inset ring-[#c47d00]"
            )}
          >
            {/* Day header */}
            <div
              className={cn(
                "flex items-center justify-center py-4 px-2 border-b-2 border-[#d4911a]",
                isToday ? "bg-[#e08e0e]" : "bg-[#F5A623]"
              )}
            >
              <h3 className="text-gray-900 font-black text-3xl uppercase tracking-tight">
                {wd.label}
              </h3>
            </div>

            {/* Events list */}
            <div className="flex-1 bg-white flex flex-col overflow-y-auto">
              {dayEvents.length > 0 ? (
                dayEvents.map((e) => (
                  <div
                    key={e.id}
                    className="border-b border-[#E6A020]/30 px-4 py-4 hover:bg-[#FBC57D]/10 transition-colors border-l-4 border-l-[#F5A623]"
                  >
                    <p className="font-bold text-gray-900 text-base leading-snug mb-2">
                      {e.name}
                    </p>
                    <div className="flex items-center gap-2 text-gray-700 text-sm mb-2">
                      <Clock className="w-4 h-4 text-[#F5A623] flex-shrink-0" />
                      <span className="font-medium">
                        {format(new Date(e.startDateTime), "HH:mm")} até{" "}
                        {format(new Date(e.endDateTime), "HH:mm")}
                      </span>
                    </div>
                    {e.location && (
                      <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                        <MapPin className="w-4 h-4 text-[#F5A623] flex-shrink-0" />
                        <span>{e.location}</span>
                      </div>
                    )}
                    {e.tags && e.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {e.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-[#F5A623]/20 text-[#c47d00] rounded text-xs font-medium border border-[#F5A623]/40"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-300 text-xs">-</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
