import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, CalendarClock } from 'lucide-react';
import CountryFlag from './CountryFlag.jsx';
import NewZealandTrickCard from './NewZealandTrickCard.jsx';

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

/** Card do canto superior direito: contador limpo de 3 colunas, data de lançamento e Truque NZ unificados. */
export default function ReleaseCountdown({ gameId, date, tba }) {
  const now = useNow();

  if (tba || !date) {
    return (
      <Card>
        <Label icon={CalendarClock}>Lançamento</Label>
        <p className="mt-1.5 font-title text-2xl font-light sm:mt-2 sm:text-3xl">A anunciar</p>
        <p className="mt-1 font-sans text-xs text-white/50 sm:text-sm">A loja ainda não divulgou a data.</p>
      </Card>
    );
  }

  const diff = date.getTime() - now;

  if (diff <= 0) {
    return (
      <Card released>
        <div className="flex items-center justify-between gap-3 sm:block">
          <Label icon={CheckCircle2} className="text-xbox-neon">
            Já disponível
          </Label>
          <div className="min-w-0 text-right sm:mt-2 sm:text-left">
            <p className="font-action text-[9px] uppercase tracking-[0.12em] text-white/45 sm:text-[11px] sm:tracking-wider">
              Disponível desde
            </p>
            <p className="mt-0.5 truncate whitespace-nowrap font-title text-xs font-medium capitalize-first text-white sm:mt-1 sm:text-2xl sm:font-light">
              {dateFmt.format(date)}
            </p>
          </div>
        </div>
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
      <div className="mt-2.5 grid grid-cols-3 gap-2 text-center sm:mt-3.5">
        {columns.map(([value, unit]) => (
          <div
            key={unit}
            className="liquid-glass-subtle flex flex-col items-center justify-center rounded-xl px-2 py-2 transition sm:py-2.5"
          >
            <span className="font-display text-xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
              {pad(value)}
            </span>
            <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-white/45 sm:text-[10px]">
              {unit}
            </span>
          </div>
        ))}
      </div>
      {gameId ? (
        <NewZealandTrickCard gameId={gameId} brazilDate={date} tba={tba} embedded />
      ) : (
        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-2.5 text-[11px] sm:mt-3.5 sm:pt-3 sm:text-xs">
          <span className="flex items-center gap-1.5 text-[10px] text-white/50 sm:text-[11px]">
            <CountryFlag code="BR" className="h-2.5 w-3.5 shrink-0" />
            <span>Brasil</span>
          </span>
          <span className="text-right font-medium text-white/95">{dateTimeFmt.format(date)}</span>
        </div>
      )}
    </Card>
  );
}

function Card({ children, released = false }) {
  return (
    <div
      className={`liquid-glass w-full rounded-2xl p-3.5 sm:p-5 ${
        released ? 'border-xbox-neon/25 bg-xbox-green/[0.12]' : ''
      }`}
    >
      {children}
    </div>
  );
}

function Label({ icon: Icon, children, className = 'text-white/60' }) {
  return (
    <p className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.12em] sm:gap-2 sm:tracking-[0.14em] ${className}`}>
      <Icon className="h-3.5 w-3.5 shrink-0 text-xbox-neon" />
      {children}
    </p>
  );
}
