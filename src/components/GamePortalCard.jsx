import { Calendar, Clock, Gamepad2, ImageOff } from 'lucide-react';
import { gamePath, navigate } from '../lib/router.js';
import { formatPrice } from '../lib/priceHistory.js';

const shortDateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function getReleaseBadge(game, nowMs) {
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

export default function GamePortalCard({ game, nowMs = Date.now(), badgeOverride = null }) {
  const badge = badgeOverride || getReleaseBadge(game, nowMs);
  const hasPrice = game.price && typeof game.price.list === 'number';
  const isFree = hasPrice && game.price.list === 0;
  const hasDiscount = hasPrice && game.price.msrp > game.price.list && game.price.list > 0;
  const discountPct = hasDiscount
    ? Math.round((1 - game.price.list / game.price.msrp) * 100)
    : null;

  const badgeStyle =
    badge.tone === 'imminent'
      ? 'border-amber-400/50 bg-amber-400/20 text-amber-300'
      : badge.tone === 'upcoming'
      ? 'border-xbox-neon/50 bg-[#07090d]/85 text-xbox-neon'
      : badge.tone === 'released'
      ? 'border-emerald-400/40 bg-emerald-950/85 text-emerald-300'
      : 'border-white/20 bg-[#07090d]/85 text-white/70';

  return (
    <button
      type="button"
      onClick={() => navigate(gamePath(game.id))}
      className="group flex min-w-0 flex-col overflow-hidden rounded-[2px] border border-white/10 bg-[#0d1218] text-left transition hover:border-xbox-neon/60 hover:bg-[#121922]"
    >
      {/* Mídia 16:9 */}
      <div className="relative aspect-video w-full overflow-hidden border-b border-white/10 bg-[#080b0f]">
        {game.cardHero || game.cover ? (
          <img
            src={game.cardHero || game.cover}
            alt={game.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/15">
            <ImageOff className="h-8 w-8" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0d1218] via-transparent to-black/25 opacity-80" />

        {/* Barra superior de tags */}
        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {discountPct && (
              <span className="rounded-[2px] bg-xbox-green px-1.5 py-0.5 font-action text-[10px] font-bold uppercase tracking-wider text-white shadow">
                -{discountPct}%
              </span>
            )}
            {game.inGamePass && (
              <span className="inline-flex items-center gap-1 rounded-[2px] border border-white/20 bg-black/80 px-1.5 py-0.5 font-action text-[9px] font-bold uppercase tracking-wider text-white">
                <Gamepad2 className="h-2.5 w-2.5 text-xbox-neon" /> Game Pass
              </span>
            )}
          </div>

          <span
            className={`inline-flex items-center gap-1 rounded-[2px] border px-1.5 py-0.5 font-action text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${badgeStyle}`}
          >
            {badge.tone === 'upcoming' || badge.tone === 'imminent' ? (
              <Clock className="h-2.5 w-2.5" />
            ) : null}
            {badge.label}
          </span>
        </div>
      </div>

      {/* Corpo */}
      <div className="flex flex-1 flex-col justify-between p-3.5">
        <div>
          <h3 className="line-clamp-1 font-title text-base font-normal text-white transition group-hover:text-xbox-neon">
            {game.title}
          </h3>
          <p className="mt-0.5 truncate font-sans text-xs text-white/45">
            {game.publisher || game.category || 'Xbox Store'}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-2.5 text-xs">
          <span className="flex items-center gap-1.5 truncate font-sans text-[11px] text-white/60">
            <Calendar className="h-3 w-3 shrink-0 text-white/35" />
            {game.releaseTba || !game.releaseDate
              ? 'Data a anunciar'
              : shortDateFmt.format(game.releaseDate)}
          </span>

          <div className="flex shrink-0 items-baseline gap-1.5">
            {hasDiscount && (
              <span className="font-sans text-[10px] text-white/35 line-through">
                {formatPrice(game.price.msrp)}
              </span>
            )}
            <span
              className={`font-display text-xs font-bold ${
                isFree
                  ? 'text-xbox-neon'
                  : hasDiscount
                  ? 'text-amber-300'
                  : 'text-white/90'
              }`}
            >
              {hasPrice ? (isFree ? 'Gratuito' : formatPrice(game.price.list)) : 'Ver ficha'}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
