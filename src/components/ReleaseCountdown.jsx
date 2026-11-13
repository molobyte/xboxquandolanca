import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, CalendarClock } from 'lucide-react';

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const pad = (n) => String(n).padStart(2, '0');

/** Card do canto superior direito: contador limpo de 3 colunas ou "já disponível". */
export default function ReleaseCountdown({ date, tba }) {
  const now = useNow();

  if (tba || !date) {
    return (
      <Card>
        <Label icon={CalendarClock}>Lançamento</Label>
        <p className="mt-2 font-title text-3xl font-light">A anunciar</p>
        <p className="mt-1 font-sans text-sm text-white/50">A loja ainda não divulgou a data.</p>
      </Card>
    );
  }

  const diff = date.getTime() - now;

  if (diff <= 0) {
    return (
      <Card released>
        <Label icon={CheckCircle2} className="text-xbox-neon">
          Já disponível
        </Label>
        <p className="mt-2 font-action text-[11px] uppercase tracking-wider text-white/50">Disponível desde</p>
        <p className="mt-1 font-title text-2xl font-light capitalize-first">{dateFmt.format(date)}</p>
      </Card>
    );
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hoursOfDay = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Mais de 24h: Dias / Horas / Minutos. Menos de 24h: Horas / Minutos / Segundos.
  const columns =
    totalSeconds >= 86400
      ? [
          [days, 'Dias'],
          [hoursOfDay, 'Horas'],
          [minutes, 'Min'],
        ]
      : [
          [hoursOfDay, 'Horas'],
          [minutes, 'Min'],
          [seconds, 'Seg'],
        ];

  return (
    <Card>
      <Label icon={Clock}>Disponível em</Label>
      <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
        {columns.map(([value, unit]) => (
          <div
            key={unit}
            className="liquid-glass-subtle flex flex-col items-center justify-center rounded-xl px-2 py-2.5 transition"
          >
            <span className="font-display text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
              {pad(value)}
            </span>
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-white/45">
              {unit}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3.5 flex items-baseline justify-between gap-2 border-t border-white/[0.06] pt-3 text-xs">
        <span className="text-[11px] text-white/45">Lançamento</span>
        <span className="font-medium text-white/90">{dateTimeFmt.format(date)}</span>
      </div>
    </Card>
  );
}

function Card({ children, released = false }) {
  return (
    <div
      className={`liquid-glass w-full rounded-2xl p-4 sm:p-5 ${
        released ? 'border-xbox-neon/25 bg-xbox-green/[0.12]' : ''
      }`}
    >
      {children}
    </div>
  );
}

function Label({ icon: Icon, children, className = 'text-white/60' }) {
  return (
    <p className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${className}`}>
      <Icon className="h-3.5 w-3.5 text-xbox-neon" />
      {children}
    </p>
  );
}
