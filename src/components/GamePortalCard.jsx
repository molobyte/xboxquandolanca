import { Calendar, Clock, Gamepad2, ImageOff } from 'lucide-react';
import { gamePath, navigate } from '../lib/router.js';
import { formatPrice } from '../lib/priceHistory.js';

const shortDateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function getReleaseBadge(game, nowMs) {
  if (game.releaseTba || !game.releaseDate) {
    return { label: 'A anunciar', tone: 'neutral' };
  }
  const diffMs = game.releaseDate.getTime() - nowMs;
  if (diffMs <= 0) {
    return { label: 'Disponível', tone: 'released' };
  }
  const hours = Math.ceil(diffMs / 3600000);
  if (hours <= 48) {
    return { label: `Em ${hours}h`, tone: 'imminent' };
  }
  const days = Math.ceil(diffMs / 86400000);
  return { label: `Em ${days}d`, tone: 'upcoming' };
}

function getPriceInfo(game) {
  const hasPrice = game.price && typeof game.price.list === 'number';
  const isFree = hasPrice && game.price.list === 0;
  const hasDiscount = hasPrice && game.price.msrp > game.price.list && game.price.list > 0;
  const discountPct = hasDiscount
    ? Math.round((1 - game.price.list / game.price.msrp) * 100)
    : null;
  return { hasPrice, isFree, hasDiscount, discountPct };
}

function getToneClasses(tone) {
  if (tone === 'imminent') {
    return 'border-white/20 bg-black/60 text-white';
  }
  if (tone === 'upcoming') {
    return 'border-white/15 bg-black/55 text-white/85';
  }
  if (tone === 'released') {
    return 'border-xbox-neon/30 bg-xbox-green/25 text-xbox-mint';
  }
  return 'border-white/15 bg-black/55 text-white/70';
}

export default function GamePortalCard({
  game,
  nowMs = Date.now(),
  badgeOverride = null,
  variant = 'wide',
  className = '',
}) {
  const badge = badgeOverride || getReleaseBadge(game, nowMs);
  const { hasPrice, isFree, hasDiscount, discountPct } = getPriceInfo(game);
  const dateLabel =
    game.releaseTba || !game.releaseDate ? 'Data a anunciar' : shortDateFmt.format(game.releaseDate);

  if (variant === 'poster') {
    const posterImg = game.cover || game.cardHero;
    return (
      <button
        type="button"
        onClick={() => navigate(gamePath(game.id))}
        className={`group relative flex aspect-[3/4] w-full min-w-0 flex-col justify-end overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] text-left shadow-portal-card transition-all duration-300 hover:-translate-y-1 hover:border-white/20 ${className}`}
      >
        {posterImg ? (
          <img
            src={posterImg}
            alt={game.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02] text-white/15">
            <ImageOff className="h-9 w-9" />
          </div>
        )}

        {/* Scrim de profundidade suave */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#060807] via-[#060807]/50 via-40% to-black/10" />

        {/* Badge superior direito */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div>
            {game.inGamePass && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/85 backdrop-blur-md">
                <Gamepad2 className="h-2.5 w-2.5 text-xbox-neon" />
                GP
              </span>
            )}
          </div>

          {discountPct ? (
            <span className="rounded-full border border-xbox-neon/35 bg-xbox-green/80 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white backdrop-blur-md">
              -{discountPct}%
            </span>
          ) : badgeOverride ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider backdrop-blur-md ${getToneClasses(
                badge.tone
              )}`}
            >
              {badge.label}
            </span>
          ) : badge.tone === 'upcoming' || badge.tone === 'imminent' ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider backdrop-blur-md ${getToneClasses(
                badge.tone
              )}`}
            >
              <Clock className="h-2.5 w-2.5" />
              {badge.label}
            </span>
          ) : isFree || game.inGamePass ? (
            <span className="rounded-full border border-white/15 bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/85 backdrop-blur-md">
              {isFree ? 'Grátis' : 'Game Pass'}
            </span>
          ) : null}
        </div>

        {/* Rodapé sobre a arte */}
        <div className="relative z-10 p-3.5 sm:p-4">
          <div className="mb-1 flex items-baseline gap-1.5">
            {hasDiscount && (
              <span className="text-[11px] text-white/45 line-through">
                {formatPrice(game.price.msrp)}
              </span>
            )}
            {hasPrice ? (
              <span
                className={`font-display text-sm font-bold ${
                  isFree || hasDiscount ? 'text-xbox-neon' : 'text-white/95'
                }`}
              >
                {isFree ? 'Gratuito' : formatPrice(game.price.list)}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-white/60">Ver ficha</span>
            )}
          </div>

          <h3 className="line-clamp-1 font-display text-[15px] font-bold text-white transition group-hover:text-white/90 sm:text-base">
            {game.title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-white/50">
            {badge.tone === 'upcoming' || badge.tone === 'imminent'
              ? dateLabel
              : game.publisher || game.category || 'Microsoft Store BR'}
          </p>
        </div>
      </button>
    );
  }

  if (variant === 'editorial') {
    const thumbImg = game.cover || game.cardHero;
    return (
      <button
        type="button"
        onClick={() => navigate(gamePath(game.id))}
        className={`liquid-glass group flex w-full min-w-0 items-stretch gap-3.5 rounded-2xl p-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06] ${className}`}
      >
        <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-xl border border-white/[0.07] bg-black/30 sm:w-28">
          {thumbImg ? (
            <img
              src={thumbImg}
              alt={game.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/15">
              <ImageOff className="h-6 w-6" />
            </div>
          )}
          {discountPct && (
            <span className="absolute left-1.5 top-1.5 rounded-md bg-xbox-green/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
              -{discountPct}%
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                {game.inGamePass ? 'Game Pass' : game.category || 'Xbox Store'} · {dateLabel}
              </span>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${getToneClasses(
                  badge.tone
                )}`}
              >
                {badge.label}
              </span>
            </div>

            <h3 className="mt-1.5 line-clamp-2 font-display text-[15px] font-bold leading-snug text-white">
              {game.title}
            </h3>
            <p className="mt-1 line-clamp-1 text-xs text-white/45">
              {game.publisher || game.category || 'Microsoft Store Brasil'}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-2">
            <div className="flex items-baseline gap-1.5">
              {hasDiscount && (
                <span className="text-[10px] text-white/40 line-through">
                  {formatPrice(game.price.msrp)}
                </span>
              )}
              <span
                className={`font-display text-xs font-bold ${
                  isFree || hasDiscount ? 'text-xbox-neon' : 'text-white/85'
                }`}
              >
                {hasPrice ? (isFree ? 'Gratuito' : formatPrice(game.price.list)) : 'Xbox Store'}
              </span>
            </div>

            <span className="text-xs font-medium text-white/50 transition group-hover:text-white">
              Abrir &rarr;
            </span>
          </div>
        </div>
      </button>
    );
  }

  // Default: variant="wide" ("Latest Releases" atmospheric card)
  return (
    <button
      type="button"
      onClick={() => navigate(gamePath(game.id))}
      className={`group relative flex aspect-[16/10] w-full min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5 text-left shadow-portal-card transition-all duration-300 hover:-translate-y-1 hover:border-white/20 ${className}`}
    >
      {game.cardHero || game.cover ? (
        <img
          src={game.cardHero || game.cover}
          alt={game.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02] text-white/15">
          <ImageOff className="h-8 w-8" />
        </div>
      )}

      {/* Gradiente atmosférico suave */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#060807] via-[#060807]/60 via-45% to-[#060807]/20" />

      {/* Topo: Badges */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {discountPct && (
            <span className="rounded-full border border-xbox-neon/35 bg-xbox-green/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
              -{discountPct}%
            </span>
          )}
          {game.inGamePass && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/85 backdrop-blur-md">
              <Gamepad2 className="h-2.5 w-2.5 text-xbox-neon" />
              Game Pass
            </span>
          )}
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider backdrop-blur-md ${getToneClasses(
            badge.tone
          )}`}
        >
          {(badge.tone === 'upcoming' || badge.tone === 'imminent') && (
            <Clock className="h-2.5 w-2.5" />
          )}
          {badge.label}
        </span>
      </div>

      {/* Base: Título, Data e Preço sobre o gradiente */}
      <div className="relative z-10 mt-auto flex items-end justify-between gap-3 pt-4">
        <div className="min-w-0">
          <h3 className="line-clamp-1 font-display text-base font-bold text-white">
            {game.title}
          </h3>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-white/60">
            <span className="inline-flex items-center gap-1 truncate">
              <Calendar className="h-3 w-3 shrink-0 text-white/40" />
              {dateLabel}
            </span>
            {game.publisher && (
              <>
                <span className="text-white/30">·</span>
                <span className="truncate text-white/45">{game.publisher}</span>
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          {hasDiscount && (
            <span className="block text-[10px] text-white/45 line-through">
              {formatPrice(game.price.msrp)}
            </span>
          )}
          <span
            className={`font-display text-sm font-bold ${
              isFree || hasDiscount ? 'text-xbox-neon' : 'text-white'
            }`}
          >
            {hasPrice ? (isFree ? 'Gratuito' : formatPrice(game.price.list)) : 'Ver ficha'}
          </span>
        </div>
      </div>
    </button>
  );
}
