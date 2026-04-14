import { useMemo, useState, useEffect, useRef, useCallback } from "react"
import { Event } from "@/types"
import { cn } from "@/lib/utils"
import { format, addDays, addWeeks, isSameDay, startOfWeek, startOfDay } from "date-fns"
import { ChevronLeft, ChevronRight, Clock, MapPin, Download, QrCode } from "lucide-react"
import { QRCodeCanvas } from "qrcode.react"

interface AgendaGridProps {
  events: Event[]
  orientation: "horizontal" | "vertical" | "mobile"
}

// ─── Mobile-optimized Event Card ────────────────────────────────────
function MobileEventItem({ event }: { event: Event }) {
  const upperName = event.name.toLocaleUpperCase("pt-BR")
  const upperLocation = event.location?.toLocaleUpperCase("pt-BR")

  return (
    <div className="border-b border-[#E6A020]/20 px-3 py-2.5 flex flex-col justify-center overflow-hidden">
      <p className="font-bold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">
        {upperName}
      </p>
      <div className="flex items-center gap-2 text-gray-600 text-xs flex-wrap">
        <Clock className="w-3.5 h-3.5 text-[#F5A623] flex-shrink-0" />
        <span className="font-semibold">
          {format(new Date(event.startDateTime), "HH:mm")} – {format(new Date(event.endDateTime), "HH:mm")}
        </span>
        {event.location && (
          <>
            <span className="text-[#d4911a]">·</span>
            <MapPin className="w-3.5 h-3.5 text-[#F5A623] flex-shrink-0" />
            <span className="truncate min-w-0 max-w-[120px]">{upperLocation}</span>
          </>
        )}
      </div>
    </div>
  )
}

const CAROUSEL_INTERVAL = 5000
const WEEKDAY_SHORT_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MOBILE_WEEK_STARTS_ON = 1

type DayInfo = {
  date: Date
  label: string
  dateLabel: string
  isToday: boolean
}

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
  mobile = false,
}: {
  events: Event[]
  perPage: number
  containerClassName?: string
  mobile?: boolean
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
  const ItemComponent = mobile ? MobileEventItem : EventItem

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
          <ItemComponent key={e.id} event={e} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
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

// ─── Build consecutive days starting from a given date ──────────────
function useDaysWindow(startDate: Date, numDays: number) {
  return useMemo(() => {
    const today = new Date()
    return Array.from({ length: numDays }, (_, i) => {
      const day = addDays(startDate, i)
      const dayOfWeek = day.getDay()
      return {
        date: day,
        label: WEEKDAY_SHORT_NAMES[dayOfWeek],
        dateLabel: format(day, "dd/MM"),
        isToday: isSameDay(day, today),
      }
    })
  }, [startDate, numDays])
}

// ─── Group events by date string (multi-day events appear on each day) ──
function useGroupedByDate(events: Event[], days: DayInfo[]) {
  return useMemo(() => {
    const map = new Map<string, Event[]>()
    days.forEach((d) => map.set(format(d.date, "yyyy-MM-dd"), []))

    events.forEach((event) => {
      const eventStart = new Date(event.startDateTime)
      const eventEnd = new Date(event.endDateTime)

      // Check each visible day — if the event spans that day, include it
      days.forEach((d) => {
        const dayKey = format(d.date, "yyyy-MM-dd")
        const dayStart = new Date(d.date)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(d.date)
        dayEnd.setHours(23, 59, 59, 999)

        // Event overlaps this day if it starts before day ends AND ends after day starts
        if (eventStart <= dayEnd && eventEnd >= dayStart) {
          map.get(dayKey)!.push(event)
        }
      })
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

// ─── Mobile Day Section (stacked card list) ─────────────────────────
function MobileDaySection({
  day,
  events,
}: {
  day: DayInfo
  events: Event[]
}) {
  const maxEventsPerPage = 3

  return (
    <section
      className={cn(
        "rounded-lg border border-[#e6a020]/25 overflow-hidden bg-white shadow-sm",
        day.isToday && "ring-2 ring-[#c47d00]/50"
      )}
    >
      <div className="px-3 py-2 bg-[#F5A623] border-b border-[#d4911a] flex items-center gap-2">
        <h3 className="font-black text-sm uppercase tracking-tight text-gray-900">
          {day.isToday ? "HOJE" : day.label}
        </h3>
        <span className="text-gray-800 font-bold text-xs">{day.dateLabel}</span>
      </div>

      {events.length > 0 ? (
        <div className="min-h-[100px]">
          <CarouselEvents
            events={events}
            perPage={maxEventsPerPage}
            containerClassName="bg-white"
            mobile
          />
        </div>
      ) : (
        <div className="py-4 bg-white flex items-center justify-center">
          <span className="text-gray-400 text-xs">Sem eventos</span>
        </div>
      )}
    </section>
  )
}

// ─── QR Code Download Button ────────────────────────────────────────
function QrDownloadButton() {
  const qrRef = useRef<HTMLDivElement>(null)
  const [showQr, setShowQr] = useState(false)
  const currentUrl = window.location.href

  const handleDownload = useCallback(() => {
    const canvas = qrRef.current?.querySelector("canvas")
    if (!canvas) return
    const link = document.createElement("a")
    link.download = "agenda-qrcode.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
  }, [])

  return (
    <>
      <button
        type="button"
        className="px-3 py-1.5 rounded-md bg-[#c47d00] text-white text-xs font-semibold flex items-center gap-1.5"
        onClick={() => setShowQr(true)}
      >
        <QrCode className="w-3.5 h-3.5" />
        QR Code
      </button>

      {showQr && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowQr(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 max-w-xs w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-black text-lg text-gray-900">Agenda Ágora</h3>
            <p className="text-sm text-gray-500 text-center">
              Escaneie o QR Code para acessar a agenda no celular
            </p>
            <div ref={qrRef} className="p-3 bg-white rounded-xl border border-gray-200">
              <QRCodeCanvas value={currentUrl} size={200} level="H" />
            </div>
            <p className="text-[10px] text-gray-400 break-all text-center max-w-full">{currentUrl}</p>
            <div className="flex gap-2 w-full">
              <button
                type="button"
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#F5A623] text-gray-900 font-bold text-sm flex items-center justify-center gap-2"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
                Baixar PNG
              </button>
              <button
                type="button"
                className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm"
                onClick={() => setShowQr(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Main Grid ──────────────────────────────────────────────────────
export function AgendaGrid({
  events,
  orientation,
}: AgendaGridProps) {
  const [mobileWeekOffset, setMobileWeekOffset] = useState(0)

  useEffect(() => {
    if (orientation !== "mobile" && mobileWeekOffset !== 0) {
      setMobileWeekOffset(0)
    }
  }, [orientation, mobileWeekOffset])

  const mobileWeekStart = useMemo(
    () => startOfWeek(addWeeks(new Date(), mobileWeekOffset), { weekStartsOn: MOBILE_WEEK_STARTS_ON }),
    [mobileWeekOffset]
  )

  const windowStartDate = useMemo(
    () => (orientation === "mobile" ? mobileWeekStart : new Date()),
    [orientation, mobileWeekStart]
  )

  const dayCount = orientation === "mobile" ? 7 : 5
  const days = useDaysWindow(windowStartDate, dayCount)
  const grouped = useGroupedByDate(events, days)

  if (events.length === 0 && orientation !== "mobile") {
    return (
      <div className="flex-1 bg-[#F5A623] flex items-center justify-center p-8">
        <p className="text-gray-900 text-3xl font-bold">
          Nenhum evento programado
        </p>
      </div>
    )
  }

  // ─── Mobile orientation (fixed week Mon-Sun, with week navigation) ─
  if (orientation === "mobile") {
    const weekRangeLabel = `${days[0]?.dateLabel} a ${days[days.length - 1]?.dateLabel}`

    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[#fff8ef]">
        <div className="px-3 py-2 bg-[#F5A623] border-b border-[#d4911a]">
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              className="h-8 w-8 rounded-md bg-white/80 hover:bg-white text-gray-900 flex items-center justify-center transition-colors"
              onClick={() => setMobileWeekOffset((prev) => prev - 1)}
              aria-label="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center min-w-0 px-1">
              <h2 className="text-sm font-black text-gray-900">Agenda Semanal</h2>
              <p className="text-xs font-semibold text-gray-800">{weekRangeLabel}</p>
            </div>

            <button
              type="button"
              className="h-8 w-8 rounded-md bg-white/80 hover:bg-white text-gray-900 flex items-center justify-center transition-colors"
              onClick={() => setMobileWeekOffset((prev) => prev + 1)}
              aria-label="Próxima semana"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-1.5 flex justify-center gap-2">
            <button
              type="button"
              className="px-2.5 py-1 rounded-md bg-[#c47d00] text-white text-[10px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => setMobileWeekOffset(0)}
              disabled={mobileWeekOffset === 0}
            >
              Semana Atual
            </button>
            <QrDownloadButton />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {days.map((day) => (
            <MobileDaySection
              key={format(day.date, "yyyy-MM-dd")}
              day={day}
              events={grouped.get(format(day.date, "yyyy-MM-dd")) || []}
            />
          ))}
        </div>
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
