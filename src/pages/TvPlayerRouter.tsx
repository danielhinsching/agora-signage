import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TV } from '@/types';
import { getTVBySlug } from '@/lib/db';
import TvPlayer from './TVPlayer';
import TvImagePlayer from './TvImagePlayer';

export default function TvPlayerRouter() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [tv, setTv] = useState<TV | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getTVBySlug(slug)
      .then((found) => {
        if (!active) return;
        setTv(found);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-background flex items-center justify-center select-none">
        <div className="text-center space-y-4">
          <img src="/icon.png" alt="Ágora" className="w-20 h-20 mx-auto rounded-2xl opacity-60 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (tv?.type === 'images') {
    return <TvImagePlayer tv={tv} />;
  }

  // Default: events player (also handles tv === null with its own not-found UI)
  return <TvPlayer />;
}
