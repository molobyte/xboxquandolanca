import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  RotateCw,
  Share2,
  Star,
  TrendingDown,
} from 'lucide-react';
import { getGame } from '../lib/xbox.js';
import { navigate, sectionPath } from '../lib/router.js';
import { recordRecentGame } from '../lib/portal.js';
import PortalHeader from '../components/PortalHeader.jsx';
import PortalFooter from '../components/PortalFooter.jsx';
import ReleaseCountdown from '../components/ReleaseCountdown.jsx';
import NewZealandTrickCard from '../components/NewZealandTrickCard.jsx';
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
          recordRecentGame(game);
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
      document.title = 'Quando lança? · Portal Xbox Brasil';
    };
  }, [load]);

  const { game } = state;

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-xbox-bg text-neutral-100">
      {/* Atmosfera sutil + Arte de fundo */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-[34rem] w-[34rem] rounded-full bg-xbox-green/20 blur-[180px]" />
        <div className="absolute right-0 top-1/3 h-[28rem] w-[28rem] rounded-full bg-xbox-bright/10 blur-[180px]" />
      </div>

      {game?.hero && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[72vh] overflow-hidden">
          <img src={game.hero} alt="" className="h-full w-full object-cover opacity-40 animate-fade-in" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0d0b]/40 via-[#0a0d0b]/80 to-[#0a0d0b]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d0b] via-transparent to-[#0a0d0b]/75" />
        </div>
      )}

      <PortalHeader showSearch isGamePage />

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-[1540px] flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-10">
        {state.status === 'loading' && <Skeleton />}
        {state.status === 'error' && <ErrorState message={state.error} onRetry={() => load()} />}
        {state.status === 'ready' && <GameDetails game={game} />}
      </div>

      <PortalFooter />
    </div>
  );
}

function GameDetails({ game }) {
  const [expanded, setExpanded] = useState(false);
  const [priceHistory, setPriceHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!game) return;
    let active = true;
    setLoadingHistory(true);
    setPriceHistory(null);
    setActiveTab('all');
    setExpanded(false);
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

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignora caso clipboard não esteja disponível
    }
  };

  const meta = [
    ['Publicadora', game.publisher],
    ['Desenvolvedora', game.developer],
    ['Lançamento', game.releaseTba || !game.releaseDate ? 'A anunciar' : dateFmt.format(game.releaseDate)],
    ['Gênero', game.category],
    ['Plataformas', game.platforms.join(' · ')],
    ['Classificação', game.ageRating ? (game.ageRating === 'L' ? 'Livre' : `${game.ageRating} anos`) : null],
    ['Store ID', game.id],
  ].filter(([, v]) => v);

  const hasHistoryChart = Boolean(priceHistory && priceHistory.history?.length > 1);
  const hasScreenshots = game.screenshots.length > 0;

  const tabs = [
    { id: 'all', label: 'Visão Completa', icon: Layers },
    ...(hasHistoryChart ? [{ id: 'prices', label: 'Histórico de Preços', icon: TrendingDown }] : []),
    ...(game.description || game.features.length ? [{ id: 'details', label: 'Sobre & Recursos', icon: Layers }] : []),
    ...(hasScreenshots ? [{ id: 'gallery', label: `Imagens (${game.screenshots.length})`, icon: ImageIcon }] : []),
  ];

  return (
    <>
      {/* Barra de Breadcrumb & Ações rápidas do Portal */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4 text-xs">
        <nav className="flex min-w-0 items-center gap-1.5 text-neutral-400" aria-label="Breadcrumb">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="font-medium transition hover:text-xbox-neon"
          >
            Portal Xbox
          </button>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
          {game.category && (
            <>
              <span className="truncate">{game.category}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
            </>
          )}
          <span className="truncate font-semibold text-white">{game.title}</span>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-white/[0.09] bg-[#141a16]/90 px-3 py-1 font-mono text-[11px] text-neutral-300 sm:inline-block">
            ID {game.id}
          </span>
          <button
            type="button"
            onClick={copyShareLink}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-[#141a16]/90 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-200 transition hover:border-xbox-neon/45 hover:text-white"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-xbox-neon" />
                <span className="text-xbox-neon">Link copiado</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>Compartilhar</span>
              </>
            )}
          </button>
          <a
            href={game.storeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-xbox-neon/40 bg-xbox-green/20 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-xbox-neon transition hover:bg-xbox-green hover:text-white"
          >
            <span>Microsoft Store</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Grid Largo 3-6-3 no Desktop */}
      <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start xl:gap-7">
        {/* Coluna Esquerda (3 cols): Capa + Nota + Ficha Técnica */}
        <aside className="order-2 min-w-0 space-y-5 lg:order-1 lg:col-span-3">
          <div className="mx-auto max-w-[260px] lg:max-w-none">
            <HoloTiltCover
              src={game.cover}
              alt={`Capa de ${game.title}`}
              isSquare={game.coverIsSquare}
            />

            {game.rating && (
              <div className="mt-3.5 flex items-center justify-between rounded-2xl border border-white/[0.09] bg-[#141a16]/90 px-4 py-3 text-sm text-white shadow-portal-card">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
                  <strong className="font-display text-base font-bold text-white">
                    {game.rating.average.toFixed(1)}
                  </strong>
                  <span className="text-xs text-neutral-400">/ 5.0</span>
                </div>
                <span className="font-mono text-[11px] text-neutral-400">
                  {new Intl.NumberFormat('pt-BR').format(game.rating.count)} avaliações
                </span>
              </div>
            )}
          </div>

          {meta.length > 0 && (
            <div className="rounded-2xl border border-white/[0.09] bg-[#141a16]/90 p-5 shadow-portal-card backdrop-blur-xl">
              <h3 className="mb-3.5 border-b border-white/[0.08] pb-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                Ficha Técnica
              </h3>
              <dl className="flex flex-col gap-3">
                {meta.map(([k, v]) => (
                  <div key={k} className="border-l-2 border-xbox-neon/70 pl-3">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      {k}
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-white">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </aside>

        {/* Coluna Central Principal (6 cols): Título, Preços, Abas de Informação */}
        <section className="order-3 min-w-0 lg:order-2 lg:col-span-6">
          {/* Tags de categoria e plataforma */}
          <div className="flex flex-wrap items-center gap-2">
            {game.category && (
              <span className="rounded-full border border-xbox-neon/35 bg-xbox-neon/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-xbox-neon">
                {game.category}
              </span>
            )}
            {game.platforms.map((pl) => (
              <span
                key={pl}
                className="rounded-full border border-white/[0.1] bg-[#141a16] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-200"
              >
                {pl}
              </span>
            ))}
          </div>

          <h1 className="mt-3.5 font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            {game.title}
          </h1>
          {game.publisher && (
            <p className="mt-1.5 text-base font-medium text-neutral-300/80 sm:text-lg">{game.publisher}</p>
          )}

          {/* Matriz de Preços & Histórico */}
          <div className="mt-6 flex flex-col gap-3">
            <PriceCardsGrid
              game={game}
              priceHistory={priceHistory}
              loadingHistory={loadingHistory}
            />

            {game.price?.list > 0 && <RewardsBadge price={game.price.list} />}
          </div>

          {/* Barra de opções de visualização de informações */}
          {tabs.length > 1 && (
            <div className="mt-7 inline-flex flex-wrap gap-1 rounded-full border border-white/[0.08] bg-[#121814] p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? 'bg-xbox-green text-white shadow-sm'
                        : 'text-neutral-300/75 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Conteúdo: Gráfico de Preços */}
          {(activeTab === 'all' || activeTab === 'prices') && hasHistoryChart && (
            <div id="price-chart-section" className="mt-6">
              <PriceHistoryChart data={priceHistory} />
            </div>
          )}

          {/* Conteúdo: Sobre & Recursos */}
          {(activeTab === 'all' || activeTab === 'details') && (
            <>
              {game.description && (
                <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#141a16]/85 p-5 shadow-portal-card backdrop-blur-xl">
                  <h2 className="border-b border-white/[0.08] pb-2.5 text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
                    Sobre o jogo
                  </h2>
                  <p
                    className={`mt-3.5 whitespace-pre-line text-sm leading-relaxed text-neutral-200/85 sm:text-base ${
                      expanded ? '' : 'line-clamp-6'
                    }`}
                  >
                    {game.description}
                  </p>
                  {game.description.length > 400 && (
                    <button
                      type="button"
                      onClick={() => setExpanded((v) => !v)}
                      className="mt-3 text-xs font-bold uppercase tracking-wider text-xbox-neon hover:underline"
                    >
                      {expanded ? 'Mostrar menos' : 'Ler descrição completa'}
                    </button>
                  )}
                </div>
              )}

              {game.features.length > 0 && (
                <div className="mt-5 rounded-2xl border border-white/[0.08] bg-[#141a16]/85 p-5 shadow-portal-card backdrop-blur-xl">
                  <h2 className="border-b border-white/[0.08] pb-2.5 text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
                    Capacidades e Recursos Xbox
                  </h2>
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    {game.features.map((f) => (
                      <span
                        key={f}
                        className="rounded-full border border-white/[0.09] bg-[#0d120f] px-3 py-1 text-xs font-medium text-neutral-200"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Quando aba 'gallery' selecionada, exibe galeria direto na área central também */}
          {activeTab === 'gallery' && hasScreenshots && (
            <div className="mt-6">
              <Screenshots shots={game.screenshots} columns={2} />
            </div>
          )}
        </section>

        {/* Coluna Lateral Direita (3 cols): Contador + Truque NZ + Atalhos */}
        <aside className="order-1 flex min-w-0 flex-col gap-5 lg:sticky lg:top-20 lg:order-3 lg:col-span-3">
          <ReleaseCountdown date={game.releaseDate} tba={game.releaseTba} />
          <NewZealandTrickCard gameId={game.id} brazilDate={game.releaseDate} tba={game.releaseTba} />

          <div className="rounded-2xl border border-white/[0.08] bg-[#141a16]/90 p-4 shadow-portal-card">
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
              Explorar no Portal
            </span>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => navigate(sectionPath('lancamentos'))}
                className="rounded-xl border border-white/[0.08] bg-[#0d120f] px-3 py-2.5 text-left text-xs font-semibold text-neutral-200 transition hover:border-xbox-neon/45 hover:text-white"
              >
                Lançamentos &rarr;
              </button>
              <button
                type="button"
                onClick={() => navigate(sectionPath('gamepass'))}
                className="rounded-xl border border-white/[0.08] bg-[#0d120f] px-3 py-2.5 text-left text-xs font-semibold text-neutral-200 transition hover:border-xbox-neon/45 hover:text-xbox-neon"
              >
                Game Pass &rarr;
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Screenshots em largura total abaixo (quando em Visão Completa) */}
      {activeTab === 'all' && hasScreenshots && (
        <section className="mt-14 border-t border-white/[0.08] pt-8">
          <Screenshots shots={game.screenshots} columns={4} />
        </section>
      )}
    </>
  );
}

function Screenshots({ shots, columns = 4 }) {
  const gridCls =
    columns === 2
      ? 'mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2'
      : 'mt-3.5 grid grid-cols-2 gap-3.5 lg:grid-cols-4';

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
          Galeria de Imagens ({shots.length})
        </h2>
        <span className="font-mono text-[11px] text-neutral-500">Clique para ampliar em HD</span>
      </div>
      <div className={gridCls}>
        {shots.map((s, i) => (
          <a
            key={i}
            href={s.full}
            target="_blank"
            rel="noreferrer"
            className="group relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#141a16] shadow-portal-card transition hover:-translate-y-0.5 hover:border-xbox-neon/45"
          >
            <img
              src={s.thumb}
              alt={`Imagem ${i + 1}`}
              loading="lazy"
              className="aspect-video w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <span className="absolute bottom-2.5 right-2.5 rounded-full border border-white/15 bg-[#090d0a]/80 px-2.5 py-0.5 font-mono text-[10px] text-neutral-200 backdrop-blur-md">
              {String(i + 1).padStart(2, '0')}
            </span>
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
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
      {/* Botão 1: Preço Atual / Loja Xbox */}
      <a
        href={game.storeUrl}
        target="_blank"
        rel="noreferrer"
        className="group flex min-h-[104px] flex-col justify-between rounded-2xl border border-xbox-neon/45 bg-gradient-to-br from-[#107C10] to-[#16a34a] p-4 text-white shadow-xbox-cta transition hover:brightness-110"
        title="Abrir página oficial na loja Xbox"
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">
            Preço Atual
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-white/85 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>

        <div className="my-1.5 flex flex-wrap items-baseline gap-2">
          {discounted && (
            <span className="font-display text-xs text-white/75 line-through">
              {fmt.format(game.price.msrp)}
            </span>
          )}
          <span className="font-display text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl">
            {displayPrice}
          </span>
          {discountPercent && (
            <span className="rounded-lg bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-[#090d0a] shadow">
              -{discountPercent}%
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-white/90 group-hover:text-white">
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
        className="flex min-h-[104px] flex-col justify-between rounded-2xl border border-amber-400/25 bg-amber-500/[0.09] p-4 text-left text-amber-300 shadow-portal-card transition hover:border-amber-400/50 hover:bg-amber-500/[0.15]"
        title="Ver no gráfico de histórico de preços"
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
            ★ Menor Histórico
          </span>
          {isRecord && (
            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-200">
              Melhor Preço
            </span>
          )}
        </div>

        <div className="my-1.5 flex items-baseline gap-2">
          <span className="font-display text-xl font-extrabold leading-tight tracking-tight text-amber-300 sm:text-2xl">
            {loadingHistory && !priceHistory ? (
              <span className="inline-block h-6 w-24 animate-pulse rounded-lg bg-amber-400/20" />
            ) : priceHistory?.lowestPrice != null ? (
              formatPrice(priceHistory.lowestPrice)
            ) : (
              '—'
            )}
          </span>
        </div>

        <div className="truncate text-[11px] font-medium text-amber-300/80">
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
        className="flex min-h-[104px] flex-col justify-between rounded-2xl border border-white/[0.09] bg-[#141a16]/90 p-4 text-left text-white shadow-portal-card transition hover:border-white/25 hover:bg-[#1a221d]"
        title="Ver no gráfico de histórico de preços"
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Maior Registrado
          </span>
        </div>

        <div className="my-1.5 flex items-baseline gap-2">
          <span className="font-display text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl">
            {loadingHistory && !priceHistory ? (
              <span className="inline-block h-6 w-24 animate-pulse rounded-lg bg-white/10" />
            ) : priceHistory?.highestPrice != null ? (
              formatPrice(priceHistory.highestPrice)
            ) : (
              '—'
            )}
          </span>
        </div>

        <div className="truncate text-[11px] font-medium text-neutral-400">
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
      className="group inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-1.5 text-xs text-amber-200 transition hover:border-amber-400/45 hover:bg-amber-400/15"
      title="Calcular pontos necessários para resgatar cartões de presente Xbox no Microsoft Rewards"
    >
      <img
        src="https://rewards.bing.com/rewardscdn/images/rewards.png"
        alt="Microsoft Rewards"
        className="h-4 w-4 shrink-0 object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <span>
        Em torno de{' '}
        <strong className="font-display text-sm font-bold text-amber-300">
          {formatarPontosRewards(pontos)}
        </strong>{' '}
        pontos no Microsoft Rewards
      </span>
      <ExternalLink className="h-3 w-3 text-amber-300/70 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </a>
  );
}

function Skeleton() {
  return (
    <div className="mt-8 grid animate-pulse grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-3">
        <div className="aspect-[2/3] w-full rounded-2xl bg-[#141a16]" />
        <div className="h-48 w-full rounded-2xl bg-[#141a16]" />
      </div>
      <div className="space-y-4 lg:col-span-6">
        <div className="h-6 w-28 rounded-full bg-[#141a16]" />
        <div className="h-12 w-3/4 rounded-2xl bg-[#141a16]" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="h-24 rounded-2xl bg-[#141a16]" />
          <div className="h-24 rounded-2xl bg-[#141a16]" />
          <div className="h-24 rounded-2xl bg-[#141a16]" />
        </div>
        <div className="h-64 rounded-2xl bg-[#141a16]" />
      </div>
      <div className="space-y-4 lg:col-span-3">
        <div className="h-48 w-full rounded-2xl bg-[#141a16]" />
        <div className="h-40 w-full rounded-2xl bg-[#141a16]" />
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="mx-auto mt-20 max-w-lg rounded-3xl border border-white/[0.09] bg-[#141a16]/90 p-8 text-center shadow-portal-card">
      <AlertTriangle className="mx-auto h-10 w-10 text-amber-400" />
      <h2 className="mt-4 font-display text-2xl font-bold text-white">Não foi possível carregar o jogo</h2>
      <p className="mt-2 text-sm text-neutral-300/80">{message}</p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 rounded-full bg-xbox-green px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xbox-cta transition hover:brightness-110"
        >
          <RotateCw className="h-4 w-4" /> Tentar novamente
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-200 transition hover:bg-white/5"
        >
          Voltar ao Portal
        </button>
      </div>
    </div>
  );
}
