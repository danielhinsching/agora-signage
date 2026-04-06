import { useEffect, useMemo, useState } from "react";

interface UsePersistentFormOptions<T, TStorage = T> {
  storageKey: string;
  initialValue: T;
  isOpen: boolean;
  serialize?: (value: T) => TStorage;
  deserialize?: (value: TStorage) => T;
}

export function usePersistentForm<T, TStorage = T>({
  storageKey,
  initialValue,
  isOpen,
  serialize,
  deserialize,
}: UsePersistentFormOptions<T, TStorage>) {
  const toStorage = useMemo(
    () => serialize ?? ((value: T) => value as unknown as TStorage),
    [serialize]
  );
  const fromStorage = useMemo(
    () => deserialize ?? ((value: TStorage) => value as unknown as T),
    [deserialize]
  );

  const [formData, setFormData] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  const serializedInitial = useMemo(() => JSON.stringify(toStorage(initialValue)), [initialValue, toStorage]);
  const serializedCurrent = useMemo(() => JSON.stringify(toStorage(formData)), [formData, toStorage]);
  const hasUnsavedChanges = serializedCurrent !== serializedInitial;

  useEffect(() => {
    if (!isOpen) return;

    try {
      const draft = localStorage.getItem(storageKey);
      if (draft) {
        const parsed = JSON.parse(draft) as TStorage;
        setFormData(fromStorage(parsed));
      } else {
        setFormData(initialValue);
      }
    } catch (error) {
      console.error(`Error restoring draft "${storageKey}":`, error);
      setFormData(initialValue);
    } finally {
      setHydrated(true);
    }
  }, [isOpen, storageKey, initialValue, fromStorage]);

  useEffect(() => {
    if (!isOpen || !hydrated) return;

    const timeoutId = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(toStorage(formData)));
      } catch (error) {
        console.error(`Error saving draft "${storageKey}":`, error);
      }
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, hydrated, storageKey, formData, toStorage]);

  const clearDraft = () => {
    localStorage.removeItem(storageKey);
  };

  const discardChanges = () => {
    clearDraft();
    setFormData(initialValue);
  };

  return {
    formData,
    setFormData,
    hasUnsavedChanges,
    clearDraft,
    discardChanges,
  };
}
