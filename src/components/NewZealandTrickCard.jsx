import { useEffect, useState } from 'react';
import { Zap, Globe, ChevronDown, ChevronUp, HelpCircle, CheckCircle2, Clock } from 'lucide-react';
import { getRegionalReleases } from '../lib/xbox.js';

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
      <div className="w-full rounded-2xl border border-white/10 bg-black/40 p-5 shadow-2xl backdrop-blur-xl sm:w-auto sm:min-w-[20rem] animate-pulse">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-white/20" />
          <div className="h-3 w-32 rounded bg-white/20" />
        </div>
        <div className="mt-3 h-5 w-48 rounded bg-white/20" />
        <div className="mt-2 h-3 w-40 rounded bg-white/10" />
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
    <div className="w-full rounded-2xl border border-white/10 bg-black/40 p-5 shadow-2xl backdrop-blur-xl sm:w-auto sm:min-w-[20rem] transition-all">
      {/* Cenário 1: Permite o Truque da Nova Zelândia */}
      {canUseNewZealandTrick && (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-xbox-neon/30 bg-xbox-neon/10 px-2.5 py-0.5 font-action text-[11px] font-bold tracking-wider text-xbox-neon uppercase">
              <Zap className="h-3.5 w-3.5" />
              Truque da Nova Zelândia
            </span>
            <span className="font-action text-xs font-bold text-amber-300">
              +{hoursAheadOfBrazil}h antes
            </span>
          </div>

          {/* Destaque principal */}
          {isAvailableNowInNZ ? (
            <div className="mt-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                <p className="font-action text-sm font-bold uppercase tracking-wide">
                  Já disponível na Nova Zelândia!
                </p>
              </div>
              <p className="mt-1 font-sans text-xs text-emerald-200/80">
                O jogo já liberou por lá. Mude a localidade do seu console para jogar agora mesmo!
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <h4 className="font-title text-xl font-light text-white">
                Jogue <strong className="font-action text-xbox-neon font-bold">{hoursAheadOfBrazil}h antes</strong> no Xbox
              </h4>
              <p className="mt-1 font-sans text-xs text-white/60">
                Disponível na loja da Nova Zelândia em:
              </p>
              <p className="mt-0.5 font-sans text-sm font-semibold text-white/90">
                {brDateTimeFmt.format(nzRelease)} <span className="text-white/50 text-xs font-normal">(horário de Brasília)</span>
              </p>

              {/* Mini contagem regressiva para a NZ */}
              {diffNZ > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-xs text-white/80">
                  <Clock className="h-4 w-4 text-xbox-neon shrink-0" />
                  <span className="font-action uppercase tracking-wider text-[11px] text-white/50">Libera na NZ em:</span>
                  <span className="ml-auto font-display text-sm font-bold text-xbox-neon tabular-nums">
                    {daysNZ > 0 && `${pad(daysNZ)}d `}
                    {pad(hoursNZ)}h {pad(minutesNZ)}m
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Como fazer o truque no Xbox (Passo a passo expansível) */}
          <div className="mt-3.5 border-t border-white/10 pt-3">
            <button
              onClick={() => setShowHowTo((v) => !v)}
              className="flex w-full items-center justify-between text-left font-action text-xs font-bold text-white/70 hover:text-white transition"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                Como fazer o truque no console?
              </span>
              {showHowTo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showHowTo && (
              <div className="mt-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-white/80 space-y-2 animate-fade-in">
                <ol className="list-decimal list-inside space-y-1 text-white/70">
                  <li>No Xbox, vá em <strong className="text-white">Configurações &gt; Sistema &gt; Idioma e Localidade</strong>.</li>
                  <li>Altere a <strong className="text-white">Localidade</strong> para <strong className="text-white">Nova Zelândia</strong>.</li>
                  <li>Selecione <strong className="text-white">Reiniciar agora</strong> e aproveite o jogo!</li>
                </ol>
                <p className="text-[11px] text-white/40 pt-1 border-t border-white/5">
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
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-0.5 font-action text-[11px] font-bold tracking-wider text-sky-400 uppercase">
              <Globe className="h-3.5 w-3.5" />
              Lançamento Global Simultâneo
            </span>
          </div>

          <p className="mt-3 font-title text-base font-light text-white">
            Mesmo horário no mundo todo
          </p>
          <p className="mt-1 font-sans text-xs leading-relaxed text-white/60">
            Este jogo será liberado exatamente no mesmo momento em todas as regiões (às{' '}
            <strong className="text-white font-medium">{shortBrDateTimeFmt.format(brazilDate)}</strong> no horário de Brasília). Mudar a região do Xbox para a Nova Zelândia não antecipará o acesso.
          </p>
        </div>
      )}

      {/* Tabela de outros países (Retrátil) */}
      {regions && regions.length > 0 && (
        <div className="mt-3.5 border-t border-white/10 pt-3">
          <button
            onClick={() => setShowAllRegions((v) => !v)}
            className="flex w-full items-center justify-between text-left font-action text-[11px] font-bold uppercase tracking-wider text-white/40 hover:text-white/80 transition"
          >
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Horários pelo mundo
            </span>
            {showAllRegions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showAllRegions && (
            <div className="mt-3 flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs animate-fade-in">
              {/* Brasil como base */}
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="flex items-center gap-1.5 text-white/90 font-medium">
                  🇧🇷 Brasil (Sua região)
                </span>
                <span className="text-white/90 font-mono text-[11px]">
                  {shortBrDateTimeFmt.format(brazilDate)}
                </span>
              </div>

              {regions
                .filter((r) => r.code !== 'BR')
                .map((r) => {
                  if (!r.date) return null;
                  const diffHours = Math.round((brazilDate.getTime() - r.date.getTime()) / (1000 * 60 * 60));
                  return (
                    <div key={r.code} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                      <span className="flex items-center gap-1.5 text-white/70">
                        {r.flag} {r.name}
                      </span>
                      <div className="text-right">
                        <span className="font-mono text-[11px] text-white/90 block">
                          {shortBrDateTimeFmt.format(r.date)}
                        </span>
                        {diffHours > 0 && (
                          <span className="text-[10px] text-xbox-neon font-action block">
                            +{diffHours}h antes
                          </span>
                        )}
                        {diffHours < 0 && (
                          <span className="text-[10px] text-white/40 font-action block">
                            {diffHours}h depois
                          </span>
                        )}
                        {diffHours === 0 && (
                          <span className="text-[10px] text-sky-400 font-action block">
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
