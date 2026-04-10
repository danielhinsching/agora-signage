import { useClock } from '@/hooks/use-clock.ts';
import { Maximize, Minimize } from 'lucide-react';
import { useState } from 'react';
import type { TVOrientation } from '@/types';

type GridOrientation = Extract<TVOrientation, 'horizontal' | 'vertical' | 'mobile'>;

interface TvHeaderProps {
  orientation: GridOrientation;
}

export function TvHeader({ orientation }: TvHeaderProps) {
  const { time } = useClock();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b-4 border-[#F5A623] flex-shrink-0">
      <img
        src="/agora-tech.svg"
        alt="Ágora Tech Park"
        className="h-8 w-auto"
      />
      {orientation !== 'mobile' && (
        <div className="flex items-center gap-2 text-center">
          <span className="font-bold text-gray-900 text-lg">Bem-vindo ao Ágora Tech Park</span>
        </div>
      )}
      <div className="flex items-center gap-6">
        {orientation !== 'mobile' && (
          <div className="text-3xl font-light tabular-nums text-gray-900">{time}</div>
        )}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
        >
          {isFullscreen ? (
            <Minimize className="w-5 h-5" />
          ) : (
            <Maximize className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  );
}
