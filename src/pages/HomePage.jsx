import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Gamepad2,
  History,
  Info,
  Sparkles,
  Tag,
} from 'lucide-react';
import XboxLogo from '../components/XboxLogo.jsx';
import SmartSearch from '../components/SmartSearch.jsx';
import PortalHeader from '../components/PortalHeader.jsx';
import PortalFooter from '../components/PortalFooter.jsx';
import GamePortalCard from '../components/GamePortalCard.jsx';
import {
  NzTimezoneWidget,
  RewardsCalculatorWidget,
  StoreLookupGuideWidget,
} from '../components/PortalSidebarTools.jsx';
import {
  getPortalData,
  getRecentGames,
} from '../lib/portal.js';
import { gamePath, navigate, sectionPath } from '../lib/router.js';

const QUICK_PICKS = [
  { id: '9P3H4968GRSM', label: 'Grand Theft Auto VI' },
  { id: '9PMN4DGRT1LN', label: 'Fable' },
  { id: '9NW6JK0ZC9J6', label: 'Tropico 7' },
  { id: '9N431PX143P8', label: 'Forza Horizon 6' },
  { id: '9N4PT8HGCDHQ', label: 'Gears of War: E-Day' },
];

export default function HomePage({ section = 'geral' }) {
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [bgIndex, setBgIndex] = useState(0);
  const [recentGames, setRecentGames] = useState(() => getRecentGames());

  // Sub-filtros das seções
  const [popularTab, setPopularTab] = useState('trending');
  const [gpOverviewTab, setGpOverviewTab] = useState('comingSoonGp');
  const [releaseFilter, setReleaseFilter] = useState('all');
  const [releaseSort, setReleaseSort] = useState('soonest');
  const [offersFilter, setOffersFilter] = useState('trending');
  const [gpFilter, setGpFilter] = useState('comingSoon');

  useEffect(() => {
    document.title = 'Quando lança? · Portal Xbox Brasil';
  }, []);

  useEffect(() => {
    setRecentGames(getRecentGames());
  }, [section]);

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    getPortalData(controller.signal)
      .then((data) => {
        setPortal(data);
        setBgIndex(0);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setPortal({
            upcoming: [],
            datedUpcoming: [],
            trending: [],
            comingSoonGp: [],
            recentGp: [],
            leavingSoonGp: [],
            deals: [],
          });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const heroBgPool = useMemo(() => {
    if (!portal) return [];
    const combined = [
      ...(portal.datedUpcoming || []),
      ...(portal.trending || []),
      ...(portal.comingSoonGp || []),
      ...(portal.upcoming || []),
    ];
    const seen = new Set();
    const out = [];
    for (const g of combined) {
      if (!g?.id || seen.has(g.id) || !g.hero) continue;
      seen.add(g.id);
      out.push(g);
      if (out.length >= 8) break;
    }
    return out;
  }, [portal]);

  const isOverview = section === 'geral';

  useEffect(() => {
    if (!isOverview || heroBgPool.length <= 1) return;
    const t = setInterval(() => {
      setBgIndex((i) => (i + 1) % heroBgPool.length);
    }, 7000);
    return () => clearInterval(t);
  }, [isOverview, heroBgPool.length]);

  const activeBgIndex = heroBgPool.length ? bgIndex % heroBgPool.length : 0;

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-xbox-bg text-neutral-100">
      {/* Atmosfera de fundo em tons Xbox */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[38rem] w-[38rem] rounded-full bg-xbox-green/20 blur-[180px]" />
        <div className="absolute -right-24 top-1/4 h-[34rem] w-[34rem] rounded-full bg-xbox-bright/12 blur-[190px]" />
        <div className="absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-xbox-neon/[0.06] blur-[180px]" />
        <div className="absolute inset-0 bg-grid opacity-[0.04]" />
      </div>

      <PortalHeader activeSection={section} overlayHero={isOverview} />

      {isOverview ? (
        <>
          {/* HERO CENTRAL DE BUSCA COM BACKGROUNDS EM MOVIMENTO E CROSSFADE */}
          <HeroSearchSection
            bgSlides={heroBgPool}
            activeBgIndex={activeBgIndex}
            recentGames={recentGames}
          />

          <main className="relative z-20 mx-auto w-full min-w-0 max-w-[1540px] flex-1 px-4 pt-4 sm:px-6 lg:px-10">
            <OverviewSection
              portal={portal}
              loading={loading}
              nowMs={nowMs}
              popularTab={popularTab}
              setPopularTab={setPopularTab}
              gpOverviewTab={gpOverviewTab}
              setGpOverviewTab={setGpOverviewTab}
              onSeeAllOffers={(tab) => {
                setOffersFilter(tab === 'deals' ? 'deals' : tab === 'free' ? 'free' : 'trending');
                navigate(sectionPath('ofertas'));
              }}
            />
          </main>
        </>
      ) : (
        <main className="relative z-10 mx-auto w-full min-w-0 max-w-[1540px] flex-1 px-4 pt-6 sm:px-6 lg:px-10">
          {/* Banner compacto atmosférico nas sub-seções */}
          <section className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-gradient-to-br from-[#152418] via-[#131915] to-[#0d120f] p-6 shadow-portal-card sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-xbox-green/25 blur-[90px]" />
            <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-xbox-neon/35 bg-xbox-neon/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-xbox-neon">
                  Portal Xbox Brasil
                </span>
                <h1 className="mt-2.5 font-display text-2xl font-bold tracking-tight text-white sm:text-4xl">
                  {section === 'lancamentos' && 'Radar de Próximos Lançamentos'}
                  {section === 'ofertas' && 'Em Alta & Ofertas na Microsoft Store'}
                  {section === 'gamepass' && 'Catálogo Xbox Game Pass'}
                  {section === 'ferramentas' && 'Ferramentas, Truque da Nova Zelândia & Rewards'}
                </h1>
              </div>
              <div className="w-full lg:max-w-xl">
                <SmartSearch size="lg" slashShortcut />
              </div>
            </div>
          </section>

          {section === 'lancamentos' && (
            <ReleasesSection
              portal={portal}
              loading={loading}
              nowMs={nowMs}
              filter={releaseFilter}
              setFilter={setReleaseFilter}
              sort={releaseSort}
              setSort={setReleaseSort}
            />
          )}

          {section === 'ofertas' && (
            <OffersSection
              portal={portal}
              loading={loading}
              nowMs={nowMs}
              filter={offersFilter}
              setFilter={setOffersFilter}
            />
          )}

          {section === 'gamepass' && (
            <GamePassSection
              portal={portal}
              loading={loading}
              nowMs={nowMs}
              filter={gpFilter}
              setFilter={setGpFilter}
            />
          )}

          {section === 'ferramentas' && <ToolsSection />}
        </main>
      )}

      <PortalFooter />
    </div>
  );
}

function HeroSearchSection({ bgSlides, activeBgIndex, recentGames }) {
  return (
    <section className="relative flex min-h-[76vh] flex-col items-center justify-center px-4 pb-16 pt-32 sm:px-6 sm:pt-36 lg:min-h-[78vh] lg:px-10 lg:pt-28">
      {/* Camada de backgrounds em movimento lento e crossfade suave */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#0a0d0b]">
        <div className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-xbox-green/20 blur-[160px]" />

        {bgSlides.map((slide, idx) => {
          const isActive = idx === activeBgIndex;
          return (
            <div
              key={slide.id}
              aria-hidden="true"
              className={`animate-fade-in absolute inset-0 transition-opacity duration-[1800ms] ease-in-out ${
                isActive ? 'opacity-65' : 'opacity-0'
              }`}
            >
              <img
                src={slide.hero}
                alt=""
                className="hero-bg-drift h-full w-full object-cover object-center will-change-transform"
                style={{ animationDirection: idx % 2 === 0 ? 'normal' : 'reverse' }}
              />
            </div>
          );
        })}

        {/* Scrim radial e vertical em tons Xbox para leitura nítida da busca */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(8,11,9,0.5)_0%,rgba(8,11,9,0.82)_72%,rgba(10,13,11,0.96)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070908]/80 via-[#080b09]/30 to-[#0a0d0b]" />
      </div>

      {/* Conteúdo central focado na busca */}
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-xbox-neon/35 bg-[#0e1510]/80 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-xbox-neon backdrop-blur-md">
          <XboxLogo className="h-3.5 w-3.5 text-xbox-neon" />
          Portal Xbox Brasil
        </span>

        <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.65)] sm:text-5xl lg:text-6xl">
          Quando lança<span className="text-xbox-neon">?</span>
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-200/85 sm:text-base">
          Consulte datas de lançamento, horários oficiais, contagem regressiva e histórico de preços de qualquer jogo na Xbox Store Brasil.
        </p>

        <div className="mt-7 w-full">
          <SmartSearch
            size="hero"
            autoFocus
            slashShortcut
            placeholder="Digite o nome do jogo ou cole o link da Microsoft Store..."
          />
        </div>

        <div className="mt-5 flex w-full flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Populares:
            </span>
            {QUICK_PICKS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(gamePath(item.id))}
                className="rounded-full border border-white/[0.12] bg-[#0e1410]/80 px-3 py-1.5 text-xs font-medium text-neutral-200 backdrop-blur-md transition hover:border-xbox-neon/50 hover:bg-xbox-green/25 hover:text-white"
              >
                {item.label}
              </button>
            ))}
          </div>

          {recentGames.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
              <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                <History className="h-3 w-3 text-xbox-neon" />
                Recentes:
              </span>
              {recentGames.slice(0, 5).map((rg) => (
                <button
                  key={rg.id}
                  type="button"
                  onClick={() => navigate(gamePath(rg.id))}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-[#0c110e]/80 px-3 py-1.5 text-xs text-neutral-200 backdrop-blur-md transition hover:border-xbox-neon/50 hover:bg-xbox-green/20 hover:text-white"
                >
                  <span className="max-w-[160px] truncate">{rg.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function OverviewSection({
  portal,
  loading,
  nowMs,
  popularTab,
  setPopularTab,
  gpOverviewTab,
  setGpOverviewTab,
  onSeeAllOffers,
}) {
  const popularRailRef = useRef(null);

  const popularItems = useMemo(() => {
    if (!portal) return [];
    if (popularTab === 'deals') return (portal.deals || []).slice(0, 12);
    if (popularTab === 'free') {
      return (portal.trending || []).filter((g) => g.price && g.price.list === 0).slice(0, 12);
    }
    return (portal.trending || []).slice(0, 12);
  }, [portal, popularTab]);

  const upcomingCards = useMemo(() => (portal?.upcoming || []).slice(0, 8), [portal]);

  const gpItems = useMemo(() => {
    if (!portal) return [];
    if (gpOverviewTab === 'recentGp') return (portal.recentGp || []).slice(0, 6);
    if (gpOverviewTab === 'leavingSoonGp') return (portal.leavingSoonGp || []).slice(0, 6);
    return (portal.comingSoonGp || []).slice(0, 6);
  }, [portal, gpOverviewTab]);

  const scrollPopular = (dir) => {
    if (!popularRailRef.current) return;
    popularRailRef.current.scrollBy({ left: dir * 660, behavior: 'smooth' });
  };

  return (
    <div className="mt-4 space-y-14">
      {/* BLOCO 1: POPULARES & OFERTAS (Cards Poster estilo "Popular Games") */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-xbox-neon">
              <Flame className="h-3.5 w-3.5" />
              Microsoft Store Brasil
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Populares na Loja
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1 rounded-full border border-white/[0.08] bg-[#121814] p-1">
              {[
                { id: 'trending', label: 'Em Alta' },
                { id: 'deals', label: 'Ofertas' },
                { id: 'free', label: 'Gratuitos' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPopularTab(tab.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    popularTab === tab.id
                      ? 'bg-xbox-green text-white shadow-sm'
                      : 'text-neutral-300/75 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="hidden items-center gap-1.5 sm:flex">
              <button
                type="button"
                onClick={() => scrollPopular(-1)}
                aria-label="Rolar populares para a esquerda"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-[#141a16] text-neutral-300 transition hover:border-xbox-neon/45 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollPopular(1)}
                aria-label="Rolar populares para a direita"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-[#141a16] text-neutral-300 transition hover:border-xbox-neon/45 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onSeeAllOffers(popularTab)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-neutral-200 transition hover:border-xbox-neon/45 hover:text-white"
            >
              <span>Ver todos</span>
              <ArrowRight className="h-3.5 w-3.5 text-xbox-neon" />
            </button>
          </div>
        </div>

        {loading ? (
          <PosterRailSkeleton count={6} />
        ) : popularItems.length > 0 ? (
          <div
            ref={popularRailRef}
            className="no-scrollbar mt-5 flex snap-x gap-4 overflow-x-auto pb-2 scroll-smooth"
          >
            {popularItems.map((g) => (
              <div
                key={g.id}
                className="w-[175px] shrink-0 snap-start sm:w-[205px] lg:w-[225px]"
              >
                <GamePortalCard game={g} nowMs={nowMs} variant="poster" />
              </div>
            ))}
          </div>
        ) : (
          <EmptyStrip text="Nenhum título encontrado nesta aba no momento." />
        )}
      </section>

      {/* BLOCO 2: PRÓXIMOS LANÇAMENTOS (Cards Largos estilo "Latest Releases") */}
      <section>
        <SectionHeader
          icon={CalendarClock}
          eyebrow="Calendário Oficial"
          title="Próximos Lançamentos"
          actionLabel="Ver calendário completo"
          onAction={() => navigate(sectionPath('lancamentos'))}
        />

        {loading ? (
          <CardsSkeleton count={8} />
        ) : upcomingCards.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {upcomingCards.map((g) => (
              <GamePortalCard key={g.id} game={g} nowMs={nowMs} variant="wide" />
            ))}
          </div>
        ) : (
          <EmptyStrip text="Nenhum lançamento futuro encontrado no momento. Use a busca acima para consultar qualquer título." />
        )}
      </section>

      {/* BLOCO 3: RADAR GAME PASS ("Hot News!" cards horizontais) + FERRAMENTAS ("Detail orders") */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <section className="min-w-0 xl:col-span-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-xbox-neon">
                <Gamepad2 className="h-3.5 w-3.5" />
                Catálogo por Assinatura
              </span>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Radar Game Pass
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-1 rounded-full border border-white/[0.08] bg-[#121814] p-1">
                {[
                  { id: 'comingSoonGp', label: 'Chegando' },
                  { id: 'recentGp', label: 'Novos' },
                  { id: 'leavingSoonGp', label: 'Saindo' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setGpOverviewTab(tab.id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      gpOverviewTab === tab.id
                        ? 'bg-xbox-green text-white shadow-sm'
                        : 'text-neutral-300/75 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => navigate(sectionPath('gamepass'))}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-neutral-200 transition hover:border-xbox-neon/45 hover:text-white"
              >
                <span>Ver catálogo</span>
                <ArrowRight className="h-3.5 w-3.5 text-xbox-neon" />
              </button>
            </div>
          </div>

          {loading ? (
            <EditorialSkeleton count={6} />
          ) : gpItems.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {gpItems.map((g) => (
                <GamePortalCard
                  key={g.id}
                  game={{ ...g, inGamePass: true }}
                  nowMs={nowMs}
                  variant="editorial"
                  badgeOverride={
                    gpOverviewTab === 'leavingSoonGp'
                      ? { label: 'Saindo em breve', tone: 'imminent' }
                      : null
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyStrip text="Nenhum título disponível nesta categoria do Game Pass no momento." />
          )}
        </section>

        {/* Barra Lateral de Ferramentas */}
        <aside className="min-w-0 space-y-5 xl:col-span-4">
          <RewardsCalculatorWidget />
          <StoreLookupGuideWidget />
        </aside>
      </div>
    </div>
  );
}

function ReleasesSection({ portal, loading, nowMs, filter, setFilter, sort, setSort }) {
  const items = useMemo(() => {
    if (!portal) return [];
    let list = [...(portal.upcoming || [])];
    if (filter === 'dated') list = list.filter((g) => g.releaseDate && !g.releaseTba);
    if (filter === 'tba') list = list.filter((g) => g.releaseTba || !g.releaseDate);
    if (filter === 'gamepass') {
      const gpIds = new Set((portal.comingSoonGp || []).map((g) => g.id));
      list = list.filter((g) => gpIds.has(g.id) || g.inGamePass);
    }
    if (sort === 'alpha') {
      list.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
    }
    return list;
  }, [portal, filter, sort]);

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'Todos próximos' },
            { id: 'dated', label: 'Com data marcada' },
            { id: 'tba', label: 'A anunciar' },
            { id: 'gamepass', label: 'Chegando ao Game Pass' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFilter(btn.id)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                filter === btn.id
                  ? 'border-xbox-neon/45 bg-xbox-green text-white shadow-sm'
                  : 'border-white/[0.09] bg-[#141a16] text-neutral-300 hover:border-white/25 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Ordenar:
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-full border border-white/[0.12] bg-[#141a16] px-3.5 py-1.5 text-xs font-medium text-white outline-none focus:border-xbox-neon"
          >
            <option value="soonest">Mais próximos primeiro</option>
            <option value="alpha">Ordem alfabética (A-Z)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <CardsSkeleton count={8} />
      ) : items.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((g) => (
            <GamePortalCard key={g.id} game={g} nowMs={nowMs} variant="wide" />
          ))}
        </div>
      ) : (
        <EmptyStrip text="Nenhum jogo encontrado para este filtro." />
      )}
    </section>
  );
}

function OffersSection({ portal, loading, nowMs, filter, setFilter }) {
  const items = useMemo(() => {
    if (!portal) return [];
    if (filter === 'deals') return portal.deals || [];
    if (filter === 'free') {
      return (portal.trending || []).filter((g) => g.price && g.price.list === 0);
    }
    return portal.trending || [];
  }, [portal, filter]);

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'trending', label: 'Em Alta na Loja BR', icon: Flame },
            { id: 'deals', label: 'Com Desconto Ativo', icon: Tag },
            { id: 'free', label: 'Gratuitos para Jogar', icon: Sparkles },
          ].map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setFilter(btn.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  filter === btn.id
                    ? 'border-xbox-neon/45 bg-xbox-green text-white shadow-sm'
                    : 'border-white/[0.09] bg-[#141a16] text-neutral-300 hover:border-white/25 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {btn.label}
              </button>
            );
          })}
        </div>
        <span className="rounded-full bg-white/[0.05] px-3 py-1 font-mono text-xs text-neutral-300">
          {items.length} títulos
        </span>
      </div>

      {loading ? (
        <PosterGridSkeleton count={10} />
      ) : items.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((g) => (
            <GamePortalCard key={g.id} game={g} nowMs={nowMs} variant="poster" />
          ))}
        </div>
      ) : (
        <EmptyStrip text="Nenhuma oferta ativa encontrada nesta listagem no momento." />
      )}
    </section>
  );
}

function GamePassSection({ portal, loading, nowMs, filter, setFilter }) {
  const items = useMemo(() => {
    if (!portal) return [];
    if (filter === 'recent') return portal.recentGp || [];
    if (filter === 'leavingSoon') return portal.leavingSoonGp || [];
    return portal.comingSoonGp || [];
  }, [portal, filter]);

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'comingSoon', label: 'Chegando ao Game Pass' },
            { id: 'recent', label: 'Adicionados recentemente' },
            { id: 'leavingSoon', label: 'Saindo em breve' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFilter(btn.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                filter === btn.id
                  ? 'border-xbox-neon/50 bg-xbox-green text-white shadow-sm'
                  : 'border-white/[0.09] bg-[#141a16] text-neutral-300 hover:border-white/25 hover:text-white'
              }`}
            >
              <Gamepad2 className="h-3.5 w-3.5" />
              {btn.label}
            </button>
          ))}
        </div>
        <span className="rounded-full bg-white/[0.05] px-3 py-1 font-mono text-xs text-neutral-300">
          {items.length} títulos
        </span>
      </div>

      {loading ? (
        <EditorialSkeleton count={6} columns={3} />
      ) : items.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((g) => (
            <GamePortalCard
              key={g.id}
              game={{ ...g, inGamePass: true }}
              nowMs={nowMs}
              variant="editorial"
              badgeOverride={
                filter === 'leavingSoon'
                  ? { label: 'Saindo em breve', tone: 'imminent' }
                  : null
              }
            />
          ))}
        </div>
      ) : (
        <EmptyStrip text="Catálogo Game Pass indisponível no momento." />
      )}
    </section>
  );
}

function ToolsSection() {
  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <NzTimezoneWidget expanded />
        <RewardsCalculatorWidget expanded />
        <div className="space-y-6">
          <StoreLookupGuideWidget />
          <div className="rounded-2xl border border-white/[0.08] bg-[#141a16]/90 p-5 shadow-portal-card backdrop-blur-xl">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-200">
              <Info className="h-3.5 w-3.5 text-xbox-neon" />
              Tipos de Lançamento no Xbox
            </div>
            <div className="mt-3.5 space-y-3 text-xs leading-relaxed text-neutral-300/80">
              <div className="rounded-xl border border-white/[0.07] bg-[#0d120f] p-3">
                <strong className="block text-xbox-neon">
                  1. Lançamento Local (Meia-noite regional)
                </strong>
                Cada país libera às 00:00 do seu próprio fuso horário. É quando o Truque da Nova Zelândia funciona melhor, antecipando o jogo em até 15h–16h no Brasil.
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-[#0d120f] p-3">
                <strong className="block text-xbox-mint">2. Lançamento Global Simultâneo</strong>
                Todos os países recebem o acesso exatamente no mesmo minuto (geralmente 01:00 UTC ou 14:00 BRT). O site detecta isso automaticamente na ficha de cada jogo.
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-[#0d120f] p-3">
                <strong className="block text-amber-300">
                  3. Acesso Antecipado (Edições Deluxe/Premium)
                </strong>
                Algumas edições especiais liberam de 2 a 5 dias antes da edição padrão. Você pode buscar pelo nome da edição específica ou colar o link dela na busca.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, eyebrow, title, actionLabel, onAction }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-xbox-neon">
          <Icon className="h-3.5 w-3.5" />
          {eyebrow}
        </span>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-neutral-200 transition hover:border-xbox-neon/45 hover:text-white"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="h-3.5 w-3.5 text-xbox-neon" />
        </button>
      )}
    </div>
  );
}

function PosterRailSkeleton({ count = 6 }) {
  return (
    <div className="mt-5 flex gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/4] w-[175px] shrink-0 animate-pulse rounded-2xl border border-white/[0.07] bg-[#141a16] sm:w-[205px] lg:w-[225px]"
        />
      ))}
    </div>
  );
}

function PosterGridSkeleton({ count = 10 }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/4] animate-pulse rounded-2xl border border-white/[0.07] bg-[#141a16]"
        />
      ))}
    </div>
  );
}

function EditorialSkeleton({ count = 6, columns = 2 }) {
  const cls =
    columns === 3
      ? 'mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'
      : 'mt-5 grid grid-cols-1 gap-4 md:grid-cols-2';
  return (
    <div className={cls}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex h-36 animate-pulse gap-3.5 rounded-2xl border border-white/[0.07] bg-[#141a16] p-3.5"
        >
          <div className="h-full w-24 shrink-0 rounded-xl bg-white/[0.06]" />
          <div className="flex-1 space-y-2.5 py-2">
            <div className="h-3 w-1/2 rounded-full bg-white/10" />
            <div className="h-4 w-4/5 rounded-lg bg-white/10" />
            <div className="h-3 w-1/3 rounded-full bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CardsSkeleton({ count = 8 }) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-[16/10] animate-pulse rounded-2xl border border-white/[0.07] bg-[#141a16]"
        />
      ))}
    </div>
  );
}

function EmptyStrip({ text }) {
  return (
    <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-[#141a16]/80 p-5 text-sm text-neutral-300/75">
      <Clock className="h-4 w-4 shrink-0 text-neutral-400" />
      <span>{text}</span>
    </div>
  );
}
