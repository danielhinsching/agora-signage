import { useMemo, useState, useEffect, useRef } from "react"
import { Event } from "@/types"
import { cn } from "@/lib/utils"
import { format, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock, MapPin } from "lucide-react"

interface AgendaGridProps {
  events: Event[]
  orientation: "horizontal" | "vertical"
  currentDayOfWeek: number
}

const CAROUSEL_INTERVAL = 5000

// ─── Shared Event Card (larger typography) ──────────────────────────
function EventItem({ event }: { event: Event }) {
  const upperName = event.name.toLocaleUpperCase("pt-BR")
  const upperLocation = event.location?.toLocaleUpperCase("pt-BR")

  return (
    <div className="border-b border-[#E6A020]/30 px-6 py-5 flex flex-col justify-center overflow-hidden">
      <p className="font-bold text-gray-900 text-2xl leading-tight mb-2 break-words">
        {upperName}
      </p>
      <div className="flex items-center gap-3 text-gray-700 text-lg mb-1 flex-wrap">
        <Clock className="w-5 h-5 text-[#F5A623] flex-shrink-0" />
        <span className="font-semibold">
          {format(new Date(event.startDateTime), "HH:mm")} até{" "}
          {format(new Date(event.endDateTime), "HH:mm")}
        </span>
        {event.location && (
          <>
            <span className="text-[#d4911a]">•</span>
            <MapPin className="w-5 h-5 text-[#F5A623] flex-shrink-0" />
            <span className="truncate min-w-0">{upperLocation}</span>
          </>
        )}
      </div>
      {/* tags permanecem no evento (Firestore) para análise/cobertura; não exibidas na TV */}
    </div>
  )
}

// ─── Carousel wrapper ───────────────────────────────────────────────
function CarouselEvents({
  events,
  perPage,
  containerClassName,
}: {
  events: Event[]
  perPage: number
  containerClassName?: string
}) {
  const [page, setPage] = useState(0)
  const [animating, setAnimating] = useState(false)

  const totalPages = Math.ceil(events.length / perPage)

  useEffect(() => {
    setPage(0)
  }, [events, perPage])

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
    <div className={cn("flex-1 overflow-hidden relative", containerClassName)}>
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

// ─── Build consecutive days starting from today ─────────────────────
function useConsecutiveDays(numDays: number) {
  return useMemo(() => {
    const today = new Date()
    return Array.from({ length: numDays }, (_, i) => {
      const day = addDays(today, i)
      const dayOfWeek = day.getDay()
      const shortNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
      return {
        date: day,
        dayOfWeek,
        label: shortNames[dayOfWeek],
        dateLabel: format(day, "dd/MM"),
        isToday: i === 0,
      }
    })
  }, [numDays])
}

// ─── Group events by date string ────────────────────────────────────
function useGroupedByDate(events: Event[], days: ReturnType<typeof useConsecutiveDays>) {
  return useMemo(() => {
    const map = new Map<string, Event[]>()
    days.forEach((d) => map.set(format(d.date, "yyyy-MM-dd"), []))

    events.forEach((event) => {
      const key = format(new Date(event.startDateTime), "yyyy-MM-dd")
      if (map.has(key)) map.get(key)!.push(event)
    })

    map.forEach((dayEvents) => {
      dayEvents.sort(
        (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
      )
    })
    return map
  }, [events, days])
}

// ─── Horizontal Day Column ──────────────────────────────────────────
function DayColumn({
  day,
  dayEvents,
}: {
  day: { label: string; dateLabel: string; isToday: boolean }
  dayEvents: Event[]
}) {
  const maxEventsPerPage = 2

  return (
    <div
      className={cn(
        "flex-1 min-w-0 flex flex-col border-r border-[#e6a020]/30 last:border-r-0",
        day.isToday && "ring-2 ring-inset ring-[#c47d00]"
      )}
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center py-4 px-2 border-b-2 border-[#d4911a]",
          "bg-[#F5A623]"
        )}
      >
        <h3 className="text-gray-900 font-black text-2xl uppercase tracking-tight">
          {day.isToday ? "HOJE" : day.label}
        </h3>
        <span className="text-gray-800 text-lg font-bold">{day.dateLabel}</span>
      </div>
      {dayEvents.length > 0 ? (
        <CarouselEvents
          events={dayEvents}
          perPage={maxEventsPerPage}
          containerClassName="bg-white"
        />
      ) : (
        <div className="flex-1 bg-white" />
      )}
    </div>
  )
}

// ─── Vertical Day Section ───────────────────────────────────────────
function VerticalDaySection({
  day,
  events,
}: {
  day: { label: string; dateLabel: string; isToday: boolean }
  events: Event[]
}) {
  const maxEventsPerPage = 2

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div
        className={cn(
          "px-5 py-3 flex items-center gap-3",
          "bg-[#F5A623] border-b-2 border-[#d4911a]"
        )}
      >
        <h3 className="font-black text-xl uppercase tracking-tight text-gray-900">
          {day.isToday ? "HOJE" : day.label}
        </h3>
        <span className="text-gray-800 font-bold text-lg">{day.dateLabel}</span>
      </div>
      {events.length > 0 ? (
        <CarouselEvents
          events={events}
          perPage={maxEventsPerPage}
          containerClassName="bg-white"
        />
      ) : (
        <div className="flex-1 bg-white flex items-center justify-center">
          <span className="text-gray-400 text-lg">Sem eventos</span>
        </div>
      )}
    </div>
  )
}

// ─── Main Grid ──────────────────────────────────────────────────────
export function AgendaGrid({
  events,
  orientation,
}: AgendaGridProps) {
  const days = useConsecutiveDays(5)
  const grouped = useGroupedByDate(events, days)

  if (events.length === 0) {
    return (
      <div className="flex-1 bg-[#F5A623] flex items-center justify-center p-8">
        <p className="text-gray-900 text-3xl font-bold">
          Nenhum evento programado
        </p>
      </div>
    )
  }

  // ─── Vertical orientation ─────────────────────────────────────────
  if (orientation === "vertical") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {days.map((day) => (
          <VerticalDaySection
            key={day.dateLabel}
            day={day}
            events={grouped.get(format(day.date, "yyyy-MM-dd")) || []}
          />
        ))}
      </div>
    )
  }

  // ─── Horizontal orientation ───────────────────────────────────────
  return (
    <div className="flex-1 flex flex-row overflow-hidden">
      <div className="flex-shrink-0 w-[220px] bg-[#F5A623] flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-6 left-6 right-6 h-1 bg-gray-900 rounded-full" />
        <div className="flex flex-col items-center text-center gap-3 mt-4">
          <h2 className="text-gray-900 font-black text-2xl leading-tight">
            Calendário de Eventos
          </h2>
          <h1 className="text-gray-900 font-black text-3xl leading-none">
            Ágora Tech Park
          </h1>
          <p className="text-[#c47d00] font-bold text-sm mt-3 uppercase tracking-wide">
            Acompanhe a programação
          </p>
          <p className="text-gray-900 font-bold text-base">
            {days[0]?.dateLabel} a {days[days.length - 1]?.dateLabel}
          </p>
        </div>
      </div>

      {days.map((day) => (
        <DayColumn
          key={day.dateLabel}
          day={day}
          dayEvents={grouped.get(format(day.date, "yyyy-MM-dd")) || []}
        />
      ))}
    </div>
  )
}
