import { useMemo, useState, useEffect, useRef } from "react"
import { Event } from "@/types"
import { cn } from "@/lib/utils"
import { format, startOfWeek, endOfWeek, addDays, getDay, isWithinInterval } from "date-fns"
import { Clock, MapPin } from "lucide-react"
import { useClock } from "@/hooks/use-clock"

interface AgendaGridProps {
  events: Event[]
  orientation: "horizontal" | "vertical"
  currentDayOfWeek: number
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

const CAROUSEL_INTERVAL = 5000

// ─── Shared Event Card ───────────────────────────────────────────────
function EventItem({ event }: { event: Event }) {
  return (
    <div className="border-b border-[#E6A020]/30 px-4 py-3 border-l-4 border-l-[#F5A623] flex flex-col justify-center overflow-hidden">
      <p className="font-bold text-gray-900 text-sm leading-snug mb-1 truncate">
        {event.name}
      </p>
      <div className="flex items-center gap-1 text-gray-700 text-xs mb-1">
        <Clock className="w-3 h-3 text-[#F5A623] flex-shrink-0" />
        <span className="font-medium">
          {format(new Date(event.startDateTime), "HH:mm")} até{" "}
          {format(new Date(event.endDateTime), "HH:mm")}
        </span>
      </div>
      {event.location && (
        <div className="flex items-center gap-1 text-gray-600 text-xs mb-1">
          <MapPin className="w-3 h-3 text-[#F5A623] flex-shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>
      )}
      {event.tags && event.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {event.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 bg-[#F5A623]/20 text-[#c47d00] rounded text-xs font-medium border border-[#F5A623]/40"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Carousel wrapper for a list of events ───────────────────────────
function CarouselEvents({
  events,
  containerClassName,
}: {
  events: Event[]
  containerClassName?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [perPage, setPerPage] = useState(4)
  const [page, setPage] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const calc = () => {
      if (!ref.current) return
      const h = ref.current.clientHeight
      const cardH = 90
      setPerPage(Math.max(1, Math.floor(h / cardH)))
      setPage(0)
    }
    calc()
    const obs = new ResizeObserver(calc)
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const totalPages = Math.ceil(events.length / perPage)

  useEffect(() => {
    if (totalPages <= 1) return
    const interval = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setPage((p) => (p + 1) % totalPages)
        setAnimating(false)
      }, 400)
    }, CAROUSEL_INTERVAL)
    return () => clearInterval(interval)
  }, [totalPages])

  const visible = events.slice(page * perPage, page * perPage + perPage)

  return (
    <div ref={ref} className={cn("flex-1 overflow-hidden relative", containerClassName)}>
      <div
        className="flex flex-col h-full"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(6px)" : "translateY(0)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        {visible.map((e) => (
          <EventItem key={e.id} event={e} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
          {Array.from({ length: totalPages }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                i === page ? "bg-[#F5A623] w-3" : "bg-[#F5A623]/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Horizontal Day Column ───────────────────────────────────────────
function DayColumn({
  wd,
  dayEvents,
  isToday,
}: {
  wd: { dayOfWeek: number; label: string }
  dayEvents: Event[]
  isToday: boolean
}) {
  return (
    <div
      className={cn(
        "flex-1 min-w-0 flex flex-col border-r border-[#e6a020]/30 last:border-r-0",
        isToday && "ring-2 ring-inset ring-[#c47d00]"
      )}
    >
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
      {dayEvents.length > 0 ? (
        <CarouselEvents events={dayEvents} containerClassName="bg-white" />
      ) : (
        <div className="flex-1 bg-white" />
      )}
    </div>
  )
}

// ─── Vertical Day Section ────────────────────────────────────────────
function VerticalDaySection({
  label,
  events,
  isToday,
}: {
  label: string
  events: Event[]
  isToday: boolean
}) {
  return (
    <div className={cn("flex flex-col min-h-0", isToday ? "flex-[2]" : "flex-1")}>
      <div
        className={cn(
          "px-4 py-2 flex items-center",
          isToday
            ? "bg-[#F5A623] border-b-2 border-[#d4911a]"
            : "bg-gray-200 border-b border-gray-300"
        )}
      >
        <h3
          className={cn(
            "font-black text-lg uppercase tracking-tight",
            isToday ? "text-gray-900" : "text-gray-700"
          )}
        >
          {isToday ? "HOJE" : label}
        </h3>
      </div>
      {events.length > 0 ? (
        <CarouselEvents events={events} containerClassName="bg-white" />
      ) : (
        <div className="flex-1 bg-white flex items-center justify-center">
          <span className="text-gray-400 text-xs">Sem eventos</span>
        </div>
      )}
    </div>
  )
}

// ─── Main Grid ───────────────────────────────────────────────────────
export function AgendaGrid({
  events,
  orientation,
  currentDayOfWeek,
}: AgendaGridProps) {
  const weekDays = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 0 })
    const allDays = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekStart, i)
      return {
        date: day,
        dayOfWeek: getDay(day),
        label: WEEKDAYS_PT[getDay(day)].label,
        dateLabel: format(day, "dd/MM"),
      }
    })
    const todayIndex = allDays.findIndex((d) => d.dayOfWeek === currentDayOfWeek)
    return [...allDays.slice(todayIndex), ...allDays.slice(0, todayIndex)]
  }, [currentDayOfWeek])

  const grouped = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 })

    const map = new Map<number, Event[]>()
    weekDays.forEach((wd) => map.set(wd.dayOfWeek, []))

    events
      .filter((event) => {
        const start = new Date(event.startDateTime)
        return isWithinInterval(start, { start: weekStart, end: weekEnd })
      })
      .forEach((event) => {
        const start = new Date(event.startDateTime)
        const eventDay = getDay(start)
        if (map.has(eventDay)) map.get(eventDay)!.push(event)
      })

    map.forEach((dayEvents) => {
      dayEvents.sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
      )
    })
    return map
  }, [events, weekDays])

  const workDays = weekDays.filter(
    (wd) => wd.dayOfWeek !== 0 && wd.dayOfWeek !== 6
  )

  if (events.length === 0) {
    return (
      <div className="flex-1 bg-[#F5A623] flex items-center justify-center p-8">
        <p className="text-gray-900 text-2xl font-bold">
          Nenhum evento programado
        </p>
      </div>
    )
  }

  // ─── Vertical orientation ──────────────────────────────────────────
  if (orientation === "vertical") {
    // Today first, then next work days
    const todayWd = workDays.find((wd) => wd.dayOfWeek === currentDayOfWeek)
    const otherDays = workDays.filter((wd) => wd.dayOfWeek !== currentDayOfWeek).slice(0, 5)

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {todayWd && (
          <VerticalDaySection
            label="HOJE"
            events={grouped.get(todayWd.dayOfWeek) || []}
            isToday={true}
          />
        )}
        {otherDays.map((wd) => (
          <VerticalDaySection
            key={wd.dayOfWeek}
            label={`${wd.label} ${wd.dateLabel}`}
            events={grouped.get(wd.dayOfWeek) || []}
            isToday={false}
          />
        ))}
      </div>
    )
  }

  // ─── Horizontal orientation (original) ─────────────────────────────
  return (
    <div className="flex-1 flex flex-row overflow-hidden">
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
            De {weekDays.find((d) => d.dayOfWeek === 1)?.dateLabel} a{" "}
            {weekDays.find((d) => d.dayOfWeek === 5)?.dateLabel}
          </p>
        </div>
      </div>

      {workDays.map((wd) => (
        <DayColumn
          key={wd.dayOfWeek}
          wd={wd}
          dayEvents={grouped.get(wd.dayOfWeek) || []}
          isToday={wd.dayOfWeek === currentDayOfWeek}
        />
      ))}
    </div>
  )
}
