import { useClock } from '@/hooks/use-clock.ts';

interface TvHeaderProps {
  orientation: 'horizontal' | 'vertical';
}

export function TvHeader({ orientation }: TvHeaderProps) {
  const { time, date } = useClock();

  if (orientation === 'vertical') {
    return (
      <header className="flex items-center justify-between px-6 py-3 bg-card/60 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3">
          <img src="/icon.png" alt="Ágora" className="w-8 h-8 rounded-lg object-contain" />
          <span className="text-lg font-bold tracking-tight text-foreground">ÁGORA TECH PARK</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-light tabular-nums text-foreground">{time}</div>
          <div className="text-xs capitalize text-muted-foreground">{date}</div>
        </div>
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between px-8 py-3 bg-card/60 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center gap-3">
        <img src="/icon.png" alt="Ágora" className="w-8 h-8 rounded-lg object-contain" />
        <span className="text-lg font-bold tracking-tight text-foreground">ÁGORA TECH PARK</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-xs capitalize text-muted-foreground">{date}</div>
        <div className="text-2xl font-light tabular-nums text-foreground">{time}</div>
      </div>
    </header>
  );
}
