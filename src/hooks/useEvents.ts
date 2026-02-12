import { useCallback, useMemo, useEffect, useState } from 'react';
import { Event } from '@/types';
import {
  addEvent as dbAddEvent,
  updateEvent as dbUpdateEvent,
  deleteEvent as dbDeleteEvent,
  subscribeEvents,
} from '@/lib/db';
import { toast } from 'sonner';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    const unsubscribe = subscribeEvents((updatedEvents) => {
      setEvents(updatedEvents);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addEvent = useCallback(async (event: Omit<Event, 'id' | 'createdAt'>) => {
    try {
      const id = await dbAddEvent(event);
      toast.success('Evento criado com sucesso!');
      return { ...event, id, createdAt: new Date().toISOString() };
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Erro ao criar evento');
      throw error;
    }
  }, []);

  const updateEvent = useCallback(async (id: string, updates: Partial<Event>) => {
    try {
      await dbUpdateEvent(id, updates);
      toast.success('Evento atualizado!');
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Erro ao atualizar evento');
      throw error;
    }
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      await dbDeleteEvent(id);
      toast.success('Evento removido!');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Erro ao remover evento');
      throw error;
    }
  }, []);

  const getEventsForTV = useCallback((tvId: string) => {
    const now = new Date();
    return events
      .filter((event) => {
        const isAssignedToTV = event.tvIds.includes(tvId);
        const endDate = new Date(event.endDateTime);
        const isNotPast = endDate >= now;
        return isAssignedToTV && isNotPast;
      })
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  }, [events]);

  const activeEvents = useMemo(() => {
    const now = new Date();
    return events.filter((event) => {
      const start = new Date(event.startDateTime);
      const end = new Date(event.endDateTime);
      return start <= now && end >= now;
    });
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((event) => new Date(event.startDateTime) > now)
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  }, [events]);

  return {
    events,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForTV,
    activeEvents,
    upcomingEvents,
  };
}
