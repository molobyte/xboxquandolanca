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
          [days, 'D'],
          [hoursOfDay, 'H'],
          [minutes, 'M'],
        ]
      : [
          [hoursOfDay, 'H'],
          [minutes, 'M'],
          [seconds, 'S'],
        ];

  return (
    <Card>
      <Label icon={Clock}>Disponível em</Label>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {columns.map(([value, unit]) => (
          <div
            key={unit}
            className="flex flex-col items-center justify-center rounded-[2px] border border-white/10 bg-[#121821] px-2 py-3 shadow-inner transition"
          >
            <span className="font-display text-3xl font-bold tabular-nums tracking-tight text-white sm:text-4xl">
              {pad(value)}
            </span>
            <span className="mt-1 font-action text-xs font-bold tracking-wider text-xbox-neon">
              {unit}
            </span>
          </div>
        ))}
      </div>
      <div className="my-4 h-px bg-white/10" />
      <p className="font-action text-[11px] uppercase tracking-wider text-white/45">Data de lançamento</p>
      <p className="mt-0.5 font-sans text-sm font-medium text-white/95">{dateTimeFmt.format(date)}</p>
    </Card>
  );
}

function Card({ children, released = false }) {
  return (
    <div
      className={`w-full rounded-[2px] border border-t-2 p-5 shadow-2xl backdrop-blur-xl ${
        released
          ? 'border-xbox-neon/35 border-t-xbox-neon bg-xbox-green/15'
          : 'border-white/12 border-t-xbox-green bg-[#0c1118]/90'
      }`}
    >
      {children}
    </div>
  );
}

function Label({ icon: Icon, children, className = 'text-white/60' }) {
  return (
    <p className={`flex items-center gap-2 font-action text-xs font-bold uppercase tracking-[0.2em] ${className}`}>
      <Icon className="h-4 w-4" />
      {children}
    </p>
  );
}
