import { useClock } from '@/hooks/use-clock.ts';
import { Maximize, Minimize, Wifi } from 'lucide-react';
import { useState } from 'react';

interface TvHeaderProps {
  orientation: 'horizontal' | 'vertical';
}

export function TvHeader({ orientation }: TvHeaderProps) {
  const { time, date } = useClock();
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
        className="h-10 w-auto"
      />
      <div className="flex items-center gap-2 text-center">
        <span className="font-bold text-gray-900 text-lg">Bem-vindo ao Ágora Tech Park 🚀</span>
        <span className="text-gray-400">|</span>
        <Wifi className="w-4 h-4 text-[#F5A623]" />
        <span className="text-gray-600 text-sm">Wi-Fi:</span>
        <span className="font-bold text-gray-900 text-sm">Agora-Guest</span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-600 text-sm">Senha:</span>
        <span className="font-bold text-gray-900 text-sm">inovacao2025</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-base capitalize text-gray-500">{date}</div>
        <div className="text-3xl font-light tabular-nums text-gray-900">{time}</div>
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
