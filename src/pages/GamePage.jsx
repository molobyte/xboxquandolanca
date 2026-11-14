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
import HoloTiltCover from '../components/HoloTiltCover.jsx';
import { calcularPontosRewards, formatarPontosRewards } from '../lib/rewards.js';
import { getPriceHistory, formatPrice } from '../lib/priceHistory.js';
import PriceHistoryChart from '../components/PriceHistoryChart.jsx';
import RewardsCashbackCard from '../components/RewardsCashbackCard.jsx';

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
      {/* Atmosfera sutil + Arte de fundo suavizada (sem filtro blur de 200px para preservar VRAM no iOS Safari) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -left-32 top-0 h-[36rem] w-[36rem] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16, 124, 16, 0.14) 0%, rgba(16, 124, 16, 0) 70%)',
          }}
        />
        <div
          className="absolute right-0 top-1/3 h-[30rem] w-[30rem] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0) 70%)',
          }}
        />
      </div>

      {game?.hero && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[68vh] overflow-hidden">
          <img
            src={game.hero}
            alt=""
            className="h-full w-full scale-105 object-cover opacity-25 blur-[2px] animate-fade-in"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#080a09]/55 via-[#080a09]/85 to-[#080a09]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080a09] via-transparent to-[#080a09]/85" />
        </div>
      )}

      <PortalHeader isGamePage />

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-[1480px] flex-1 px-3.5 pb-16 pt-3.5 sm:px-6 sm:pb-20 sm:pt-5 lg:px-10">
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
      {/* Barra de Breadcrumb & Ações rápidas minimalista */}
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-3 text-[11px] sm:flex-wrap sm:gap-3 sm:pb-3.5 sm:text-xs">
        <nav className="flex min-w-0 flex-1 items-center gap-1 text-white/45 sm:gap-1.5" aria-label="Breadcrumb">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="shrink-0 font-medium text-white/60 transition hover:text-white"
          >
            Portal Xbox
          </button>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/25" />
          {game.category && (
            <>
              <span className="hidden truncate sm:inline">{game.category}</span>
              <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-white/25 sm:inline" />
            </>
          )}
          <span className="truncate font-medium text-white/90">{game.title}</span>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={copyShareLink}
            className="liquid-glass-subtle inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium text-white/75 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white sm:gap-1.5 sm:px-3.5 sm:py-1.5 sm:text-[11px]"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-xbox-neon sm:h-3.5 sm:w-3.5" />
                <span className="text-white">Copiado</span>
              </>
            ) : (
              <>
                <Share2 className="h-3 w-3 text-white/55 sm:h-3.5 sm:w-3.5" />
                <span>Compartilhar</span>
              </>
            )}
          </button>
          <a
            href={game.storeUrl}
            target="_blank"
            rel="noreferrer"
            className="liquid-glass-subtle inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white sm:gap-1.5 sm:px-3.5 sm:py-1.5 sm:text-[11px]"
          >
            <span className="sm:hidden">Loja</span>
            <span className="hidden sm:inline">Microsoft Store</span>
            <ExternalLink className="h-3 w-3 text-white/50" />
          </a>
        </div>
      </div>

      {/* Grid Largo 3-6-3 no Desktop / Fluxo Adaptado no Mobile */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-5 lg:mt-7 lg:grid-cols-12 lg:items-start lg:gap-6 xl:gap-8">
        {/* Coluna Esquerda (3 cols no Desktop): Capa + Painel Unificado (Nota + Ficha Técnica) */}
        <aside className="contents lg:order-1 lg:col-span-3 lg:block lg:min-w-0 lg:space-y-4">
          <div className="hidden lg:block">
            <HoloTiltCover
              src={game.cover}
              alt={`Capa de ${game.title}`}
              isSquare={game.coverIsSquare}
            />
          </div>

          {(game.rating || meta.length > 0) && (
            <div
              className={`liquid-glass order-5 min-w-0 rounded-2xl p-3.5 sm:p-5 lg:order-none ${
                meta.length === 0 ? 'hidden lg:block' : ''
              }`}
            >
              {game.rating && (
                <div
                  className={`hidden items-center justify-between lg:flex ${
                    meta.length > 0 ? 'mb-4 border-b border-white/[0.06] pb-3.5' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 shrink-0 fill-amber-400/90 text-amber-400/90" />
                    <strong className="font-display text-base font-bold text-white">
                      {game.rating.average.toFixed(1)}
                    </strong>
                    <span className="text-xs text-white/40">/ 5.0</span>
                  </div>
                  <span className="text-[11px] text-white/45">
                    {new Intl.NumberFormat('pt-BR').format(game.rating.count)} avaliações
                  </span>
                </div>
              )}

              {meta.length > 0 && (
                <>
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40 sm:mb-2.5">
                    Ficha Técnica
                  </h3>
                  <dl className="divide-y divide-white/[0.05]">
                    {meta.map(([k, v]) => (
                      <div key={k} className="flex items-baseline justify-between gap-3 py-1.5 first:pt-0.5 last:pb-0 sm:py-2 sm:first:pt-1">
                        <dt className="shrink-0 text-[11px] text-white/45">{k}</dt>
                        <dd
                          className={`truncate text-right text-xs font-medium text-white/90 ${
                            k === 'Store ID' ? 'font-mono text-[11px] text-white/60' : ''
                          }`}
                          title={String(v)}
                        >
                          {v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}
            </div>
          )}
        </aside>

        {/* Coluna Central Principal (6 cols no Desktop): Identidade, Preços Compactos, Abas de Informação */}
        <section className="contents lg:order-2 lg:col-span-6 lg:block lg:min-w-0">
          {/* Bloco 1 no Mobile: Capa 3D ao lado do Título, Publicadora, Plataformas e Nota */}
          <div className="order-1 flex min-w-0 items-start gap-3.5 sm:gap-5 lg:order-none lg:block">
            <div className="w-[100px] shrink-0 sm:w-[132px] lg:hidden">
              <HoloTiltCover
                src={game.cover}
                alt={`Capa de ${game.title}`}
                isSquare={game.coverIsSquare}
              />
            </div>

            <div className="min-w-0 flex-1">
              {/* Tags discretas de categoria e plataforma */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                {game.category && (
                  <span className="liquid-glass-subtle rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white/75 sm:px-2.5 sm:text-[10px]">
                    {game.category}
                  </span>
                )}
                {game.platforms.map((pl) => (
                  <span
                    key={pl}
                    className="liquid-glass-subtle rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white/55 sm:px-2.5 sm:text-[10px]"
                  >
                    {pl}
                  </span>
                ))}
              </div>

              <h1 className="mt-2 font-display text-xl font-bold leading-[1.14] tracking-tight text-white sm:text-3xl lg:mt-3 lg:text-4xl xl:text-[42px]">
                {game.title}
              </h1>
              {game.publisher && (
                <p className="mt-0.5 text-xs font-medium text-white/50 sm:mt-1 sm:text-base">{game.publisher}</p>
              )}

              {game.rating && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[11px] lg:hidden">
                  <Star className="h-3 w-3 shrink-0 fill-amber-400/90 text-amber-400/90" />
                  <strong className="font-display font-bold text-white">
                    {game.rating.average.toFixed(1)}
                  </strong>
                  <span className="text-[10px] text-white/40">/ 5.0</span>
                  <span className="text-white/25">·</span>
                  <span className="text-[10px] text-white/50">
                    {new Intl.NumberFormat('pt-BR').format(game.rating.count)} avaliações
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Barra Compacta Liquid Glass de Preços & Rewards (Bloco 3 no Mobile, logo após Contagem/NZ) */}
          <div className="order-3 min-w-0 lg:order-none lg:mt-5">
            <PriceCardsGrid
              game={game}
              priceHistory={priceHistory}
              loadingHistory={loadingHistory}
            />
          </div>

          {/* Bloco 4 no Mobile: Abas + Gráfico + Cashback + Sobre o Jogo */}
          <div className="order-4 min-w-0 lg:order-none">
            {/* Controle Segmentado estilo Apple Liquid Glass */}
            {tabs.length > 1 && (
              <div className="liquid-pill-bar no-scrollbar mt-1 flex w-full items-center gap-1 overflow-x-auto rounded-full p-1 sm:mt-2 lg:mt-6 lg:inline-flex lg:w-auto lg:flex-wrap">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium transition sm:px-3.5 sm:text-xs ${
                        isActive
                          ? 'bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                          : 'text-white/55 hover:bg-white/[0.04] hover:text-white/85'
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
              <div id="price-chart-section" className="mt-4 sm:mt-5">
                <PriceHistoryChart data={priceHistory} />
              </div>
            )}

            {/* Conteúdo: Cashback Microsoft Rewards (imediatamente abaixo do Histórico de Preços) */}
            {(activeTab === 'all' || activeTab === 'prices') && game.price && (
              <div id="rewards-cashback-section" className="mt-4 sm:mt-5">
                <RewardsCashbackCard price={game.price} inGamePass={game.inGamePass} />
              </div>
            )}

            {/* Conteúdo: Sobre & Recursos unificados em um único painel clean */}
            {(activeTab === 'all' || activeTab === 'details') &&
              (game.description || game.features.length > 0) && (
                <div className="liquid-glass mt-4 rounded-2xl p-4 sm:mt-5 sm:p-6">
                  {game.description && (
                    <div>
                      <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45 sm:text-[11px]">
                        Sobre o jogo
                      </h2>
                      <p
                        className={`mt-2.5 whitespace-pre-line text-xs leading-relaxed text-white/75 sm:mt-3 sm:text-sm ${
                          expanded ? '' : 'line-clamp-5'
                        }`}
                      >
                        {game.description}
                      </p>
                      {game.description.length > 400 && (
                        <button
                          type="button"
                          onClick={() => setExpanded((v) => !v)}
                          className="mt-2 text-xs font-semibold text-white/70 transition hover:text-white sm:mt-2.5"
                        >
                          {expanded ? 'Mostrar menos ↑' : 'Ler descrição completa ↓'}
                        </button>
                      )}
                    </div>
                  )}

                  {game.features.length > 0 && (
                    <div className={game.description ? 'mt-4 border-t border-white/[0.06] pt-4 sm:mt-5 sm:pt-5' : ''}>
                      <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45 sm:text-[11px]">
                        Recursos e capacidades
                      </h2>
                      <div className="mt-2.5 flex flex-wrap gap-1.5 sm:mt-3">
                        {game.features.map((f) => (
                          <span
                            key={f}
                            className="liquid-glass-subtle rounded-full px-2.5 py-1 text-[11px] text-white/75 sm:px-3 sm:text-xs"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* Quando aba 'gallery' selecionada, exibe galeria direto na área central */}
            {activeTab === 'gallery' && hasScreenshots && (
              <div className="mt-4 sm:mt-5">
                <Screenshots shots={game.screenshots} columns={2} />
              </div>
            )}
          </div>
        </section>

        {/* Coluna Lateral Direita (3 cols no Desktop): Contador + Truque NZ unificados + Atalhos */}
        <aside className="contents lg:sticky lg:top-20 lg:order-3 lg:col-span-3 lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
          {/* Bloco 2 no Mobile: Contagem Regressiva + Truque da Nova Zelândia em um único container */}
          <div className="order-2 min-w-0 lg:order-none">
            <ReleaseCountdown gameId={game.id} date={game.releaseDate} tba={game.releaseTba} />
          </div>

          <div className="liquid-glass order-6 min-w-0 rounded-2xl p-3.5 sm:p-4 lg:order-none">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Explorar no Portal
            </span>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => navigate(sectionPath('lancamentos'))}
                className="liquid-glass-subtle rounded-xl px-3 py-2 text-left text-xs font-medium text-white/75 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              >
                Lançamentos &rarr;
              </button>
              <button
                type="button"
                onClick={() => navigate(sectionPath('gamepass'))}
                className="liquid-glass-subtle rounded-xl px-3 py-2 text-left text-xs font-medium text-white/75 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              >
                Game Pass &rarr;
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Screenshots em largura total abaixo (quando em Visão Completa) */}
      {activeTab === 'all' && hasScreenshots && (
        <section className="mt-8 border-t border-white/[0.06] pt-6 lg:mt-14 lg:pt-8">
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
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
          Galeria de Imagens ({shots.length})
        </h2>
        <span className="text-[11px] text-white/35">Clique para ampliar</span>
      </div>
      <div className={gridCls}>
        {shots.map((s, i) => (
          <a
            key={i}
            href={s.full}
            target="_blank"
            rel="noreferrer"
            className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] transition duration-300 hover:-translate-y-0.5 hover:border-white/20"
          >
            <img
              src={s.thumb}
              alt={`Imagem ${i + 1}`}
              loading="lazy"
              className="aspect-video w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <span className="absolute bottom-2.5 right-2.5 rounded-full border border-white/10 bg-black/55 px-2 py-0.5 font-mono text-[10px] text-white/75 backdrop-blur-md">
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

  const pontosRewards = game.price?.list > 0 ? calcularPontosRewards(game.price.list) : null;

  return (
    <div className="liquid-glass overflow-hidden rounded-2xl">
      <div className="grid w-full grid-cols-3 divide-x divide-white/[0.06]">
        {/* Item 1: Preço Atual (único com destaque sutil em verde Xbox) */}
        <a
          href={game.storeUrl}
          target="_blank"
          rel="noreferrer"
          className="group relative flex min-w-0 flex-col justify-center bg-gradient-to-br from-xbox-green/[0.26] via-xbox-green/[0.1] to-transparent px-2.5 py-2.5 transition hover:from-xbox-green/[0.36] hover:via-xbox-green/[0.16] sm:px-4 sm:py-3.5"
          title="Abrir página oficial na loja Xbox"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="flex items-center gap-1 truncate text-[9px] font-semibold uppercase tracking-[0.06em] text-xbox-neon sm:gap-1.5 sm:text-[10px] sm:tracking-[0.12em]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-xbox-neon" />
              <span className="truncate">Preço atual</span>
            </span>
            <ExternalLink className="h-2.5 w-2.5 shrink-0 text-white/45 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white/80 sm:h-3 sm:w-3" />
          </div>

          <div className="mt-1 flex flex-wrap items-baseline gap-1 sm:gap-1.5">
            {discounted && (
              <span className="text-[10px] text-white/45 line-through sm:text-[11px]">
                {fmt.format(game.price.msrp)}
              </span>
            )}
            <span className="font-display text-sm font-bold tracking-tight text-white sm:text-xl">
              {displayPrice}
            </span>
            {discountPercent && (
              <span className="rounded-md bg-xbox-neon/20 px-1 py-0.5 text-[9px] font-bold text-xbox-neon sm:px-1.5 sm:text-[10px]">
                -{discountPercent}%
              </span>
            )}
          </div>
        </a>

        {/* Item 2: Menor Histórico */}
        <button
          type="button"
          onClick={() => {
            document.getElementById('price-chart-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex min-w-0 flex-col justify-center px-2.5 py-2.5 text-left transition hover:bg-white/[0.03] sm:px-4 sm:py-3.5"
          title="Ver no gráfico de histórico de preços"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-[9px] font-medium uppercase tracking-[0.06em] text-white/45 sm:text-[10px] sm:tracking-[0.12em]">
              Menor histórico
            </span>
            {isRecord && (
              <span className="hidden rounded-full border border-white/15 bg-white/[0.06] px-1.5 py-0.2 text-[9px] font-medium text-white/75 sm:inline-block">
                Menor preço
              </span>
            )}
          </div>

          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-display text-sm font-semibold tracking-tight text-white/95 sm:text-xl">
              {loadingHistory && !priceHistory ? (
                <span className="inline-block h-4 w-14 animate-pulse rounded bg-white/10 sm:h-5 sm:w-20" />
              ) : priceHistory?.lowestPrice != null ? (
                formatPrice(priceHistory.lowestPrice)
              ) : (
                '—'
              )}
            </span>
          </div>
        </button>

        {/* Item 3: Maior Registrado */}
        <button
          type="button"
          onClick={() => {
            document.getElementById('price-chart-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex min-w-0 flex-col justify-center px-2.5 py-2.5 text-left transition hover:bg-white/[0.03] sm:px-4 sm:py-3.5"
          title="Ver no gráfico de histórico de preços"
        >
          <span className="truncate text-[9px] font-medium uppercase tracking-[0.06em] text-white/45 sm:text-[10px] sm:tracking-[0.12em]">
            Maior registrado
          </span>

          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-display text-sm font-semibold tracking-tight text-white/75 sm:text-xl">
              {loadingHistory && !priceHistory ? (
                <span className="inline-block h-4 w-14 animate-pulse rounded bg-white/10 sm:h-5 sm:w-20" />
              ) : priceHistory?.highestPrice != null ? (
                formatPrice(priceHistory.highestPrice)
              ) : (
                '—'
              )}
            </span>
          </div>
        </button>
      </div>

      {/* Faixa integrada e discreta do Microsoft Rewards */}
      {pontosRewards && (
        <a
          href="https://rewards.bing.com"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center justify-between gap-2 border-t border-white/[0.06] bg-white/[0.015] px-3 py-2 text-[10px] text-white/50 transition hover:bg-white/[0.035] hover:text-white/75 sm:px-4 sm:text-[11px]"
          title="Calcular pontos necessários para resgatar cartões de presente Xbox no Microsoft Rewards"
        >
          <span className="flex min-w-0 items-center gap-2">
            <img
              src="https://rewards.bing.com/rewardscdn/images/rewards.png"
              alt=""
              className="h-3.5 w-3.5 shrink-0 object-contain opacity-75"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="leading-snug">
              Custa em torno de{' '}
              <strong className="font-semibold text-white/85">
                {formatarPontosRewards(pontosRewards)}
              </strong>{' '}
              pontos de Microsoft Rewards para adquirir esse jogo
            </span>
          </span>
          <ExternalLink className="h-3 w-3 shrink-0 text-white/35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white/70" />
        </a>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mt-5 grid animate-pulse grid-cols-1 gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-12">
      {/* Skeleton Mobile Header */}
      <div className="flex items-start gap-3.5 lg:hidden">
        <div className="aspect-[2/3] w-[100px] shrink-0 rounded-2xl bg-white/[0.04] sm:w-[132px]" />
        <div className="flex-1 space-y-2.5 pt-1">
          <div className="h-4 w-24 rounded-full bg-white/[0.04]" />
          <div className="h-7 w-4/5 rounded-xl bg-white/[0.04]" />
          <div className="h-4 w-1/2 rounded-lg bg-white/[0.04]" />
        </div>
      </div>
      <div className="hidden space-y-4 lg:col-span-3 lg:block">
        <div className="aspect-[2/3] w-full rounded-2xl bg-white/[0.04]" />
        <div className="h-48 w-full rounded-2xl bg-white/[0.04]" />
      </div>
      <div className="space-y-4 lg:col-span-6">
        <div className="hidden h-5 w-28 rounded-full bg-white/[0.04] lg:block" />
        <div className="hidden h-11 w-3/4 rounded-2xl bg-white/[0.04] lg:block" />
        <div className="h-20 rounded-2xl bg-white/[0.04]" />
        <div className="h-56 rounded-2xl bg-white/[0.04] sm:h-64" />
      </div>
      <div className="space-y-4 lg:col-span-3">
        <div className="h-64 w-full rounded-2xl bg-white/[0.04] sm:h-72" />
        <div className="h-24 w-full rounded-2xl bg-white/[0.04]" />
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="liquid-glass mx-auto mt-20 max-w-lg rounded-3xl p-8 text-center">
      <AlertTriangle className="mx-auto h-9 w-9 text-white/60" />
      <h2 className="mt-4 font-display text-2xl font-bold text-white">Não foi possível carregar o jogo</h2>
      <p className="mt-2 text-sm text-white/60">{message}</p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 rounded-full bg-xbox-green px-5 py-2.5 text-xs font-semibold text-white shadow-xbox-cta transition hover:brightness-110"
        >
          <RotateCw className="h-4 w-4" /> Tentar novamente
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="liquid-glass-subtle rounded-full px-5 py-2.5 text-xs font-semibold text-white/80 transition hover:bg-white/[0.08] hover:text-white"
        >
          Voltar ao Portal
        </button>
      </div>
    </div>
  );
}
