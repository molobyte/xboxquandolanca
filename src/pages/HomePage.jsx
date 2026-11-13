import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
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
    const combined = [
      ...(portal.datedUpcoming || []),
      ...(portal.trending || []),
      ...(portal.comingSoonGp || []),
    ];
    const seen = new Set();
    const out = [];
    for (const g of combined) {
      if (!g?.id || seen.has(g.id)) continue;
      seen.add(g.id);
      out.push(g);
      if (out.length >= 5) break;
    }
    return out;
  }, [portal]);

  const activeIndex = spotlightPool.length ? spotlightIdx % spotlightPool.length : 0;
  const activeSpotlight = spotlightPool[activeIndex] || null;
  const isOverview = section === 'geral';

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-portal-bg text-slate-100">
      {/* Atmosfera de fundo estilo Game Portal Midnight */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[38rem] w-[38rem] rounded-full bg-portal-blue/15 blur-[180px]" />
        <div className="absolute -right-24 top-1/4 h-[34rem] w-[34rem] rounded-full bg-indigo-500/12 blur-[190px]" />
        <div className="absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-xbox-neon/[0.06] blur-[180px]" />
        <div className="absolute inset-0 bg-grid opacity-[0.04]" />
      </div>

      <PortalHeader activeSection={section} overlayHero={isOverview} />

      {isOverview ? (
        <>
          {/* HERO CINEMATOGRÁFICO COM CARROSSEL DE PÔSTERES */}
          <HeroShowcase
            pool={spotlightPool}
            activeGame={activeSpotlight}
            activeIndex={activeIndex}
            loading={loading}
            nowMs={nowMs}
            onSelect={(idx) => setSpotlightIdx(idx)}
            onPrev={() =>
              setSpotlightIdx((i) => (i - 1 + spotlightPool.length) % Math.max(1, spotlightPool.length))
            }
            onNext={() => setSpotlightIdx((i) => (i + 1) % Math.max(1, spotlightPool.length))}
          />

          <main className="relative z-20 mx-auto w-full min-w-0 max-w-[1540px] flex-1 px-4 sm:px-6 lg:px-10">
            {/* BARRA FLUTUANTE DE BUSCA + KPIs RÁPIDOS */}
            <section className="-mt-8 rounded-3xl border border-white/[0.1] bg-[#13192f]/90 p-4 shadow-[0_24px_64px_-20px_rgba(3,6,18,0.95)] backdrop-blur-2xl sm:p-6">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-center">
                <div className="min-w-0 lg:col-span-7">
                  <SmartSearch size="lg" slashShortcut />

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Populares:
                    </span>
                    {QUICK_PICKS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigate(gamePath(item.id))}
                        className="rounded-full border border-white/[0.09] bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-portal-blue/50 hover:bg-portal-blue/15 hover:text-white"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {recentGames.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/[0.07] pt-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <History className="h-3 w-3 text-portal-cyan" />
                        Recentes:
                      </span>
                      {recentGames.slice(0, 5).map((rg) => (
                        <button
                          key={rg.id}
                          type="button"
                          onClick={() => navigate(gamePath(rg.id))}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#0d1223] px-2.5 py-1 text-xs text-slate-200 transition hover:border-portal-cyan/40 hover:text-white"
                        >
                          <span className="max-w-[140px] truncate">{rg.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4 KPIs interativos no estilo glass */}
                <div className="grid min-w-0 grid-cols-2 gap-2.5 lg:col-span-5">
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
                    accent="neon"
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
                    accent="cyan"
                    onClick={() => navigate(sectionPath('ferramentas'))}
                  />
                </div>
              </div>
            </section>

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
          <section className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-gradient-to-br from-[#171f3a] via-[#13192e] to-[#0e1324] p-6 shadow-portal-card sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-portal-blue/20 blur-[90px]" />
            <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-portal-cyan/30 bg-portal-cyan/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-portal-cyan">
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

function HeroShowcase({
  pool,
  activeGame,
  activeIndex,
  loading,
  nowMs,
  onSelect,
  onPrev,
  onNext,
}) {
  if (loading && !activeGame) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-[#191d38] via-[#11162b] to-[#0b0f1d] pb-20 pt-28 sm:pt-32 lg:min-h-[640px]">
        <div className="mx-auto grid max-w-[1540px] animate-pulse grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:items-end lg:px-10">
          <div className="space-y-4 lg:col-span-6">
            <div className="h-6 w-36 rounded-full bg-white/10" />
            <div className="h-14 w-4/5 rounded-2xl bg-white/10" />
            <div className="h-5 w-2/3 rounded-xl bg-white/5" />
            <div className="flex gap-3 pt-2">
              <div className="h-11 w-44 rounded-full bg-portal-blue/30" />
              <div className="h-11 w-36 rounded-full bg-white/10" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:col-span-6">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="aspect-[3/4] rounded-2xl bg-white/[0.06]" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!activeGame) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a2040] via-[#11162b] to-[#0b0f1d] pb-20 pt-32">
        <div className="mx-auto max-w-[1540px] px-4 sm:px-6 lg:px-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-portal-coral px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
            <Sparkles className="h-3.5 w-3.5" />
            Portal Xbox Brasil
          </span>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold uppercase tracking-tight text-white sm:text-6xl">
            Quando lança<span className="text-xbox-neon">?</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-300">
            Consulte contagens regressivas oficiais para Xbox Series X|S, Xbox One e PC, verifique o Truque da Nova Zelândia e analise o histórico de preços em reais.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(sectionPath('ferramentas'))}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563eb] to-[#3b82f6] px-6 py-3 text-sm font-bold text-white shadow-portal-blue transition hover:brightness-110"
            >
              <span>Explorar ferramentas</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    );
  }

  const hasDate = activeGame.releaseDate && !activeGame.releaseTba;
  const diff = hasDate ? activeGame.releaseDate.getTime() - nowMs : 0;
  const isFuture = hasDate && diff > 0;
  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hasPrice = activeGame.price && typeof activeGame.price.list === 'number';
  const isFree = hasPrice && activeGame.price.list === 0;
  const hasDiscount =
    hasPrice && activeGame.price.msrp > activeGame.price.list && activeGame.price.list > 0;
  const discountPct = hasDiscount
    ? Math.round((1 - activeGame.price.list / activeGame.price.msrp) * 100)
    : null;

  const backdropSrc = activeGame.hero || activeGame.cardHero || activeGame.cover;
  const total = pool.length || 1;
  const progressPct = ((activeIndex + 1) / total) * 100;

  return (
    <section className="relative flex min-h-[580px] flex-col justify-end overflow-hidden pb-16 pt-32 sm:pt-36 lg:min-h-[650px] lg:pb-20 lg:pt-28">
      {/* Arte de fundo em tela cheia */}
      {backdropSrc ? (
        <img
          key={activeGame.id}
          src={backdropSrc}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-80 transition-opacity duration-500 animate-fade-in"
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#231d47] via-[#141933] to-[#0b0f1d]" />
      )}

      {/* Camadas de scrim cinematográfico */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#090d1b] via-[#090d1b]/75 via-45% to-[#090d1b]/30" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b0f1d] via-[#0b0f1d]/55 via-30% to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#080b16]/75 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto grid w-full max-w-[1540px] grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:items-end lg:px-10">
        {/* Coluna Esquerda: Conteúdo Editorial & CTAs */}
        <div className="min-w-0 lg:col-span-6">
          <div className="flex flex-wrap items-center gap-2">
            {discountPct ? (
              <span className="rounded-full bg-portal-coral px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-lg">
                Oferta -{discountPct}%
              </span>
            ) : isFuture ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-portal-coral px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-lg">
                <Sparkles className="h-3 w-3" />
                Próximo lançamento
              </span>
            ) : activeGame.inGamePass ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-portal-lime px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#090d1a] shadow-lg">
                <Gamepad2 className="h-3.5 w-3.5" />
                Game Pass
              </span>
            ) : (
              <span className="rounded-full bg-portal-blue px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-lg">
                Em destaque BR
              </span>
            )}

            {hasDate && (
              <span className="rounded-full border border-white/15 bg-[#0c1124]/70 px-3 py-1 text-[11px] font-semibold text-slate-200 backdrop-blur-md">
                {spotlightDateFmt.format(activeGame.releaseDate)}
              </span>
            )}
          </div>

          <h1 className="mt-4 line-clamp-2 font-display text-3xl font-extrabold uppercase tracking-tight text-white drop-shadow-sm sm:text-5xl xl:text-[54px] xl:leading-[1.05]">
            {activeGame.title}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-200/85 sm:text-base">
            {[activeGame.publisher, activeGame.category].filter(Boolean).join(' · ') ||
              'Microsoft Store Brasil'}
            {hasPrice
              ? ` · ${
                  isFree ? 'Gratuito para jogar' : `A partir de ${formatPrice(activeGame.price.list)}`
                }`
              : ''}
          </p>

          {/* Contagem regressiva ao vivo dentro do Hero */}
          {isFuture && (
            <div className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.12] bg-[#0b1022]/75 p-2 backdrop-blur-xl">
              {[
                [days, 'Dias'],
                [hours, 'Horas'],
                [minutes, 'Min'],
                [seconds, 'Seg'],
              ].map(([val, unit]) => (
                <div
                  key={unit}
                  className="min-w-[58px] rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-center"
                >
                  <span className="block font-display text-xl font-bold tabular-nums leading-none text-white sm:text-2xl">
                    {pad(val)}
                  </span>
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-portal-cyan">
                    {unit}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Botões de Ação Estilo Game Portal */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(gamePath(activeGame.id))}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563eb] to-[#3b82f6] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-portal-blue transition hover:brightness-110 sm:text-sm"
            >
              <span>Abrir painel do jogo</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <a
              href={activeGame.storeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.08] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md transition hover:border-white/45 hover:bg-white/[0.16] sm:text-sm"
            >
              <span>Loja Xbox BR</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Coluna Direita: Tira de Pôsteres + Paginação < > ─── 01 */}
        <div className="min-w-0 lg:col-span-6">
          <div className="mb-3 hidden items-center justify-end gap-2 lg:flex">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
              Destaques em cartaz
            </span>
          </div>

          {/* Tira de cards verticais */}
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 sm:gap-3">
            {pool.map((g, idx) => {
              const isSelected = idx === activeIndex;
              const thumb = g.cover || g.cardHero;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onSelect(idx)}
                  className={`group relative aspect-[3/4] overflow-hidden rounded-2xl border text-left transition-all duration-300 ${
                    idx >= 3 ? 'hidden sm:block' : ''
                  } ${
                    isSelected
                      ? '-translate-y-1.5 border-portal-cyan/80 shadow-[0_18px_36px_-10px_rgba(37,99,235,0.65)] ring-2 ring-portal-blue/50'
                      : 'border-white/15 opacity-75 hover:-translate-y-1 hover:border-white/35 hover:opacity-100'
                  }`}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={g.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-[#151c33]" />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070a15] via-[#070a15]/35 to-transparent" />
                  <div className="absolute inset-x-2.5 bottom-2.5">
                    <span className="line-clamp-2 font-display text-[10px] font-extrabold uppercase leading-tight tracking-wide text-white sm:text-[11px]">
                      {g.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Controles < > ────── 01 */}
          {total > 1 && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onPrev}
                  aria-label="Destaque anterior"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-[#12182d]/85 text-white/80 backdrop-blur-md transition hover:border-portal-blue hover:bg-portal-blue/25 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  aria-label="Próximo destaque"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-[#12182d]/85 text-white/80 backdrop-blur-md transition hover:border-portal-blue hover:bg-portal-blue/25 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-portal-blue to-portal-cyan transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <span className="font-display text-xl font-bold tabular-nums text-white sm:text-3xl">
                {pad(activeIndex + 1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PortalMetricTile({ label, value, hint, onClick, accent = 'default' }) {
  const valueColor =
    accent === 'neon'
      ? 'text-xbox-neon'
      : accent === 'amber'
      ? 'text-amber-300'
      : accent === 'cyan'
      ? 'text-portal-cyan'
      : 'text-white';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-white/[0.08] bg-[#0e1427]/85 p-3.5 text-left transition hover:-translate-y-0.5 hover:border-portal-blue/45 hover:bg-[#141c35]"
    >
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className={`mt-1 block font-display text-2xl font-bold leading-none ${valueColor}`}>
        {value}
      </span>
      <span className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-slate-200">
        <span className="truncate">{hint}</span>
        <span className="text-portal-cyan">&rarr;</span>
      </span>
    </button>
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
    <div className="mt-12 space-y-14">
      {/* BLOCO 1: POPULARES & OFERTAS (Cards Poster estilo "Popular Games") */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-portal-cyan">
              <Flame className="h-3.5 w-3.5" />
              Microsoft Store Brasil
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Populares na Loja
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1 rounded-full border border-white/[0.08] bg-[#13192f] p-1">
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
                      ? 'bg-portal-blue text-white shadow-sm'
                      : 'text-slate-300/75 hover:text-white'
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
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-[#151c33] text-slate-300 transition hover:border-portal-blue/50 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollPopular(1)}
                aria-label="Rolar populares para a direita"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-[#151c33] text-slate-300 transition hover:border-portal-blue/50 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onSeeAllOffers(popularTab)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-portal-blue/50 hover:text-white"
            >
              <span>Ver todos</span>
              <ArrowRight className="h-3.5 w-3.5 text-portal-cyan" />
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
              <div className="flex flex-wrap gap-1 rounded-full border border-white/[0.08] bg-[#13192f] p-1">
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
                        : 'text-slate-300/75 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => navigate(sectionPath('gamepass'))}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-xbox-neon/45 hover:text-white"
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
          <NzTimezoneWidget />
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
                  ? 'border-portal-blue/60 bg-portal-blue text-white shadow-sm'
                  : 'border-white/[0.09] bg-[#151c33] text-slate-300 hover:border-white/25 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Ordenar:
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-full border border-white/[0.12] bg-[#151c33] px-3.5 py-1.5 text-xs font-medium text-white outline-none focus:border-portal-blue"
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
                    ? 'border-portal-blue/60 bg-portal-blue text-white shadow-sm'
                    : 'border-white/[0.09] bg-[#151c33] text-slate-300 hover:border-white/25 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {btn.label}
              </button>
            );
          })}
        </div>
        <span className="rounded-full bg-white/[0.05] px-3 py-1 font-mono text-xs text-slate-300">
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
                  : 'border-white/[0.09] bg-[#151c33] text-slate-300 hover:border-white/25 hover:text-white'
              }`}
            >
              <Gamepad2 className="h-3.5 w-3.5" />
              {btn.label}
            </button>
          ))}
        </div>
        <span className="rounded-full bg-white/[0.05] px-3 py-1 font-mono text-xs text-slate-300">
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
          <div className="rounded-2xl border border-white/[0.08] bg-[#151c33]/90 p-5 shadow-portal-card backdrop-blur-xl">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-200">
              <Info className="h-3.5 w-3.5 text-portal-cyan" />
              Tipos de Lançamento no Xbox
            </div>
            <div className="mt-3.5 space-y-3 text-xs leading-relaxed text-slate-300/80">
              <div className="rounded-xl border border-white/[0.07] bg-[#0d1223] p-3">
                <strong className="block text-xbox-neon">
                  1. Lançamento Local (Meia-noite regional)
                </strong>
                Cada país libera às 00:00 do seu próprio fuso horário. É quando o Truque da Nova Zelândia funciona melhor, antecipando o jogo em até 15h–16h no Brasil.
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-[#0d1223] p-3">
                <strong className="block text-portal-cyan">2. Lançamento Global Simultâneo</strong>
                Todos os países recebem o acesso exatamente no mesmo minuto (geralmente 01:00 UTC ou 14:00 BRT). O site detecta isso automaticamente na ficha de cada jogo.
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-[#0d1223] p-3">
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
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-portal-cyan">
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
          className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-portal-blue/50 hover:text-white"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="h-3.5 w-3.5 text-portal-cyan" />
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
          className="aspect-[3/4] w-[175px] shrink-0 animate-pulse rounded-2xl border border-white/[0.07] bg-[#151c33] sm:w-[205px] lg:w-[225px]"
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
          className="aspect-[3/4] animate-pulse rounded-2xl border border-white/[0.07] bg-[#151c33]"
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
          className="flex h-36 animate-pulse gap-3.5 rounded-2xl border border-white/[0.07] bg-[#151c33] p-3.5"
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
          className="aspect-[16/10] animate-pulse rounded-2xl border border-white/[0.07] bg-[#151c33]"
        />
      ))}
    </div>
  );
}

function EmptyStrip({ text }) {
  return (
    <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-[#151c33]/80 p-5 text-sm text-slate-300/75">
      <Clock className="h-4 w-4 shrink-0 text-slate-400" />
      <span>{text}</span>
    </div>
  );
}
