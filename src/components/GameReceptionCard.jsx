import { Award, Clock, ExternalLink } from 'lucide-react';

const HLTB_LABEL_MAP = {
  'main story': 'História principal',
  'main + extra': 'História + extras',
  'main + sides': 'História + extras',
  completionist: 'Complecionista',
  'single-player': 'Single-Player',
  'co-op': 'Cooperativo',
  'vs.': 'Competitivo',
};

function translateHltbLabel(label = '') {
  return HLTB_LABEL_MAP[label.trim().toLowerCase()] || label;
}

function getMetacriticTone(score) {
  if (score >= 75) {
    return {
      badge: 'border-emerald-400/35 bg-emerald-500/20 text-emerald-300',
      label: 'Aclamado',
    };
  }
  if (score >= 50) {
    return {
      badge: 'border-amber-400/35 bg-amber-500/20 text-amber-300',
      label: 'Misto',
    };
  }
  return {
    badge: 'border-rose-400/35 bg-rose-500/20 text-rose-300',
    label: 'Baixa',
  };
}

function getUserScoreTone(score) {
  if (score >= 7.5) return 'text-emerald-300/90';
  if (score >= 5.0) return 'text-amber-300/90';
  return 'text-rose-300/90';
}

function getOpenCriticTone(score, tier) {
  const normalizedTier = (tier || '').toLowerCase();
  if (normalizedTier === 'mighty' || (!normalizedTier && score >= 84)) {
    return {
      badge: 'border-emerald-400/35 bg-emerald-500/20 text-emerald-300',
      tierText: 'text-emerald-300/90',
    };
  }
  if (normalizedTier === 'strong' || (!normalizedTier && score >= 75)) {
    return {
      badge: 'border-teal-400/35 bg-teal-500/20 text-teal-300',
      tierText: 'text-teal-300/90',
    };
  }
  if (normalizedTier === 'fair' || (!normalizedTier && score >= 66)) {
    return {
      badge: 'border-amber-400/35 bg-amber-500/20 text-amber-300',
      tierText: 'text-amber-300/90',
    };
  }
  return {
    badge: 'border-rose-400/35 bg-rose-500/20 text-rose-300',
    tierText: 'text-rose-300/90',
  };
}

function ScoreTile({ href, title, children }) {
  const cls =
    'liquid-glass-subtle group flex min-w-0 flex-col justify-between rounded-xl p-2.5 transition hover:border-white/20 hover:bg-white/[0.06] sm:p-3';

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" title={title} className={cls}>
        {children}
      </a>
    );
  }
  return <div className={cls}>{children}</div>;
}

export default function GameReceptionCard({ reviews, howLongToBeat, loading = false }) {
  const mc = reviews?.metacritic || null;
  const oc = reviews?.opencritic || null;
  const hltbEntries = howLongToBeat?.entries || [];

  const hasReviews = Boolean(mc || oc);
  const hasHltb = hltbEntries.length > 0;

  if (loading && !hasReviews && !hasHltb) {
    return (
      <div className="liquid-glass min-w-0 animate-pulse rounded-2xl p-3.5 sm:p-4">
        <div className="h-3 w-32 rounded bg-white/[0.06]" />
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <div className="h-16 rounded-xl bg-white/[0.04]" />
          <div className="h-16 rounded-xl bg-white/[0.04]" />
        </div>
        <div className="mt-3 border-t border-white/[0.06] pt-3">
          <div className="h-3 w-28 rounded bg-white/[0.06]" />
          <div className="mt-2.5 h-20 rounded-xl bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  if (!hasReviews && !hasHltb) {
    return null;
  }

  const mcTone = mc?.score != null ? getMetacriticTone(mc.score) : null;
  const ocTone = oc?.score != null ? getOpenCriticTone(oc.score, oc.tier) : null;

  return (
    <div className="liquid-glass min-w-0 rounded-2xl p-3.5 sm:p-4">
      {hasReviews && (
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            <Award className="h-3 w-3 shrink-0 text-xbox-neon/80" />
            <span>Avaliação da Crítica</span>
          </div>

          <div className={`mt-2.5 grid gap-2 ${mc && oc ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {mc && (
              <ScoreTile href={mc.url} title="Abrir página do jogo no Metacritic">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-white/55">
                    Metacritic
                  </span>
                  {mc.url && (
                    <ExternalLink className="h-2.5 w-2.5 shrink-0 text-white/30 transition group-hover:text-white/75" />
                  )}
                </div>

                <div className="mt-2 flex items-center gap-2">
                  {mc.score != null ? (
                    <>
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-display text-base font-bold tabular-nums ${mcTone.badge}`}
                      >
                        {mc.score}
                      </span>
                      <div className="min-w-0 leading-tight">
                        <span className="block truncate text-[11px] font-medium text-white/85">
                          {mcTone.label}
                        </span>
                        {mc.userScore != null ? (
                          <span className="mt-0.5 block truncate text-[10px] text-white/45">
                            Usuários{' '}
                            <strong className={`font-mono font-semibold ${getUserScoreTone(mc.userScore)}`}>
                              {mc.userScore.toFixed(1)}
                            </strong>
                          </span>
                        ) : (
                          <span className="mt-0.5 block text-[10px] text-white/40">Metascore</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] font-display text-sm font-bold tabular-nums text-white">
                        {mc.userScore.toFixed(1)}
                      </span>
                      <div className="min-w-0 leading-tight">
                        <span className="block truncate text-[11px] font-medium text-white/85">Usuários</span>
                        <span className="mt-0.5 block text-[10px] text-white/40">de 10</span>
                      </div>
                    </>
                  )}
                </div>
              </ScoreTile>
            )}

            {oc && (
              <ScoreTile href={oc.url} title="Abrir página do jogo no OpenCritic">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-white/55">
                    OpenCritic
                  </span>
                  {oc.url && (
                    <ExternalLink className="h-2.5 w-2.5 shrink-0 text-white/30 transition group-hover:text-white/75" />
                  )}
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-display text-base font-bold tabular-nums ${ocTone.badge}`}
                  >
                    {oc.score}
                  </span>
                  <div className="min-w-0 leading-tight">
                    <span className={`block truncate text-[11px] font-semibold ${ocTone.tierText}`}>
                      {oc.tier || 'Crítica'}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-white/40">Média geral</span>
                  </div>
                </div>
              </ScoreTile>
            )}
          </div>
        </div>
      )}

      {hasHltb && (
        <div className={hasReviews ? 'mt-3 border-t border-white/[0.06] pt-3' : ''}>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              <Clock className="h-3 w-3 shrink-0 text-xbox-neon/80" />
              <span>HowLongToBeat</span>
            </span>
            {howLongToBeat?.url && (
              <a
                href={howLongToBeat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-white/40 transition hover:text-white/80"
                title="Abrir tempo médio no HowLongToBeat"
              >
                <span>Ver mais</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>

          <dl className="liquid-glass-subtle mt-2.5 divide-y divide-white/[0.05] rounded-xl px-3 py-1">
            {hltbEntries.map((entry) => (
              <div
                key={entry.label}
                className="flex items-center justify-between gap-3 py-1.5 text-xs"
              >
                <dt className="truncate text-[11px] text-white/60">
                  {translateHltbLabel(entry.label)}
                </dt>
                <dd className="shrink-0 font-mono text-xs font-semibold tabular-nums text-white/95">
                  {entry.displayValue}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
