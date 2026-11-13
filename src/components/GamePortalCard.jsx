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
    return 'border-amber-400/50 bg-amber-400/20 text-amber-200';
  }
  if (tone === 'upcoming') {
    return 'border-xbox-mint/40 bg-[#0b100c]/85 text-xbox-mint';
  }
  if (tone === 'released') {
    return 'border-xbox-neon/40 bg-xbox-green/25 text-xbox-mint';
  }
  return 'border-white/15 bg-[#0b100c]/85 text-neutral-300';
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
        className={`group relative flex aspect-[3/4] w-full min-w-0 flex-col justify-end overflow-hidden rounded-2xl border border-white/[0.09] bg-[#141a16] text-left shadow-portal-card transition-all duration-300 hover:-translate-y-1 hover:border-xbox-neon/50 hover:shadow-[0_20px_44px_-16px_rgba(16,124,16,0.5)] ${className}`}
      >
        {posterImg ? (
          <img
            src={posterImg}
            alt={game.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#141a16] text-white/15">
            <ImageOff className="h-9 w-9" />
          </div>
        )}

        {/* Scrim de profundidade no estilo Xbox Portal */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070908] via-[#070908]/55 via-40% to-black/15" />

        {/* Badge superior direito (Desconto / Novo / Game Pass / Lançamento) */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div>
            {game.inGamePass && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-[#090d0a]/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-xbox-neon backdrop-blur-md">
                <Gamepad2 className="h-2.5 w-2.5" />
                GP
              </span>
            )}
          </div>

          {discountPct ? (
            <span className="rounded-lg bg-amber-400 px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-[#090d0a] shadow-md">
              -{discountPct}%
            </span>
          ) : badgeOverride ? (
            <span
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${getToneClasses(
                badge.tone
              )}`}
            >
              {badge.label}
            </span>
          ) : badge.tone === 'upcoming' || badge.tone === 'imminent' ? (
            <span
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${getToneClasses(
                badge.tone
              )}`}
            >
              <Clock className="h-2.5 w-2.5" />
              {badge.label}
            </span>
          ) : isFree || game.inGamePass ? (
            <span className="rounded-lg bg-xbox-lime px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#080b08] shadow-md">
              {isFree ? 'Grátis' : 'Game Pass'}
            </span>
          ) : null}
        </div>

        {/* Rodapé sobre a arte */}
        <div className="relative z-10 p-3.5 sm:p-4">
          <div className="mb-1 flex items-baseline gap-1.5">
            {hasDiscount && (
              <span className="text-[11px] font-medium text-neutral-400 line-through">
                {formatPrice(game.price.msrp)}
              </span>
            )}
            {hasPrice ? (
              <span
                className={`font-display text-sm font-bold ${
                  isFree
                    ? 'text-xbox-lime'
                    : hasDiscount
                    ? 'text-amber-300'
                    : 'text-white/95'
                }`}
              >
                {isFree ? 'Gratuito' : formatPrice(game.price.list)}
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-xbox-neon">Ver ficha</span>
            )}
          </div>

          <h3 className="line-clamp-1 font-display text-[15px] font-bold text-white transition group-hover:text-xbox-neon sm:text-base">
            {game.title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-neutral-300/75">
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
        className={`group flex w-full min-w-0 items-stretch gap-3.5 rounded-2xl border border-white/[0.08] bg-[#141a16]/90 p-3.5 text-left shadow-portal-card transition-all duration-300 hover:-translate-y-0.5 hover:border-xbox-neon/45 hover:bg-[#1a221d] ${className}`}
      >
        <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d120f] sm:w-28">
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
            <span className="absolute left-1.5 top-1.5 rounded-md bg-amber-400 px-1.5 py-0.5 text-[10px] font-extrabold text-[#090d0a] shadow">
              -{discountPct}%
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                {game.inGamePass ? 'Game Pass' : game.category || 'Xbox Store'} · {dateLabel}
              </span>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getToneClasses(
                  badge.tone
                )}`}
              >
                {badge.label}
              </span>
            </div>

            <h3 className="mt-1.5 line-clamp-2 font-display text-[15px] font-bold leading-snug text-white transition group-hover:text-xbox-neon">
              {game.title}
            </h3>
            <p className="mt-1 line-clamp-1 text-xs text-neutral-400">
              {game.publisher || game.category || 'Microsoft Store Brasil'}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.07] pt-2">
            <div className="flex items-baseline gap-1.5">
              {hasDiscount && (
                <span className="text-[10px] text-neutral-400 line-through">
                  {formatPrice(game.price.msrp)}
                </span>
              )}
              <span
                className={`font-display text-xs font-bold ${
                  isFree
                    ? 'text-xbox-lime'
                    : hasDiscount
                    ? 'text-amber-300'
                    : 'text-neutral-200'
                }`}
              >
                {hasPrice ? (isFree ? 'Gratuito' : formatPrice(game.price.list)) : 'Xbox Store'}
              </span>
            </div>

            <span className="text-xs font-semibold text-neutral-300 transition group-hover:text-white">
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
      className={`group relative flex aspect-[16/10] w-full min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.09] bg-[#141a16] p-3.5 text-left shadow-portal-card transition-all duration-300 hover:-translate-y-1 hover:border-xbox-neon/50 hover:shadow-[0_20px_44px_-16px_rgba(16,124,16,0.5)] ${className}`}
    >
      {game.cardHero || game.cover ? (
        <img
          src={game.cardHero || game.cover}
          alt={game.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[#141a16] text-white/15">
          <ImageOff className="h-8 w-8" />
        </div>
      )}

      {/* Gradiente atmosférico suave */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070908] via-[#070908]/65 via-45% to-[#070908]/25" />

      {/* Topo: Badges */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {discountPct && (
            <span className="rounded-lg bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#090d0a] shadow">
              -{discountPct}%
            </span>
          )}
          {game.inGamePass && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-[#090d0a]/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-xbox-neon backdrop-blur-md">
              <Gamepad2 className="h-2.5 w-2.5" />
              Game Pass
            </span>
          )}
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${getToneClasses(
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
          <h3 className="line-clamp-1 font-display text-base font-bold text-white transition group-hover:text-xbox-neon">
            {game.title}
          </h3>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-300/80">
            <span className="inline-flex items-center gap-1 truncate">
              <Calendar className="h-3 w-3 shrink-0 text-neutral-400" />
              {dateLabel}
            </span>
            {game.publisher && (
              <>
                <span className="text-neutral-500">·</span>
                <span className="truncate text-neutral-400">{game.publisher}</span>
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          {hasDiscount && (
            <span className="block text-[10px] text-neutral-400 line-through">
              {formatPrice(game.price.msrp)}
            </span>
          )}
          <span
            className={`font-display text-sm font-bold ${
              isFree
                ? 'text-xbox-lime'
                : hasDiscount
                ? 'text-amber-300'
                : 'text-white'
            }`}
          >
            {hasPrice ? (isFree ? 'Gratuito' : formatPrice(game.price.list)) : 'Ver ficha'}
          </span>
        </div>
      </div>
    </button>
  );
}
