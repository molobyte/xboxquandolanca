import { useEffect, useMemo, useState } from 'react';
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
  getBrasiliaAndNzClocks,
  getPortalData,
  getRecentGames,
} from '../lib/portal.js';
import { formatPrice } from '../lib/priceHistory.js';
import { gamePath, navigate, sectionPath } from '../lib/router.js';

const QUICK_PICKS = [
  { id: '9P3H4968GRSM', label: 'Grand Theft Auto VI' },
  { id: '9PMN4DGRT1LN', label: 'Fable' },
  { id: '9NW6JK0ZC9J6', label: 'Tropico 7' },
  { id: '9N431PX143P8', label: 'Forza Horizon 6' },
  { id: '9N4PT8HGCDHQ', label: 'Gears of War: E-Day' },
];

const spotlightDateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const pad = (n) => String(n).padStart(2, '0');

export default function HomePage({ section = 'geral' }) {
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [spotlightIdx, setSpotlightIdx] = useState(0);
  const [recentGames, setRecentGames] = useState(() => getRecentGames());

  // Sub-filtros das seções
  const [showcaseTab, setShowcaseTab] = useState('trending');
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
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    getPortalData(controller.signal)
      .then((data) => {
        setPortal(data);
        setSpotlightIdx(0);
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

  const clocks = useMemo(() => getBrasiliaAndNzClocks(nowMs), [Math.floor(nowMs / 30000)]);

  const spotlightPool = useMemo(() => {
    if (!portal) return [];
    if (portal.datedUpcoming?.length) return portal.datedUpcoming.slice(0, 6);
    if (portal.trending?.length) return portal.trending.slice(0, 4);
    return [];
  }, [portal]);

  const activeSpotlight =
    spotlightPool[spotlightIdx % Math.max(1, spotlightPool.length)] || null;

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-xbox-bg text-slate-100">
      {/* Textura sutil de fundo estilo Xbox Dashboard */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-[34rem] w-[34rem] bg-xbox-green/15 blur-[160px]" />
        <div className="absolute right-0 top-1/4 h-[28rem] w-[28rem] bg-xbox-green/10 blur-[180px]" />
        <div className="absolute inset-0 bg-grid opacity-[0.04]" />
      </div>

      <PortalHeader activeSection={section} />

      <main className="relative z-10 mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-4 pt-6 sm:px-6 lg:px-10">
        {/* HERO COMMAND CENTER (visível sempre na Visão Geral, e compacto no topo das sub-seções) */}
        {section === 'geral' ? (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
            {/* Painel Principal de Busca & KPIs */}
            <div className="flex min-w-0 flex-col justify-between rounded-[2px] border border-white/12 border-t-2 border-t-xbox-neon bg-[#0b0f15]/95 p-5 shadow-2xl sm:p-7 lg:col-span-7 xl:col-span-8">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="border-l-2 border-xbox-neon pl-2.5 font-action text-[11px] font-bold uppercase tracking-[0.2em] text-xbox-neon">
                    Central de Lançamentos · Microsoft Store BR
                  </span>
                  <span className="hidden rounded-[2px] border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-white/45 sm:inline-block">
                    Atalho: pressione <kbd className="text-white/80">/</kbd> para buscar
                  </span>
                </div>

                <h1 className="mt-4 font-title text-3xl font-light tracking-tight text-white sm:text-5xl xl:text-6xl">
                  Quando lança<span className="font-normal text-xbox-neon">?</span>
                </h1>
                <p className="mt-2.5 max-w-2xl font-sans text-sm leading-relaxed text-white/65 sm:text-base">
                  Consulte contagens regressivas oficiais para Xbox Series X|S, Xbox One e PC, confira se o{' '}
                  <strong className="font-medium text-white">Truque da Nova Zelândia</strong> antecipa o acesso e analise o histórico de preços em reais.
                </p>

                <div className="mt-6">
                  <SmartSearch size="lg" autoFocus slashShortcut />
                </div>

                {/* Atalhos rápidos */}
                <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="mr-1 font-action text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Populares:
                  </span>
                  {QUICK_PICKS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(gamePath(item.id))}
                      className="rounded-[2px] border border-white/10 bg-white/[0.03] px-2.5 py-1 font-sans text-xs text-white/75 transition hover:border-xbox-neon/50 hover:bg-xbox-green/15 hover:text-white"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Últimos consultados pelo usuário */}
                {recentGames.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                    <span className="inline-flex items-center gap-1 font-action text-[10px] font-bold uppercase tracking-wider text-white/45">
                      <History className="h-3 w-3 text-xbox-neon" />
                      Recentes:
                    </span>
                    {recentGames.slice(0, 5).map((rg) => (
                      <button
                        key={rg.id}
                        type="button"
                        onClick={() => navigate(gamePath(rg.id))}
                        className="inline-flex items-center gap-1.5 rounded-[2px] border border-white/10 bg-[#10161e] px-2 py-1 text-xs text-white/80 transition hover:border-xbox-neon/50 hover:text-white"
                      >
                        <span className="max-w-[140px] truncate">{rg.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Barra de métricas / atalhos do portal */}
              <div className="mt-6 grid grid-cols-2 gap-2.5 border-t border-white/10 pt-5 sm:grid-cols-4">
                <PortalMetricTile
                  label="Com data futura"
                  value={loading ? '—' : String(portal?.datedUpcoming?.length || 0)}
                  hint="Ver calendário"
                  onClick={() => navigate(sectionPath('lancamentos'))}
                />
                <PortalMetricTile
                  label="Radar Game Pass"
                  value={
                    loading
                      ? '—'
                      : String((portal?.comingSoonGp?.length || 0) + (portal?.recentGp?.length || 0))
                  }
                  hint="Em breve & novos"
                  onClick={() => navigate(sectionPath('gamepass'))}
                />
                <PortalMetricTile
                  label="Ofertas Loja BR"
                  value={loading ? '—' : String(portal?.deals?.length || 0)}
                  hint="Descontos ativos"
                  accent="amber"
                  onClick={() => {
                    setOffersFilter('deals');
                    navigate(sectionPath('ofertas'));
                  }}
                />
                <PortalMetricTile
                  label="Fuso Nova Zelândia"
                  value={`+${clocks.diffHours}h`}
                  hint={`Agora ${clocks.nzTime} lá`}
                  accent="neon"
                  onClick={() => navigate(sectionPath('ferramentas'))}
                />
              </div>
            </div>

            {/* Painel Direito: Destaque Próximo Lançamento ao Vivo */}
            <div className="min-w-0 lg:col-span-5 xl:col-span-4">
              <SpotlightPanel
                game={activeSpotlight}
                loading={loading}
                nowMs={nowMs}
                index={spotlightIdx}
                total={spotlightPool.length}
                onPrev={() =>
                  setSpotlightIdx((i) => (i - 1 + spotlightPool.length) % spotlightPool.length)
                }
                onNext={() => setSpotlightIdx((i) => (i + 1) % spotlightPool.length)}
              />
            </div>
          </section>
        ) : (
          /* Barra de busca compacta nas sub-seções do portal */
          <section className="rounded-[2px] border border-white/12 border-l-2 border-l-xbox-neon bg-[#0b0f15] p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="font-action text-[10px] font-bold uppercase tracking-[0.2em] text-xbox-neon">
                  Portal Xbox Brasil
                </span>
                <h1 className="mt-0.5 font-title text-2xl font-light text-white sm:text-3xl">
                  {section === 'lancamentos' && 'Radar de Próximos Lançamentos'}
                  {section === 'ofertas' && 'Em Alta & Ofertas na Microsoft Store'}
                  {section === 'gamepass' && 'Catálogo Xbox Game Pass'}
                  {section === 'ferramentas' && 'Ferramentas, Truque da Nova Zelândia & Rewards'}
                </h1>
              </div>
              <div className="w-full lg:max-w-xl">
                <SmartSearch size="sm" slashShortcut />
              </div>
            </div>
          </section>
        )}

        {/* CONTEÚDO DA SEÇÃO ATIVA */}
        {section === 'geral' && (
          <OverviewSection
            portal={portal}
            loading={loading}
            nowMs={nowMs}
            showcaseTab={showcaseTab}
            setShowcaseTab={setShowcaseTab}
          />
        )}

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

      <PortalFooter />
    </div>
  );
}

function PortalMetricTile({ label, value, hint, onClick, accent = 'default' }) {
  const valueColor =
    accent === 'neon'
      ? 'text-xbox-neon'
      : accent === 'amber'
      ? 'text-amber-300'
      : 'text-white';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-[2px] border border-white/10 bg-[#10151d] p-3 text-left transition hover:border-xbox-neon/50 hover:bg-[#141b26]"
    >
      <span className="block font-action text-[10px] font-bold uppercase tracking-wider text-white/45">
        {label}
      </span>
      <span className={`mt-1 block font-display text-2xl font-bold leading-none ${valueColor}`}>
        {value}
      </span>
      <span className="mt-1.5 flex items-center justify-between font-sans text-[11px] text-white/50 group-hover:text-white/80">
        <span className="truncate">{hint}</span>
        <span className="text-xbox-neon">&rarr;</span>
      </span>
    </button>
  );
}

function SpotlightPanel({ game, loading, nowMs, index, total, onPrev, onNext }) {
  if (loading) {
    return (
      <div className="flex h-full min-h-[340px] animate-pulse flex-col justify-between rounded-[2px] border border-white/12 bg-[#0b0f15] p-5">
        <div className="h-4 w-40 rounded-[2px] bg-white/10" />
        <div className="my-6 aspect-video w-full rounded-[2px] bg-white/5" />
        <div className="h-10 w-full rounded-[2px] bg-white/10" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex h-full flex-col justify-between rounded-[2px] border border-white/12 bg-[#0b0f15] p-6">
        <div>
          <span className="font-action text-[11px] font-bold uppercase tracking-[0.18em] text-xbox-neon">
            Destaque do Portal
          </span>
          <h2 className="mt-2 font-title text-2xl font-light text-white">
            Consulte qualquer jogo Xbox
          </h2>
          <p className="mt-2 font-sans text-sm text-white/60">
            Digite um título na barra de busca ao lado ou cole o link direto da loja para abrir o painel de contagem regressiva.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(sectionPath('ferramentas'))}
          className="mt-6 flex items-center justify-between rounded-[2px] bg-xbox-green px-4 py-3 font-action text-xs font-bold uppercase tracking-wider text-white transition hover:bg-xbox-bright"
        >
          <span>Explorar ferramentas do portal</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const hasDate = game.releaseDate && !game.releaseTba;
  const diff = hasDate ? game.releaseDate.getTime() - nowMs : 0;
  const isFuture = hasDate && diff > 0;
  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const cols =
    totalSeconds >= 86400
      ? [
          [days, 'Dias'],
          [hours, 'Horas'],
          [minutes, 'Min'],
        ]
      : [
          [hours, 'Horas'],
          [minutes, 'Min'],
          [seconds, 'Seg'],
        ];

  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[2px] border border-white/15 border-t-2 border-t-xbox-green bg-[#0b0f15] shadow-2xl">
      {/* Arte de fundo sutil */}
      {(game.hero || game.cardHero) && (
        <div className="pointer-events-none absolute inset-0">
          <img
            src={game.cardHero || game.hero}
            alt=""
            className="h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090c11] via-[#090c11]/85 to-[#090c11]/60" />
        </div>
      )}

      <div className="relative z-10 flex flex-1 flex-col justify-between p-5 sm:p-6">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-[2px] border border-xbox-neon/40 bg-[#07090d]/85 px-2 py-0.5 font-action text-[10px] font-bold uppercase tracking-[0.18em] text-xbox-neon">
              <Sparkles className="h-3 w-3" />
              {isFuture ? 'Próximo lançamento' : 'Destaque da loja'}
            </span>

            {total > 1 && (
              <div className="flex items-center gap-1">
                <span className="mr-1 font-mono text-[10px] text-white/50">
                  {(index % total) + 1}/{total}
                </span>
                <button
                  type="button"
                  onClick={onPrev}
                  aria-label="Destaque anterior"
                  className="rounded-[2px] border border-white/15 bg-black/50 p-1 text-white/70 transition hover:border-xbox-neon/50 hover:text-white"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  aria-label="Próximo destaque"
                  className="rounded-[2px] border border-white/15 bg-black/50 p-1 text-white/70 transition hover:border-xbox-neon/50 hover:text-white"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <h2 className="mt-4 line-clamp-2 font-title text-2xl font-normal leading-tight text-white sm:text-3xl">
            {game.title}
          </h2>
          <p className="mt-1 font-sans text-xs text-white/60">
            {[game.publisher, game.category].filter(Boolean).join(' · ') || 'Microsoft Store Brasil'}
          </p>

          {isFuture ? (
            <div className="mt-5 grid grid-cols-3 gap-2">
              {cols.map(([val, unit]) => (
                <div
                  key={unit}
                  className="rounded-[2px] border border-white/15 bg-black/65 px-2 py-3 text-center backdrop-blur-sm"
                >
                  <span className="block font-display text-3xl font-bold tabular-nums text-white">
                    {pad(val)}
                  </span>
                  <span className="mt-1 block font-action text-[10px] font-bold uppercase tracking-wider text-xbox-neon">
                    {unit}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[2px] border border-white/10 bg-black/50 p-3 text-xs text-white/70">
              {game.price?.list === 0
                ? 'Disponível gratuitamente na Microsoft Store BR.'
                : game.price?.list
                ? `Disponível na loja por ${formatPrice(game.price.list)}.`
                : 'Consulte detalhes, fusos regionais e histórico de preço.'}
            </div>
          )}
        </div>

        <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-action text-[10px] font-bold uppercase tracking-wider text-white/45">
              {hasDate ? 'Previsão BR' : 'Status'}
            </span>
            <span className="font-sans font-medium text-white/90">
              {hasDate ? spotlightDateFmt.format(game.releaseDate) : 'Data a anunciar'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate(gamePath(game.id))}
            className="flex w-full items-center justify-between rounded-[2px] bg-xbox-green px-4 py-3 font-action text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-xbox-bright"
          >
            <span>Abrir painel do jogo</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function OverviewSection({ portal, loading, nowMs, showcaseTab, setShowcaseTab }) {
  const upcomingCards = useMemo(() => (portal?.upcoming || []).slice(0, 8), [portal]);

  const showcaseItems = useMemo(() => {
    if (!portal) return [];
    if (showcaseTab === 'trending') return portal.trending.slice(0, 8);
    if (showcaseTab === 'comingSoonGp') return portal.comingSoonGp.slice(0, 8);
    if (showcaseTab === 'recentGp') return portal.recentGp.slice(0, 8);
    if (showcaseTab === 'deals') return portal.deals.slice(0, 8);
    if (showcaseTab === 'leavingSoonGp') return portal.leavingSoonGp.slice(0, 8);
    return [];
  }, [portal, showcaseTab]);

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-12">
      {/* Coluna Principal Larga */}
      <div className="min-w-0 space-y-10 xl:col-span-9">
        {/* Bloco 1: Radar de Próximos Lançamentos */}
        <section>
          <SectionHeader
            icon={CalendarClock}
            eyebrow="Calendário Oficial"
            title="Radar de Próximos Lançamentos"
            actionLabel="Ver todos os lançamentos"
            onAction={() => navigate(sectionPath('lancamentos'))}
          />
          {loading ? (
            <CardsSkeleton count={8} />
          ) : upcomingCards.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {upcomingCards.map((g) => (
                <GamePortalCard key={g.id} game={g} nowMs={nowMs} />
              ))}
            </div>
          ) : (
            <EmptyStrip text="Nenhum lançamento futuro encontrado no momento. Use a busca acima para consultar qualquer título." />
          )}
        </section>

        {/* Bloco 2: Vitrine Loja Xbox & Game Pass com opções de filtro */}
        <section>
          <div className="flex flex-col gap-3 border-b border-white/10 pb-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="flex items-center gap-1.5 font-action text-[10px] font-bold uppercase tracking-[0.18em] text-xbox-neon">
                <Flame className="h-3.5 w-3.5" />
                Catálogo &amp; Destaques
              </span>
              <h2 className="mt-1 font-title text-2xl font-light text-white">
                Vitrine Xbox Store &amp; Game Pass
              </h2>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'trending', label: 'Em Alta (BR)' },
                { id: 'comingSoonGp', label: 'Chegando ao GP' },
                { id: 'recentGp', label: 'Novos no GP' },
                { id: 'deals', label: 'Em Promoção' },
                { id: 'leavingSoonGp', label: 'Saindo do GP' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setShowcaseTab(tab.id)}
                  className={`rounded-[2px] border px-2.5 py-1 font-action text-[11px] font-bold uppercase tracking-wider transition ${
                    showcaseTab === tab.id
                      ? 'border-xbox-neon/60 bg-xbox-green/25 text-white'
                      : 'border-white/10 bg-[#0d1218] text-white/55 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <CardsSkeleton count={8} />
          ) : showcaseItems.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {showcaseItems.map((g) => (
                <GamePortalCard
                  key={g.id}
                  game={g}
                  nowMs={nowMs}
                  badgeOverride={
                    showcaseTab === 'leavingSoonGp'
                      ? { label: 'Saindo em breve', tone: 'imminent' }
                      : null
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyStrip text="Nenhum título disponível nesta categoria no momento." />
          )}
        </section>
      </div>

      {/* Barra Lateral de Ferramentas e Informações do Portal */}
      <aside className="min-w-0 space-y-5 xl:col-span-3">
        <NzTimezoneWidget />
        <RewardsCalculatorWidget />
        <StoreLookupGuideWidget />
      </aside>
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
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
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
              className={`rounded-[2px] border px-3 py-1.5 font-action text-[11px] font-bold uppercase tracking-wider transition ${
                filter === btn.id
                  ? 'border-xbox-neon/60 bg-xbox-green/25 text-white'
                  : 'border-white/10 bg-[#0d1218] text-white/60 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-action text-[10px] font-bold uppercase tracking-wider text-white/45">
            Ordenar:
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-[2px] border border-white/15 bg-[#0d1218] px-2.5 py-1.5 font-sans text-xs text-white outline-none focus:border-xbox-neon"
          >
            <option value="soonest">Mais próximos primeiro</option>
            <option value="alpha">Ordem alfabética (A-Z)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <CardsSkeleton count={10} wide />
      ) : items.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
          {items.map((g) => (
            <GamePortalCard key={g.id} game={g} nowMs={nowMs} />
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
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
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
                className={`inline-flex items-center gap-1.5 rounded-[2px] border px-3 py-1.5 font-action text-[11px] font-bold uppercase tracking-wider transition ${
                  filter === btn.id
                    ? 'border-xbox-neon/60 bg-xbox-green/25 text-white'
                    : 'border-white/10 bg-[#0d1218] text-white/60 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5 text-xbox-neon" />
                {btn.label}
              </button>
            );
          })}
        </div>
        <span className="font-mono text-xs text-white/45">{items.length} títulos</span>
      </div>

      {loading ? (
        <CardsSkeleton count={10} wide />
      ) : items.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
          {items.map((g) => (
            <GamePortalCard key={g.id} game={g} nowMs={nowMs} />
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
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
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
              className={`inline-flex items-center gap-1.5 rounded-[2px] border px-3 py-1.5 font-action text-[11px] font-bold uppercase tracking-wider transition ${
                filter === btn.id
                  ? 'border-xbox-neon/60 bg-xbox-green/25 text-white'
                  : 'border-white/10 bg-[#0d1218] text-white/60 hover:text-white'
              }`}
            >
              <Gamepad2 className="h-3.5 w-3.5 text-xbox-neon" />
              {btn.label}
            </button>
          ))}
        </div>
        <span className="font-mono text-xs text-white/45">{items.length} títulos</span>
      </div>

      {loading ? (
        <CardsSkeleton count={10} wide />
      ) : items.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
          {items.map((g) => (
            <GamePortalCard
              key={g.id}
              game={{ ...g, inGamePass: true }}
              nowMs={nowMs}
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
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <NzTimezoneWidget expanded />
        <RewardsCalculatorWidget expanded />
        <div className="space-y-6">
          <StoreLookupGuideWidget />
          <div className="rounded-[2px] border border-white/12 bg-[#0d1218] p-4 sm:p-5">
            <div className="flex items-center gap-1.5 font-action text-[11px] font-bold uppercase tracking-[0.16em] text-white/85">
              <Info className="h-3.5 w-3.5 text-xbox-neon" />
              Tipos de Lançamento no Xbox
            </div>
            <div className="mt-3 space-y-3 font-sans text-xs leading-relaxed text-white/65">
              <div className="border-l-2 border-xbox-neon pl-3">
                <strong className="block text-white">1. Lançamento Local (Meia-noite regional)</strong>
                Cada país libera às 00:00 do seu próprio fuso horário. É quando o Truque da Nova Zelândia funciona melhor, antecipando o jogo em até 15h–16h no Brasil.
              </div>
              <div className="border-l-2 border-sky-400 pl-3">
                <strong className="block text-white">2. Lançamento Global Simultâneo</strong>
                Todos os países recebem o acesso exatamente no mesmo minuto (geralmente 01:00 UTC ou 14:00 BRT). O site detecta isso automaticamente na ficha de cada jogo.
              </div>
              <div className="border-l-2 border-amber-400 pl-3">
                <strong className="block text-white">3. Acesso Antecipado (Edições Deluxe/Premium)</strong>
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
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-3">
      <div>
        <span className="flex items-center gap-1.5 font-action text-[10px] font-bold uppercase tracking-[0.18em] text-xbox-neon">
          <Icon className="h-3.5 w-3.5" />
          {eyebrow}
        </span>
        <h2 className="mt-1 font-title text-2xl font-light text-white">{title}</h2>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1.5 rounded-[2px] border border-white/12 bg-white/[0.03] px-3 py-1.5 font-action text-[11px] font-bold uppercase tracking-wider text-white/75 transition hover:border-xbox-neon/50 hover:text-white"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="h-3.5 w-3.5 text-xbox-neon" />
        </button>
      )}
    </div>
  );
}

function CardsSkeleton({ count = 8, wide = false }) {
  const gridClass = wide
    ? 'mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5'
    : 'mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4';
  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-[2px] border border-white/10 bg-[#0d1218]"
        >
          <div className="aspect-video w-full bg-white/5" />
          <div className="space-y-2.5 p-3.5">
            <div className="h-4 w-3/4 rounded-[2px] bg-white/10" />
            <div className="h-3 w-1/2 rounded-[2px] bg-white/5" />
            <div className="mt-3 h-6 w-full border-t border-white/5 pt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyStrip({ text }) {
  return (
    <div className="mt-4 flex items-center gap-2 rounded-[2px] border border-white/10 bg-[#0d1218] p-5 text-sm text-white/55">
      <Clock className="h-4 w-4 shrink-0 text-white/40" />
      <span>{text}</span>
    </div>
  );
}
