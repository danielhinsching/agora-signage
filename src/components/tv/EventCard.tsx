import { Event } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EventCardProps {
  event: Event;
  compact?: boolean;
  isToday?: boolean;
}

export function EventCard({ event, compact, isToday }: EventCardProps) {
  const start = new Date(event.startDateTime);
  const end = new Date(event.endDateTime);
  const now = new Date();
  const isActive = now >= start && now <= end;

  return (
    <div className={cn(
      "rounded-xl border shadow-sm transition-all duration-300",
      "bg-card/50 backdrop-blur-md border-border/40",
      isToday && "border-primary/30 shadow-primary/10 shadow-md",
      isActive && "ring-1 ring-primary/50 bg-primary/5",
      compact ? "p-3" : "p-4"
    )}>
      <div className={cn(
        "font-bold text-card-foreground leading-tight",
        compact ? "text-lg" : "text-xl"
      )}>
        {event.name}
        {isActive && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Ao vivo
          </span>
        )}
      </div>
      <div className={cn("text-muted-foreground mt-2 flex items-center gap-1.5", compact ? "text-sm" : "text-base")}>
        📍 {event.location}
      </div>
      <div className={cn("text-muted-foreground flex items-center gap-1.5 mt-1", compact ? "text-sm" : "text-base")}>
        🕐 {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
      </div>
    </div>
  );
}
