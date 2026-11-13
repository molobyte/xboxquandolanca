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
      <div className="w-full animate-pulse rounded-2xl border border-white/[0.08] bg-[#151c33]/90 p-5 shadow-portal-card backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-md bg-white/20" />
          <div className="h-3 w-32 rounded-md bg-white/20" />
        </div>
        <div className="mt-3 h-5 w-48 rounded-md bg-white/20" />
        <div className="mt-2 h-3 w-40 rounded-md bg-white/10" />
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
    <div className="w-full rounded-2xl border border-white/[0.09] bg-[#151c33]/90 p-5 shadow-portal-card backdrop-blur-xl transition-all">
      {/* Cenário 1: Permite o Truque da Nova Zelândia */}
      {canUseNewZealandTrick && (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-xbox-neon/35 bg-xbox-neon/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-xbox-neon uppercase">
              <Zap className="h-3 w-3" />
              Truque da Nova Zelândia
            </span>
            <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-bold text-amber-300">
              +{hoursAheadOfBrazil}h antes
            </span>
          </div>

          {/* Destaque principal */}
          {isAvailableNowInNZ ? (
            <div className="mt-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                <p className="text-sm font-bold uppercase tracking-wide">
                  Já disponível na Nova Zelândia!
                </p>
              </div>
              <p className="mt-1 text-xs text-emerald-200/80">
                O jogo já liberou por lá. Mude a localidade do seu console para jogar agora mesmo!
              </p>
            </div>
          ) : (
            <div className="mt-3.5">
              <h4 className="font-display text-xl font-semibold text-white">
                Jogue <strong className="font-bold text-xbox-neon">{hoursAheadOfBrazil}h antes</strong> no Xbox
              </h4>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                <CountryFlag code="NZ" className="w-3.5 h-2.5" />
                Disponível na loja da Nova Zelândia em:
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white">
                {brDateTimeFmt.format(nzRelease)} <span className="text-xs font-normal text-slate-400">(horário de Brasília)</span>
              </p>

              {/* Mini contagem regressiva para a NZ */}
              {diffNZ > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0d1223] p-3 text-xs text-slate-200">
                  <Clock className="h-4 w-4 shrink-0 text-portal-cyan" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Libera na NZ em:</span>
                  <span className="ml-auto font-display text-sm font-bold tabular-nums text-xbox-neon">
                    {daysNZ > 0 && `${pad(daysNZ)}d `}
                    {pad(hoursNZ)}h {pad(minutesNZ)}m
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Como fazer o truque no Xbox (Passo a passo expansível) */}
          <div className="mt-4 border-t border-white/[0.08] pt-3">
            <button
              onClick={() => setShowHowTo((v) => !v)}
              className="flex w-full items-center justify-between text-left text-xs font-semibold text-slate-300 transition hover:text-white"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                Como fazer o truque no console?
              </span>
              {showHowTo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showHowTo && (
              <div className="mt-2.5 space-y-2 rounded-xl border border-white/[0.08] bg-[#0d1223] p-3.5 text-xs text-slate-200 animate-fade-in">
                <ol className="list-inside list-decimal space-y-1 text-slate-300">
                  <li>No Xbox, vá em <strong className="text-white">Configurações &gt; Sistema &gt; Idioma e Localidade</strong>.</li>
                  <li>Altere a <strong className="text-white">Localidade</strong> para <strong className="text-white">Nova Zelândia</strong>.</li>
                  <li>Selecione <strong className="text-white">Reiniciar agora</strong> e aproveite o jogo!</li>
                </ol>
                <p className="border-t border-white/[0.06] pt-1.5 text-[11px] text-slate-400">
                  ✓ Não altera cobranças nem sua conta. Você pode voltar para o Brasil a qualquer momento.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Cenário 2: Lançamento Global Simultâneo */}
      {isSimultaneous && (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-portal-cyan/35 bg-portal-cyan/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-portal-cyan uppercase">
              <Globe className="h-3.5 w-3.5" />
              Lançamento Global Simultâneo
            </span>
          </div>

          <p className="mt-3 font-display text-base font-semibold text-white">
            Mesmo horário no mundo todo
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300/75">
            Este jogo será liberado exatamente no mesmo momento em todas as regiões (às{' '}
            <strong className="font-medium text-white">{shortBrDateTimeFmt.format(brazilDate)}</strong> no horário de Brasília). Mudar a região do Xbox para a Nova Zelândia não antecipará o acesso.
          </p>
        </div>
      )}

      {/* Tabela de outros países (Retrátil) */}
      {regions && regions.length > 0 && (
        <div className="mt-3.5 border-t border-white/[0.08] pt-3">
          <button
            onClick={() => setShowAllRegions((v) => !v)}
            className="flex w-full items-center justify-between text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 transition hover:text-white"
          >
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Horários pelo mundo
            </span>
            {showAllRegions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showAllRegions && (
            <div className="mt-3 flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-[#0d1223] p-3 text-xs animate-fade-in">
              {/* Brasil como base */}
              <div className="flex items-center justify-between border-b border-white/[0.06] py-1.5">
                <span className="flex items-center gap-2 font-medium text-white">
                  <CountryFlag code="BR" className="w-4 h-3" />
                  Brasil (Sua região)
                </span>
                <span className="font-mono text-[11px] text-white">
                  {shortBrDateTimeFmt.format(brazilDate)}
                </span>
              </div>

              {regions
                .filter((r) => r.code !== 'BR')
                .map((r) => {
                  if (!r.date) return null;
                  const diffHours = Math.round((brazilDate.getTime() - r.date.getTime()) / (1000 * 60 * 60));
                  return (
                    <div key={r.code} className="flex items-center justify-between border-b border-white/[0.06] py-1.5 last:border-0">
                      <span className="flex items-center gap-2 text-slate-300">
                        <CountryFlag code={r.code} className="w-4 h-3" />
                        {r.name}
                      </span>
                      <div className="text-right">
                        <span className="block font-mono text-[11px] text-white">
                          {shortBrDateTimeFmt.format(r.date)}
                        </span>
                        {diffHours > 0 && (
                          <span className="block text-[10px] font-semibold text-xbox-neon">
                            +{diffHours}h antes
                          </span>
                        )}
                        {diffHours < 0 && (
                          <span className="block text-[10px] text-slate-400">
                            {diffHours}h depois
                          </span>
                        )}
                        {diffHours === 0 && (
                          <span className="block text-[10px] text-portal-cyan">
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
