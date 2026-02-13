import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: Date) => void;
  label?: string;
  disabled?: (date: Date) => boolean;
  showPast?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  label = 'Data e Hora',
  disabled,
  showPast = false,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [tempTime, setTempTime] = useState<string>(
    value ? format(value, 'HH:mm') : '09:00'
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const [hours, minutes] = tempTime.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    onChange(newDate);
  };

  const handleTimeChange = (newTime: string) => {
    setTempTime(newTime);
    if (value) {
      const [hours, minutes] = newTime.split(':').map(Number);
      const newDate = new Date(value);
      newDate.setHours(hours, minutes, 0, 0);
      onChange(newDate);
    }
  };

  const disabledFn = (date: Date) => {
    if (!showPast && date < new Date(new Date().setHours(0, 0, 0, 0))) {
      return true;
    }
    return disabled?.(date) || false;
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value
              ? format(value, 'dd/MM/yyyy HH:mm')
              : 'Selecione data e hora'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 glass-card-strong border-border" align="start">
          <div className="p-4 space-y-4">
            {/* Calendar */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Data
              </label>
              <Calendar
                mode="single"
                selected={value}
                onSelect={handleDateSelect}
                disabled={disabledFn}
                className="rounded-md border border-border"
              />
            </div>

            {/* Time Picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horário
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* Hours */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Hora</label>
                  <select
                    value={tempTime.split(':')[0]}
                    onChange={(e) => {
                      const newTime = `${e.target.value}:${tempTime.split(':')[1]}`;
                      handleTimeChange(newTime);
                    }}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm font-medium"
                  >
                    {Array.from({ length: 24 }, (_, i) =>
                      String(i).padStart(2, '0')
                    ).map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}h
                      </option>
                    ))}
                  </select>
                </div>

                {/* Minutes */}
                <div className="space-y-1 col-span-2">
                  <label className="text-xs text-muted-foreground">Minuto</label>
                  <select
                    value={tempTime.split(':')[1]}
                    onChange={(e) => {
                      const newTime = `${tempTime.split(':')[0]}:${e.target.value}`;
                      handleTimeChange(newTime);
                    }}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm font-medium"
                  >
                    {Array.from({ length: 60 }, (_, i) =>
                      String(i).padStart(2, '0')
                    )
                      .filter((_, i) => i % 5 === 0) // Apenas intervalos de 5 minutos
                      .map((minute) => (
                        <option key={minute} value={minute}>
                          {minute}min
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Current selection display */}
            {value && (
              <div className="pt-2 border-t border-border text-xs text-muted-foreground text-center">
                ✓ Selecionado: {format(value, "EEEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            )}

            {/* Close button */}
            <Button
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Confirmar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
