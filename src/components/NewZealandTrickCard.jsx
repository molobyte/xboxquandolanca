import { useEffect, useState } from 'react';
import { Zap, Globe, ChevronDown, ChevronUp, HelpCircle, CheckCircle2, Clock } from 'lucide-react';
import { getRegionalReleases } from '../lib/xbox.js';
import CountryFlag from './CountryFlag.jsx';

const brDateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const shortBrDateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
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

export default function NewZealandTrickCard({ gameId, brazilDate, tba }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showAllRegions, setShowAllRegions] = useState(false);
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

  if (loading) {
    return (
      <div className="liquid-glass w-full animate-pulse rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded bg-white/10" />
          <div className="h-3 w-32 rounded bg-white/10" />
        </div>
        <div className="mt-3 h-5 w-44 rounded bg-white/10" />
        <div className="mt-2 h-3 w-36 rounded bg-white/[0.06]" />
      </div>
    );
  }

  if (!data || (!data.nzRelease && !data.isSimultaneous)) {
    return null;
  }

  const { nzRelease, isSimultaneous, canUseNewZealandTrick, hoursAheadOfBrazil, regions } = data;
  const isAvailableNowInNZ = nzRelease && nzRelease.getTime() <= now;
  const diffNZ = nzRelease ? nzRelease.getTime() - now : 0;

  // Cálculo de contagem regressiva para a data da NZ
  const totalSecondsNZ = Math.max(0, Math.floor(diffNZ / 1000));
  const daysNZ = Math.floor(totalSecondsNZ / 86400);
  const hoursNZ = Math.floor((totalSecondsNZ % 86400) / 3600);
  const minutesNZ = Math.floor((totalSecondsNZ % 3600) / 60);

  return (
    <div className="liquid-glass w-full rounded-2xl p-4 transition-all sm:p-5">
      {/* Cenário 1: Permite o Truque da Nova Zelândia */}
      {canUseNewZealandTrick && (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
              <Zap className="h-3.5 w-3.5 text-xbox-neon" />
              Truque da Nova Zelândia
            </span>
            <span className="liquid-glass-subtle rounded-full px-2 py-0.5 text-[10px] font-semibold text-white/75">
              +{hoursAheadOfBrazil}h antes
            </span>
          </div>

          {/* Destaque principal */}
          {isAvailableNowInNZ ? (
            <div className="liquid-glass-subtle mt-3.5 rounded-xl border-xbox-neon/30 bg-xbox-green/[0.15] p-3.5 text-white">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-xbox-neon" />
                <p className="text-xs font-semibold uppercase tracking-wide text-xbox-neon">
                  Já disponível na Nova Zelândia
                </p>
              </div>
              <p className="mt-1 text-xs text-white/70">
                Mude a localidade do seu console para jogar agora mesmo.
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <h4 className="font-display text-lg font-semibold text-white">
                Jogue <strong className="font-bold text-xbox-neon">{hoursAheadOfBrazil}h antes</strong> no Xbox
              </h4>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/50">
                <CountryFlag code="NZ" className="h-2.5 w-3.5" />
                <span>{brDateTimeFmt.format(nzRelease)}</span>
                <span className="text-white/35">(Brasília)</span>
              </p>

              {/* Mini contagem regressiva para a NZ */}
              {diffNZ > 0 && (
                <div className="liquid-glass-subtle mt-3 flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs">
                  <span className="flex items-center gap-1.5 text-[11px] text-white/50">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-white/40" />
                    Libera na NZ em
                  </span>
                  <span className="font-mono text-xs font-semibold tabular-nums text-white/90">
                    {daysNZ > 0 && `${pad(daysNZ)}d `}
                    {pad(hoursNZ)}h {pad(minutesNZ)}m
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Como fazer o truque no Xbox (Passo a passo expansível) */}
          <div className="mt-3.5 border-t border-white/[0.06] pt-3">
            <button
              onClick={() => setShowHowTo((v) => !v)}
              className="flex w-full items-center justify-between text-left text-xs font-medium text-white/55 transition hover:text-white/90"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-white/40" />
                Como fazer o truque no console?
              </span>
              {showHowTo ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showHowTo && (
              <div className="liquid-glass-subtle mt-2.5 space-y-2 rounded-xl p-3 text-xs text-white/75 animate-fade-in">
                <ol className="list-inside list-decimal space-y-1">
                  <li>No Xbox, vá em <strong className="font-medium text-white">Configurações &gt; Sistema &gt; Idioma e Localidade</strong>.</li>
                  <li>Altere a <strong className="font-medium text-white">Localidade</strong> para <strong className="font-medium text-white">Nova Zelândia</strong>.</li>
                  <li>Selecione <strong className="font-medium text-white">Reiniciar agora</strong> e aproveite!</li>
                </ol>
                <p className="border-t border-white/[0.06] pt-1.5 text-[11px] text-white/45">
                  Não altera cobranças nem sua conta. Você pode voltar para o Brasil quando quiser.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Cenário 2: Lançamento Global Simultâneo */}
      {isSimultaneous && (
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
            <Globe className="h-3.5 w-3.5 text-xbox-neon" />
            Lançamento Global Simultâneo
          </span>

          <p className="mt-2.5 font-display text-base font-semibold text-white">
            Mesmo horário no mundo todo
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/60">
            Liberado simultaneamente em todas as regiões (às{' '}
            <strong className="font-medium text-white/90">{shortBrDateTimeFmt.format(brazilDate)}</strong> de Brasília). Mudar para a Nova Zelândia não antecipará o acesso.
          </p>
        </div>
      )}

      {/* Tabela de outros países (Retrátil) */}
      {regions && regions.length > 0 && (
        <div className="mt-3 border-t border-white/[0.06] pt-2.5">
          <button
            onClick={() => setShowAllRegions((v) => !v)}
            className="flex w-full items-center justify-between text-left text-xs font-medium text-white/55 transition hover:text-white/90"
          >
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-white/40" />
              Horários pelo mundo
            </span>
            {showAllRegions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showAllRegions && (
            <div className="liquid-glass-subtle mt-2.5 flex flex-col divide-y divide-white/[0.05] rounded-xl px-3 py-1.5 text-xs animate-fade-in">
              {/* Brasil como base */}
              <div className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 font-medium text-white/90">
                  <CountryFlag code="BR" className="h-3 w-4" />
                  Brasil (Sua região)
                </span>
                <span className="font-mono text-[11px] text-white/85">
                  {shortBrDateTimeFmt.format(brazilDate)}
                </span>
              </div>

              {regions
                .filter((r) => r.code !== 'BR')
                .map((r) => {
                  if (!r.date) return null;
                  const diffHours = Math.round((brazilDate.getTime() - r.date.getTime()) / (1000 * 60 * 60));
                  return (
                    <div key={r.code} className="flex items-center justify-between py-2">
                      <span className="flex items-center gap-2 text-white/65">
                        <CountryFlag code={r.code} className="h-3 w-4" />
                        {r.name}
                      </span>
                      <div className="text-right">
                        <span className="block font-mono text-[11px] text-white/85">
                          {shortBrDateTimeFmt.format(r.date)}
                        </span>
                        {diffHours > 0 && (
                          <span className="block text-[10px] font-medium text-xbox-neon">
                            +{diffHours}h antes
                          </span>
                        )}
                        {diffHours < 0 && (
                          <span className="block text-[10px] text-white/40">
                            {diffHours}h depois
                          </span>
                        )}
                        {diffHours === 0 && (
                          <span className="block text-[10px] text-white/50">
                            Mesmo horário
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
