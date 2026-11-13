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
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-xbox-bg text-slate-100">
      {/* Arte de fundo */}
      {game?.hero && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[72vh] overflow-hidden">
          <img src={game.hero} alt="" className="h-full w-full object-cover opacity-35 animate-fade-in" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07090d]/45 via-[#07090d]/85 to-[#07090d]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07090d] via-transparent to-[#07090d]/70" />
        </div>
      )}

      <PortalHeader showSearch isGamePage />

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-4 pb-16 pt-5 sm:px-6 lg:px-10">
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5 text-xs">
        <nav className="flex min-w-0 items-center gap-1.5 font-sans text-white/50" aria-label="Breadcrumb">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="transition hover:text-xbox-neon"
          >
            Portal Xbox
          </button>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/25" />
          {game.category && (
            <>
              <span className="truncate">{game.category}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/25" />
            </>
          )}
          <span className="truncate font-medium text-white/90">{game.title}</span>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-[2px] border border-white/10 bg-[#0d1218] px-2 py-1 font-mono text-[11px] text-white/50 sm:inline-block">
            ID {game.id}
          </span>
          <button
            type="button"
            onClick={copyShareLink}
            className="inline-flex items-center gap-1.5 rounded-[2px] border border-white/12 bg-[#0d1218] px-2.5 py-1 font-action text-[11px] font-bold uppercase tracking-wider text-white/75 transition hover:border-xbox-neon/50 hover:text-white"
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
            className="inline-flex items-center gap-1.5 rounded-[2px] border border-xbox-green/50 bg-xbox-green/20 px-2.5 py-1 font-action text-[11px] font-bold uppercase tracking-wider text-xbox-neon transition hover:bg-xbox-green hover:text-white"
          >
            <span>Microsoft Store</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Grid Largo 3-6-3 no Desktop */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start xl:gap-7">
        {/* Coluna Esquerda (3 cols): Capa + Nota + Ficha Técnica */}
        <aside className="order-2 min-w-0 space-y-5 lg:order-1 lg:col-span-3">
          <div className="mx-auto max-w-[260px] lg:max-w-none">
            <HoloTiltCover
              src={game.cover}
              alt={`Capa de ${game.title}`}
              isSquare={game.coverIsSquare}
            />

            {game.rating && (
              <div className="mt-3 flex items-center justify-between rounded-[2px] border border-white/12 bg-[#0d1218] px-3.5 py-2.5 text-sm text-white/90">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 shrink-0 fill-yellow-400 text-yellow-400" />
                  <strong className="font-display text-base font-bold text-white">
                    {game.rating.average.toFixed(1)}
                  </strong>
                  <span className="text-xs text-white/40">/ 5.0</span>
                </div>
                <span className="font-mono text-[11px] text-white/50">
                  {new Intl.NumberFormat('pt-BR').format(game.rating.count)} avaliações
                </span>
              </div>
            )}
          </div>

          {meta.length > 0 && (
            <div className="rounded-[2px] border border-white/12 bg-[#0c1118]/90 p-4 sm:p-5">
              <h3 className="mb-3.5 border-b border-white/10 pb-2.5 font-action text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
                Ficha Técnica
              </h3>
              <dl className="flex flex-col gap-3">
                {meta.map(([k, v]) => (
                  <div key={k} className="border-l-2 border-xbox-green/70 pl-3">
                    <dt className="font-action text-[10px] font-bold uppercase tracking-wider text-white/40">
                      {k}
                    </dt>
                    <dd className="mt-0.5 font-sans text-sm font-medium text-white/90">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </aside>

        {/* Coluna Central Principal (6 cols): Título, Preços, Abas de Informação */}
        <section className="order-3 min-w-0 lg:order-2 lg:col-span-6">
          {/* Tags de categoria e plataforma */}
          <div className="flex flex-wrap items-center gap-1.5">
            {game.category && (
              <span className="rounded-[2px] border border-xbox-neon/40 bg-xbox-green/15 px-2.5 py-0.5 font-action text-[10px] font-bold uppercase tracking-wider text-xbox-neon">
                {game.category}
              </span>
            )}
            {game.platforms.map((pl) => (
              <span
                key={pl}
                className="rounded-[2px] border border-white/12 bg-[#0e131a] px-2.5 py-0.5 font-action text-[10px] font-bold uppercase tracking-wider text-white/75"
              >
                {pl}
              </span>
            ))}
          </div>

          <h1 className="mt-3 font-title text-3xl font-light leading-tight tracking-tight text-white sm:text-5xl">
            {game.title}
          </h1>
          {game.publisher && (
            <p className="mt-1.5 font-sans text-base text-white/60 sm:text-lg">{game.publisher}</p>
          )}

          {/* Matriz de Preços & Histórico */}
          <div className="mt-5 flex flex-col gap-3">
            <PriceCardsGrid
              game={game}
              priceHistory={priceHistory}
              loadingHistory={loadingHistory}
            />

            {game.price?.list > 0 && <RewardsBadge price={game.price.list} />}
          </div>

          {/* Barra de opções de visualização de informações */}
          {tabs.length > 1 && (
            <div className="mt-7 flex flex-wrap gap-1.5 border-b border-white/10 pb-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 rounded-[2px] border px-3 py-1.5 font-action text-[11px] font-bold uppercase tracking-wider transition ${
                      isActive
                        ? 'border-xbox-neon/60 bg-xbox-green/25 text-white'
                        : 'border-white/10 bg-[#0d1218] text-white/55 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-xbox-neon' : 'text-white/40'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Conteúdo: Gráfico de Preços */}
          {(activeTab === 'all' || activeTab === 'prices') && hasHistoryChart && (
            <div id="price-chart-section" className="mt-5">
              <PriceHistoryChart data={priceHistory} />
            </div>
          )}

          {/* Conteúdo: Sobre & Recursos */}
          {(activeTab === 'all' || activeTab === 'details') && (
            <>
              {game.description && (
                <div className="mt-6 rounded-[2px] border border-white/10 bg-[#0c1118]/80 p-5">
                  <h2 className="border-b border-white/10 pb-2.5 font-action text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                    Sobre o jogo
                  </h2>
                  <p
                    className={`mt-3.5 whitespace-pre-line font-sans text-sm leading-relaxed text-white/75 sm:text-base ${
                      expanded ? '' : 'line-clamp-6'
                    }`}
                  >
                    {game.description}
                  </p>
                  {game.description.length > 400 && (
                    <button
                      type="button"
                      onClick={() => setExpanded((v) => !v)}
                      className="mt-3 font-action text-xs font-bold uppercase tracking-wider text-xbox-neon hover:underline"
                    >
                      {expanded ? 'Mostrar menos' : 'Ler descrição completa'}
                    </button>
                  )}
                </div>
              )}

              {game.features.length > 0 && (
                <div className="mt-5 rounded-[2px] border border-white/10 bg-[#0c1118]/80 p-5">
                  <h2 className="border-b border-white/10 pb-2.5 font-action text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                    Capacidades e Recursos Xbox
                  </h2>
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    {game.features.map((f) => (
                      <span
                        key={f}
                        className="rounded-[2px] border border-white/10 bg-[#121822] px-2.5 py-1 font-sans text-xs text-white/80"
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
            <div className="mt-5">
              <Screenshots shots={game.screenshots} columns={2} />
            </div>
          )}
        </section>

        {/* Coluna Lateral Direita (3 cols): Contador + Truque NZ + Atalhos */}
        <aside className="order-1 flex min-w-0 flex-col gap-5 lg:sticky lg:top-20 lg:order-3 lg:col-span-3">
          <ReleaseCountdown date={game.releaseDate} tba={game.releaseTba} />
          <NewZealandTrickCard gameId={game.id} brazilDate={game.releaseDate} tba={game.releaseTba} />

          <div className="rounded-[2px] border border-white/10 bg-[#0c1118]/90 p-4">
            <span className="block font-action text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              Explorar no Portal
            </span>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => navigate(sectionPath('lancamentos'))}
                className="rounded-[2px] border border-white/10 bg-white/[0.03] px-2.5 py-2 text-left font-action text-[11px] font-bold uppercase tracking-wider text-white/75 transition hover:border-xbox-neon/40 hover:text-white"
              >
                Lançamentos &rarr;
              </button>
              <button
                type="button"
                onClick={() => navigate(sectionPath('gamepass'))}
                className="rounded-[2px] border border-white/10 bg-white/[0.03] px-2.5 py-2 text-left font-action text-[11px] font-bold uppercase tracking-wider text-white/75 transition hover:border-xbox-neon/40 hover:text-white"
              >
                Game Pass &rarr;
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Screenshots em largura total abaixo (quando em Visão Completa) */}
      {activeTab === 'all' && hasScreenshots && (
        <section className="mt-12 border-t border-white/10 pt-8">
          <Screenshots shots={game.screenshots} columns={4} />
        </section>
      )}
    </>
  );
}

function Screenshots({ shots, columns = 4 }) {
  const gridCls =
    columns === 2
      ? 'mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2'
      : 'mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4';

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="font-action text-xs font-bold uppercase tracking-[0.2em] text-white/60">
          Galeria de Imagens ({shots.length})
        </h2>
        <span className="font-mono text-[11px] text-white/35">Clique para ampliar em HD</span>
      </div>
      <div className={gridCls}>
        {shots.map((s, i) => (
          <a
            key={i}
            href={s.full}
            target="_blank"
            rel="noreferrer"
            className="group relative overflow-hidden rounded-[2px] border border-white/12 bg-[#0c1118] transition hover:border-xbox-neon/60"
          >
            <img
              src={s.thumb}
              alt={`Imagem ${i + 1}`}
              loading="lazy"
              className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
            <span className="absolute bottom-2 right-2 rounded-[2px] border border-white/15 bg-black/75 px-1.5 py-0.5 font-mono text-[10px] text-white/70">
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
        className="group flex min-h-[96px] flex-col justify-between rounded-[2px] border border-xbox-bright/50 bg-xbox-green p-3.5 text-white shadow-lg transition hover:bg-xbox-bright hover:shadow-xbox-glow sm:p-4"
        title="Abrir página oficial na loja Xbox"
      >
        <div className="flex items-center justify-between gap-1">
          <span className="font-action text-[11px] font-bold uppercase tracking-wider text-white/90">
            Preço Atual
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-white/80 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>

        <div className="my-1 flex flex-wrap items-baseline gap-2">
          {discounted && (
            <span className="font-display text-xs text-white/70 line-through">
              {fmt.format(game.price.msrp)}
            </span>
          )}
          <span className="font-display text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl">
            {displayPrice}
          </span>
          {discountPercent && (
            <span className="rounded-[2px] bg-black/30 px-1.5 py-0.5 font-action text-[10px] font-bold text-white">
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
        className="flex min-h-[96px] flex-col justify-between rounded-[2px] border border-yellow-500/35 border-t-2 border-t-yellow-400 bg-yellow-500/10 p-3.5 text-left text-yellow-300 transition hover:border-yellow-500/55 hover:bg-yellow-500/15 sm:p-4"
        title="Ver no gráfico de histórico de preços"
      >
        <div className="flex items-center justify-between gap-1">
          <span className="font-action text-[11px] font-bold uppercase tracking-wider text-yellow-400">
            ★ Menor Histórico
          </span>
          {isRecord && (
            <span className="rounded-[2px] bg-yellow-400/20 px-1.5 py-0.5 font-action text-[9px] font-bold uppercase text-yellow-300">
              Melhor Preço
            </span>
          )}
        </div>

        <div className="my-1 flex items-baseline gap-2">
          <span className="font-display text-xl font-bold leading-tight tracking-tight text-yellow-300 sm:text-2xl">
            {loadingHistory && !priceHistory ? (
              <span className="inline-block h-6 w-24 animate-pulse rounded-[2px] bg-yellow-400/20" />
            ) : priceHistory?.lowestPrice != null ? (
              formatPrice(priceHistory.lowestPrice)
            ) : (
              '—'
            )}
          </span>
        </div>

        <div className="truncate font-action text-[10px] font-medium text-yellow-400/80">
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
        className="flex min-h-[96px] flex-col justify-between rounded-[2px] border border-white/12 bg-[#0d1218] p-3.5 text-left text-white transition hover:border-white/25 hover:bg-[#121821] sm:p-4"
        title="Ver no gráfico de histórico de preços"
      >
        <div className="flex items-center justify-between gap-1">
          <span className="font-action text-[11px] font-bold uppercase tracking-wider text-white/50">
            Maior Registrado
          </span>
        </div>

        <div className="my-1 flex items-baseline gap-2">
          <span className="font-display text-xl font-bold leading-tight tracking-tight text-white/85 sm:text-2xl">
            {loadingHistory && !priceHistory ? (
              <span className="inline-block h-6 w-24 animate-pulse rounded-[2px] bg-white/10" />
            ) : priceHistory?.highestPrice != null ? (
              formatPrice(priceHistory.highestPrice)
            ) : (
              '—'
            )}
          </span>
        </div>

        <div className="truncate font-action text-[10px] font-medium text-white/40">
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
      className="group inline-flex w-fit items-center gap-2 rounded-[2px] border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-200 transition hover:border-amber-400/45 hover:bg-amber-400/15"
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
      <span className="font-sans">
        Em torno de{' '}
        <strong className="font-display text-sm font-bold text-amber-300">
          {formatarPontosRewards(pontos)}
        </strong>{' '}
        pontos no Microsoft Rewards
      </span>
      <ExternalLink className="h-3 w-3 text-amber-300/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </a>
  );
}

function Skeleton() {
  return (
    <div className="mt-8 grid animate-pulse grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-3">
        <div className="aspect-[2/3] w-full rounded-[2px] bg-white/5" />
        <div className="h-48 w-full rounded-[2px] bg-white/5" />
      </div>
      <div className="space-y-4 lg:col-span-6">
        <div className="h-5 w-28 rounded-[2px] bg-white/5" />
        <div className="h-12 w-3/4 rounded-[2px] bg-white/5" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="h-24 rounded-[2px] bg-white/5" />
          <div className="h-24 rounded-[2px] bg-white/5" />
          <div className="h-24 rounded-[2px] bg-white/5" />
        </div>
        <div className="h-64 rounded-[2px] bg-white/5" />
      </div>
      <div className="space-y-4 lg:col-span-3">
        <div className="h-48 w-full rounded-[2px] bg-white/5" />
        <div className="h-40 w-full rounded-[2px] bg-white/5" />
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="mx-auto mt-20 max-w-lg rounded-[2px] border border-white/12 bg-[#0d1218] p-8 text-center">
      <AlertTriangle className="mx-auto h-10 w-10 text-yellow-400" />
      <h2 className="mt-4 font-title text-2xl font-light text-white">Não foi possível carregar o jogo</h2>
      <p className="mt-2 font-sans text-sm text-white/60">{message}</p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 rounded-[2px] bg-xbox-green px-4 py-2.5 font-action text-xs font-bold uppercase tracking-wider text-white transition hover:bg-xbox-bright"
        >
          <RotateCw className="h-4 w-4" /> Tentar novamente
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-[2px] border border-white/15 px-4 py-2.5 font-action text-xs font-bold uppercase tracking-wider text-white/80 transition hover:bg-white/5"
        >
          Voltar ao Portal
        </button>
      </div>
    </div>
  );
}
