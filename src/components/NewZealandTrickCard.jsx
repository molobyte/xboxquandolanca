import { useEffect, useState } from 'react';
import { Zap, Globe, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { getRegionalReleases } from '../lib/xbox.js';
import CountryFlag from './CountryFlag.jsx';

const compactBrPartsFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

function formatCompactBrDateTime(date) {
  if (!date) return '—';
  return compactBrPartsFmt.format(date).replace(', ', ' · ').replace(' ', ' · ');
}

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const pad = (n) => String(n).padStart(2, '0');

export default function NewZealandTrickCard({ gameId, brazilDate, tba, embedded = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHowTo, setShowHowTo] = useState(false);
  const now = useNow();

  // Não exibe se o jogo não tem data anunciada ou se já lançou no Brasil
  const isAlreadyReleasedInBrazil = brazilDate && brazilDate.getTime() <= now;

  useEffect(() => {
    if (tba || !brazilDate || !gameId || isAlreadyReleasedInBrazil) {
      setLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();
    setLoading(true);

    getRegionalReleases(gameId, brazilDate, controller.signal)
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {
        if (active) setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [gameId, brazilDate, tba, isAlreadyReleasedInBrazil]);

  if (tba || !brazilDate || isAlreadyReleasedInBrazil) {
    return null;
  }

  const wrapperCls = embedded
    ? 'mt-3 border-t border-white/[0.06] pt-3 transition-all sm:mt-3.5 sm:pt-3.5'
    : 'liquid-glass w-full rounded-2xl p-3.5 transition-all sm:p-5';

  // Lista base sempre começa com o Brasil e adiciona os demais países
  const remoteRegions = data?.regions?.filter((r) => r.code !== 'BR' && r.date) || [];
  const countries = [
    { code: 'BR', name: 'Brasil', date: brazilDate },
    ...remoteRegions,
  ];

  // Identifica se há um país com lançamento antecipado (> 1h antes do Brasil)
  let bestCode = null;
  let bestDate = null;
  let bestAheadHours = 0;

  for (const c of countries) {
    if (!c.date || c.code === 'BR') continue;
    const diffHours = Math.round((brazilDate.getTime() - c.date.getTime()) / (1000 * 60 * 60));
    if (diffHours > 1 && diffHours > bestAheadHours) {
      bestAheadHours = diffHours;
      bestCode = c.code;
      bestDate = c.date;
    }
  }

  const hasEarlyRegion = Boolean(bestCode && bestDate);
  const isAvailableNowInBest = hasEarlyRegion && bestDate.getTime() <= now;
  const diffBestMs = hasEarlyRegion ? Math.max(0, bestDate.getTime() - now) : 0;
  const totalSecondsBest = Math.floor(diffBestMs / 1000);
  const daysBest = Math.floor(totalSecondsBest / 86400);
  const hoursBest = Math.floor((totalSecondsBest % 86400) / 3600);
  const minutesBest = Math.floor((totalSecondsBest % 3600) / 60);

  return (
    <div className={wrapperCls}>
      {/* Cabeçalho Horários pelo mundo */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60 sm:text-[11px] sm:tracking-[0.14em]">
          <Globe className="h-3.5 w-3.5 shrink-0 text-xbox-neon" />
          <span>Horários pelo mundo</span>
        </span>
        <span className="whitespace-nowrap text-[10px] text-white/35">
          Brasília
        </span>
      </div>

      {/* Lista de países (completa quando há diferença regional; apenas Brasil quando é horário global simultâneo) */}
      <div className="mt-2.5 flex flex-col gap-1">
        {(hasEarlyRegion ? countries : [{ code: 'BR', name: 'Brasil', date: brazilDate }]).map(
          (item) => {
            const isBest = hasEarlyRegion && item.code === bestCode;
            return (
              <div
                key={item.code}
                className={
                  isBest
                    ? 'my-0.5 rounded-xl border border-xbox-neon/35 bg-xbox-green/[0.16] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'flex items-center justify-between gap-2 rounded-lg px-2 py-1'
                }
              >
                {isBest ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2 whitespace-nowrap text-xs font-semibold text-white">
                        <CountryFlag code={item.code} className="h-3 w-4 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span className="shrink-0 whitespace-nowrap font-mono text-[11px] font-semibold tabular-nums text-xbox-neon">
                        {formatCompactBrDateTime(item.date)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2 border-t border-xbox-neon/15 pt-1 text-[10px]">
                      <span className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-xbox-neon">
                        <Zap className="h-3 w-3 shrink-0" />
                        {isAvailableNowInBest ? 'Já disponível agora' : `Sai ${bestAheadHours}h mais cedo`}
                      </span>
                      {!isAvailableNowInBest && diffBestMs > 0 && (
                        <span className="whitespace-nowrap font-mono tabular-nums text-white/80">
                          em {daysBest > 0 ? `${pad(daysBest)}d ` : ''}{pad(hoursBest)}h {pad(minutesBest)}m
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <span
                      className={`flex min-w-0 items-center gap-2 whitespace-nowrap text-xs ${
                        item.code === 'BR' ? 'font-medium text-white/90' : 'text-white/65'
                      }`}
                    >
                      <CountryFlag code={item.code} className="h-3 w-4 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="shrink-0 whitespace-nowrap font-mono text-[11px] tabular-nums text-white/85">
                      {formatCompactBrDateTime(item.date)}
                    </span>
                  </>
                )}
              </div>
            );
          }
        )}

        {/* Skeleton discreto enquanto verifica se o lançamento é regional ou global */}
        {loading && (
          <div className="mt-1 h-9 w-full animate-pulse rounded-xl bg-white/[0.04]" />
        )}

        {/* Texto informativo quando o lançamento é global simultâneo */}
        {!loading && !hasEarlyRegion && (
          <p className="liquid-glass-subtle mt-1.5 rounded-xl px-3 py-2.5 text-[11px] leading-relaxed text-white/60">
            Este jogo terá lançamento global simultâneo. Não haverá diferença de horário entre regiões, portanto alterar a localidade do console não antecipará o acesso.
          </p>
        )}
      </div>

      {/* Menu retrátil de como fazer o truque de troca de região (apenas quando há região mais cedo) */}
      {hasEarlyRegion && (
        <div className="mt-2.5 border-t border-white/[0.06] pt-2.5">
          <button
            type="button"
            onClick={() => setShowHowTo((v) => !v)}
            className="flex w-full items-center justify-between gap-2 text-left text-[11px] font-medium text-white/60 transition hover:text-white sm:text-xs"
          >
            <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
              <HelpCircle className="h-3.5 w-3.5 shrink-0 text-xbox-neon" />
              <span className="truncate">Como fazer o truque de região?</span>
            </span>
            {showHowTo ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            )}
          </button>

          {showHowTo && (
            <div className="liquid-glass-subtle mt-2.5 space-y-2 rounded-xl p-3 text-xs text-white/75 animate-fade-in">
              <ol className="list-inside list-decimal space-y-1">
                <li>
                  No Xbox, vá em <strong className="font-medium text-white">Configurações &gt; Sistema &gt; Idioma e Localidade</strong>.
                </li>
                <li>
                  Altere a <strong className="font-medium text-white">Localidade</strong> para <strong className="font-medium text-white">Nova Zelândia</strong>.
                </li>
                <li>
                  Selecione <strong className="font-medium text-white">Reiniciar agora</strong> e aproveite!
                </li>
              </ol>
              <p className="border-t border-white/[0.06] pt-1.5 text-[11px] text-white/45">
                Não altera cobranças nem sua conta. Você pode voltar para o Brasil quando quiser.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
