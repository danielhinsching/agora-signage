import { useEffect, useRef, useState, useCallback } from 'react';
import { TV } from '@/types';
import { listTvImages, TvImage } from '@/lib/tv-images';
import { supabase } from '@/integrations/supabase/client';
import { Maximize2, Minimize2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const SLIDE_DURATION_MS = 10_000;
const CONTROLS_HIDE_MS = 3_000;

interface TvImagePlayerProps {
  tv: TV;
}

export default function TvImagePlayer({ tv }: TvImagePlayerProps) {
  const [images, setImages] = useState<TvImage[]>([]);
  const [index, setIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideTimer = useRef<number | null>(null);

  const loadImages = useCallback(async () => {
    try {
      const imgs = await listTvImages(tv.id);
      setImages(imgs);
      setIndex(0);
    } catch (err) {
      console.error('Error loading TV images:', err);
      setImages([]);
    }
  }, [tv.id]);

  useEffect(() => {
    loadImages();
    // Subscribe to storage changes via Realtime is not available for storage —
    // poll every 60s instead so the TV picks up admin changes.
    const interval = window.setInterval(loadImages, 60_000);
    return () => window.clearInterval(interval);
  }, [loadImages]);

  // Force light theme like TVPlayer
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    const hadLight = root.classList.contains('light');
    const prevTheme = hadDark ? 'dark' : hadLight ? 'light' : null;
    root.classList.remove('dark');
    root.classList.add('light');
    return () => {
      root.classList.remove('light');
      if (prevTheme === 'dark') root.classList.add('dark');
      else if (prevTheme === 'light') root.classList.add('light');
    };
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (images.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, SLIDE_DURATION_MS);
    return () => window.clearInterval(id);
  }, [images.length]);

  // Mouse activity controls visibility
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShowControls(false), CONTROLS_HIDE_MS);
  }, []);

  useEffect(() => {
    resetHideTimer();
    const handler = () => resetHideTimer();
    window.addEventListener('mousemove', handler);
    return () => {
      window.removeEventListener('mousemove', handler);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [resetHideTimer]);

  // Track fullscreen state
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const isRotated = tv.orientation === 'vertical-left' || tv.orientation === 'vertical-right';
  const rotateStyle: React.CSSProperties = isRotated
    ? {
      transform: tv.orientation === 'vertical-left' ? 'rotate(-90deg)' : 'rotate(90deg)',
      width: '100vh',
      height: '100vw',
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginTop: '-50vw',
      marginLeft: '-50vh',
    }
    : { width: '100vw', height: '100vh' };

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-background select-none relative"
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      <div style={rotateStyle} className="overflow-hidden relative bg-black">
        {images.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-background">
            <img
              src="/icon.png"
              alt="Ágora"
              className="w-24 h-24 rounded-2xl opacity-60"
            />
            <p className="text-muted-foreground text-xl">Nenhuma imagem cadastrada</p>
          </div>
        ) : (
          <div
            className="flex h-full transition-transform duration-700 ease-in-out"
            style={{
              width: `${images.length * 100}%`,
              transform: `translateX(-${(100 / images.length) * index}%)`,
            }}
          >
            {images.map((img) => (
              <div
                key={img.path}
                className="h-full"
                style={{ width: `${100 / images.length}%` }}
              >
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="absolute bottom-6 right-6 z-40 p-2 rounded-xl border border-orange-400 bg-black backdrop-blur-md shadow-[0_0_24px_rgba(251,146,60,0.25)]">
          <QRCodeSVG value="https://agora-lineup.vercel.app/empresas" size={120} fgColor="#ffffff" bgColor="transparent" />
        </div>
      )}

      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
        className={`fixed top-4 right-4 z-50 p-2.5 rounded-lg bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
      >
        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
      </button>
    </div>
  );
}
