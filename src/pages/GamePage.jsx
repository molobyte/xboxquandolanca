import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Star, AlertTriangle, RotateCw } from 'lucide-react';
import { getGame } from '../lib/xbox.js';
import { navigate } from '../lib/router.js';
import SmartSearch from '../components/SmartSearch.jsx';
import ReleaseCountdown from '../components/ReleaseCountdown.jsx';
import NewZealandTrickCard from '../components/NewZealandTrickCard.jsx';
import XboxLogo from '../components/XboxLogo.jsx';
import HoloTiltCover from '../components/HoloTiltCover.jsx';
import { calcularPontosRewards, formatarPontosRewards } from '../lib/rewards.js';
import { getPriceHistory, formatPrice } from '../lib/priceHistory.js';
import PriceHistoryChart from '../components/PriceHistoryChart.jsx';

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

export default function GamePage({ id }) {
  const [state, setState] = useState({ status: 'loading', game: null, error: null });

  const load = useCallback(
    (signal) => {
      setState({ status: 'loading', game: null, error: null });
      getGame(id, signal)
        .then((game) => {
          setState({ status: 'ready', game, error: null });
          document.title = `${game.title} · Quando lança?`;
        })
        .catch((e) => {
          if (e.name !== 'AbortError') setState({ status: 'error', game: null, error: e.message });
        });
    },
    [id]
  );

  useEffect(() => {
    const c = new AbortController();
    load(c.signal);
    return () => {
      c.abort();
      document.title = 'Quando lança? · Xbox';
    };
  }, [load]);

  const { game } = state;

  return (
    <div className="relative min-h-screen">
      {/* Arte de fundo */}
      {game?.hero && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[80vh] overflow-hidden">
          <img src={game.hero} alt="" className="h-full w-full object-cover opacity-40 animate-fade-in" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07090d]/40 via-[#07090d]/80 to-[#07090d]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07090d] via-transparent to-[#07090d]/60" />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-20">
        {/* Barra superior */}
        <header className="flex items-center gap-4 py-5">
          <button
            onClick={() => navigate('/')}
            className="flex shrink-0 items-center gap-2 rounded-xl px-2 py-1.5 text-white/80 transition hover:bg-white/5 hover:text-white"
            aria-label="Voltar para a busca"
          >
            <ArrowLeft className="h-4 w-4" />
            <XboxLogo className="h-6 w-6 text-xbox-neon" />
            <span className="hidden font-title text-base font-light sm:inline">Quando lança?</span>
          </button>
          <div className="w-full max-w-md">
            <SmartSearch size="sm" />
          </div>
        </header>

        {state.status === 'loading' && <Skeleton />}
        {state.status === 'error' && <ErrorState message={state.error} onRetry={() => load()} />}
        {state.status === 'ready' && <GameDetails game={game} />}
      </div>
    </div>
  );
}

function GameDetails({ game }) {
  const [expanded, setExpanded] = useState(false);
  const [priceHistory, setPriceHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!game) return;
    let active = true;
    setLoadingHistory(true);
    getPriceHistory({ title: game.title, slug: game.slug })
      .then((data) => {
        if (active) setPriceHistory(data);
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });
    return () => {
      active = false;
    };
  }, [game?.id, game?.title, game?.slug]);

  const meta = [
    ['Publicadora', game.publisher],
    ['Desenvolvedora', game.developer],
    ['Lançamento', game.releaseTba || !game.releaseDate ? 'A anunciar' : dateFmt.format(game.releaseDate)],
    ['Gênero', game.category],
    ['Plataformas', game.platforms.join(' · ')],
    ['Classificação', game.ageRating ? (game.ageRating === 'L' ? 'Livre' : `${game.ageRating} anos`) : null],
  ].filter(([, v]) => v);

  return (
    <>
    <div className="mt-6 flex flex-col gap-8 lg:mt-10 lg:flex-row lg:items-start">
      {/* Coluna lateral direita: Contador + Informações do jogo */}
      <aside className="flex w-full shrink-0 flex-col gap-6 sm:w-auto sm:min-w-[20rem] lg:order-last lg:sticky lg:top-6 lg:ml-auto lg:w-80">
        <ReleaseCountdown date={game.releaseDate} tba={game.releaseTba} />
        <NewZealandTrickCard gameId={game.id} brazilDate={game.releaseDate} tba={game.releaseTba} />

        {meta.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-4 font-action text-xs font-bold uppercase tracking-[0.2em] text-white/40">
              Informações do jogo
            </h3>
            <dl className="flex flex-col gap-3.5">
              {meta.map(([k, v]) => (
                <div key={k} className="border-l-2 border-xbox-green/60 pl-3">
                  <dt className="font-action text-[11px] uppercase tracking-wider text-white/40">{k}</dt>
                  <dd className="mt-0.5 font-sans text-sm font-medium text-white/90">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </aside>

      <section className="flex min-w-0 flex-1 flex-col gap-8 md:flex-row">
        {/* Capa com efeito 3D Parallax Hover & Holográfico */}
        <div className="shrink-0 md:w-64 lg:w-72">
          <HoloTiltCover
            src={game.cover}
            alt={`Capa de ${game.title}`}
            isSquare={game.coverIsSquare}
          />

          {/* Nota e avaliações embaixo da capa */}
          {game.rating && (
            <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 px-3 text-sm text-white/90 shadow-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
              <strong className="font-action text-base text-white">{game.rating.average.toFixed(1)}</strong>
              <span className="text-white/40 text-xs">({new Intl.NumberFormat('pt-BR').format(game.rating.count)} avaliações)</span>
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="min-w-0 flex-1">
          {game.category && (
            <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 font-action text-[11px] font-bold uppercase tracking-wider text-white/70">
              {game.category}
            </span>
          )}
          <h1 className="mt-3 font-title text-3xl font-light leading-tight tracking-tight sm:text-5xl">{game.title}</h1>
          {game.publisher && <p className="mt-2 text-lg text-white/60">{game.publisher}</p>}

          {/* Layout dos botões de preço justificados */}
          <div className="mt-5 flex flex-col gap-3">
            <PriceCardsGrid
              game={game}
              priceHistory={priceHistory}
              loadingHistory={loadingHistory}
            />

            {/* Microsoft Rewards */}
            {game.price?.list > 0 && (
              <RewardsBadge price={game.price.list} />
            )}

            {/* Gráfico de Histórico de Preços */}
            {priceHistory && priceHistory.history?.length > 1 && (
              <div id="price-chart-section">
                <PriceHistoryChart data={priceHistory} />
              </div>
            )}
          </div>

          {/* Embaixo do valor e nota: Sobre o jogo */}
          {game.description && (
            <div className="mt-8">
              <h2 className="font-title text-base font-light uppercase tracking-wider text-white/60">Sobre o jogo</h2>
              <p
                className={`mt-3 whitespace-pre-line leading-relaxed text-white/75 ${expanded ? '' : 'line-clamp-6'}`}
              >
                {game.description}
              </p>
              {game.description.length > 400 && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-2 font-action text-xs font-bold uppercase tracking-wider text-xbox-neon hover:underline"
                >
                  {expanded ? 'Mostrar menos' : 'Ler mais'}
                </button>
              )}
            </div>
          )}

          {game.features.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {game.features.map((f) => (
                <span key={f} className="rounded-lg bg-white/[0.06] px-2.5 py-1 text-xs text-white/70">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>
      </div>

      {/* Screenshots em largura total, abaixo */}
      {game.screenshots.length > 0 && (
        <section className="mt-14">
          <Screenshots shots={game.screenshots} />
        </section>
      )}
    </>
  );
}

function Screenshots({ shots }) {
  return (
    <>
      <h2 className="font-title text-base font-light uppercase tracking-wider text-white/60">Imagens</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {shots.map((s, i) => (
          <a key={i} href={s.full} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-white/10">
            <img
              src={s.thumb}
              alt={`Imagem ${i + 1}`}
              loading="lazy"
              className="aspect-video w-full object-cover transition duration-300 group-hover:scale-105"
            />
          </a>
        ))}
      </div>
    </>
  );
}

function PriceCardsGrid({ game, priceHistory, loadingHistory }) {
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: game.price?.currency || 'BRL' });
  const hasPrice = game.price && typeof game.price.list === 'number';
  const isFree = hasPrice && game.price.list === 0;
  const discounted = hasPrice && game.price.msrp && game.price.msrp > game.price.list;
  const discountPercent = discounted ? Math.round((1 - game.price.list / game.price.msrp) * 100) : null;

  const displayPrice = hasPrice
    ? isFree
      ? 'Gratuito'
      : fmt.format(game.price.list)
    : 'Loja Xbox';

  const isRecord =
    priceHistory?.lowestPrice != null &&
    hasPrice &&
    game.price.list <= priceHistory.lowestPrice;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
      {/* Botão 1: Preço Atual / Loja Xbox */}
      <a
        href={game.storeUrl}
        target="_blank"
        rel="noreferrer"
        className="group flex flex-col justify-between rounded-2xl bg-xbox-green p-3.5 sm:p-4 text-white shadow-lg transition hover:bg-xbox-bright hover:shadow-xbox-glow min-h-[96px]"
        title="Abrir página oficial na loja Xbox"
      >
        <div className="flex items-center justify-between gap-1">
          <span className="font-action text-[11px] font-bold uppercase tracking-wider text-white/90">
            Preço Atual
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-white/80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>

        <div className="my-1 flex items-baseline gap-2">
          {discounted && (
            <span className="font-display text-xs text-white/70 line-through">
              {fmt.format(game.price.msrp)}
            </span>
          )}
          <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
            {displayPrice}
          </span>
          {discountPercent && (
            <span className="rounded bg-black/25 px-1.5 py-0.5 font-action text-[10px] font-bold text-white">
              -{discountPercent}%
            </span>
          )}
        </div>

        <div className="flex items-center justify-between font-action text-[10px] font-bold uppercase tracking-[0.14em] text-white/90 group-hover:text-white">
          <span>Ver na loja Xbox</span>
          <span>&rarr;</span>
        </div>
      </a>

      {/* Botão 2: Menor Histórico */}
      <button
        type="button"
        onClick={() => {
          document.getElementById('price-chart-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="flex flex-col justify-between rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-3.5 sm:p-4 text-left text-yellow-300 shadow-sm transition hover:bg-yellow-500/15 hover:border-yellow-500/50 min-h-[96px]"
        title="Ver no gráfico de histórico de preços"
      >
        <div className="flex items-center justify-between gap-1">
          <span className="font-action text-[11px] font-bold uppercase tracking-wider text-yellow-400">
            ★ Menor Histórico
          </span>
          {isRecord && (
            <span className="rounded bg-yellow-400/20 px-1.5 py-0.5 font-action text-[9px] font-bold text-yellow-300 uppercase">
              Melhor Preço
            </span>
          )}
        </div>

        <div className="my-1 flex items-baseline gap-2">
          <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-yellow-300 leading-tight">
            {loadingHistory && !priceHistory ? (
              <span className="inline-block h-6 w-24 animate-pulse rounded bg-yellow-400/20" />
            ) : priceHistory?.lowestPrice != null ? (
              formatPrice(priceHistory.lowestPrice)
            ) : (
              '—'
            )}
          </span>
        </div>

        <div className="font-action text-[10px] text-yellow-400/80 font-medium truncate">
          {priceHistory?.lowestDate
            ? `Registrado em ${formatDateMonthYear(priceHistory.lowestDate)}`
            : loadingHistory
            ? 'Consultando histórico...'
            : 'Melhor oferta registrada'}
        </div>
      </button>

      {/* Botão 3: Maior Registrado */}
      <button
        type="button"
        onClick={() => {
          document.getElementById('price-chart-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 sm:p-4 text-left text-white shadow-sm transition hover:bg-white/[0.08] hover:border-white/20 min-h-[96px]"
        title="Ver no gráfico de histórico de preços"
      >
        <div className="flex items-center justify-between gap-1">
          <span className="font-action text-[11px] font-bold uppercase tracking-wider text-white/50">
            Maior Registrado
          </span>
        </div>

        <div className="my-1 flex items-baseline gap-2">
          <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white/80 leading-tight">
            {loadingHistory && !priceHistory ? (
              <span className="inline-block h-6 w-24 animate-pulse rounded bg-white/10" />
            ) : priceHistory?.highestPrice != null ? (
              formatPrice(priceHistory.highestPrice)
            ) : (
              '—'
            )}
          </span>
        </div>

        <div className="font-action text-[10px] text-white/40 font-medium truncate">
          {priceHistory?.highestPrice != null
            ? 'Pico histórico no Xbox'
            : loadingHistory
            ? 'Consultando histórico...'
            : 'Sem histórico prévio'}
        </div>
      </button>
    </div>
  );
}

function formatDateMonthYear(dateStr) {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-');
    const date = new Date(Number(y), Number(m) - 1, Number(d || 1));
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function RewardsBadge({ price }) {
  const pontos = calcularPontosRewards(price);
  if (!pontos) return null;

  return (
    <a
      href="https://rewards.bing.com"
      target="_blank"
      rel="noreferrer"
      className="group inline-flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-200 transition hover:bg-amber-400/15 hover:border-amber-400/35 w-fit shadow-sm"
      title="Calcular pontos necessários para resgatar cartões de presente Xbox no Microsoft Rewards"
    >
      <img
        src="https://rewards.bing.com/rewardscdn/images/rewards.png"
        alt="Microsoft Rewards"
        className="h-4 w-4 shrink-0 object-contain"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <span className="font-sans">
        Em torno de{' '}
        <strong className="font-display font-bold text-amber-300 text-sm">
          {formatarPontosRewards(pontos)}
        </strong>{' '}
        pontos no Microsoft Rewards
      </span>
      <ExternalLink className="h-3 w-3 text-amber-300/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  );
}

function Skeleton() {
  return (
    <div className="mt-10 flex animate-pulse flex-col gap-8 lg:flex-row">
      <div className="h-44 w-full rounded-2xl bg-white/5 sm:w-72 lg:order-last lg:ml-auto" />
      <div className="flex flex-1 flex-col gap-8 md:flex-row">
        <div className="aspect-[2/3] w-full rounded-2xl bg-white/5 md:w-64 lg:w-72" />
        <div className="flex-1 space-y-4">
          <div className="h-5 w-24 rounded-full bg-white/5" />
          <div className="h-12 w-3/4 rounded-lg bg-white/5" />
          <div className="h-5 w-40 rounded bg-white/5" />
          <div className="grid grid-cols-2 gap-4 pt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="mx-auto mt-24 max-w-md text-center">
      <AlertTriangle className="mx-auto h-10 w-10 text-yellow-400" />
      <h2 className="mt-4 text-xl font-bold">Não foi possível carregar o jogo</h2>
      <p className="mt-2 text-white/55">{message}</p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-xl bg-xbox-green px-4 py-2.5 font-semibold hover:bg-xbox-bright"
        >
          <RotateCw className="h-4 w-4" /> Tentar novamente
        </button>
        <button onClick={() => navigate('/')} className="rounded-xl border border-white/10 px-4 py-2.5 hover:bg-white/5">
          Nova busca
        </button>
      </div>
    </div>
  );
}
