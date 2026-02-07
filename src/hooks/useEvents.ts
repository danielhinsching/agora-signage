import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Event, STORAGE_KEYS } from '@/types';

export function useEvents() {
  const [events, setEvents] = useLocalStorage<Event[]>(STORAGE_KEYS.EVENTS, []);

  const addEvent = useCallback((event: Omit<Event, 'id' | 'createdAt'>) => {
    const newEvent: Event = {
      ...event,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setEvents((prev) => [...prev, newEvent]);
    return newEvent;
  }, [setEvents]);

  const updateEvent = useCallback((id: string, updates: Partial<Event>) => {
    setEvents((prev) => prev.map((event) => 
      event.id === id ? { ...event, ...updates } : event
    ));
  }, [setEvents]);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  }, [setEvents]);

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
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForTV,
    activeEvents,
    upcomingEvents,
  };
}
