import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  Flame,
  Gamepad2,
  LayoutGrid,
  Search,
  Wrench,
  X,
} from 'lucide-react';
import XboxLogo from './XboxLogo.jsx';
import SmartSearch from './SmartSearch.jsx';
import { gamePath, navigate, sectionPath } from '../lib/router.js';

export const PORTAL_NAV_ITEMS = [
  { id: 'geral', label: 'Portal', icon: LayoutGrid },
  { id: 'lancamentos', label: 'Lançamentos', icon: CalendarClock },
  { id: 'ofertas', label: 'Em Alta & Ofertas', icon: Flame },
  { id: 'gamepass', label: 'Game Pass', icon: Gamepad2 },
  { id: 'ferramentas', label: 'Ferramentas', icon: Wrench },
];

const MODAL_QUICK_PICKS = [
  { id: '9P3H4968GRSM', label: 'Grand Theft Auto VI' },
  { id: '9PMN4DGRT1LN', label: 'Fable' },
  { id: '9N431PX143P8', label: 'Forza Horizon 6' },
  { id: '9N4PT8HGCDHQ', label: 'Gears of War: E-Day' },
];

export default function PortalHeader({
  activeSection = 'geral',
  showSearch = false,
  isGamePage = false,
  overlayHero = false,
}) {
  const [scrolled, setScrolled] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!searchModalOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setSearchModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchModalOpen]);

  const positionClass = overlayHero ? 'fixed inset-x-0 top-0 z-40' : 'sticky top-0 z-40';
  const surfaceClass =
    overlayHero && !scrolled
      ? 'border-b border-transparent bg-gradient-to-b from-[#070908]/85 via-[#070908]/45 to-transparent'
      : 'border-b border-white/[0.08] bg-[#0a0d0b]/88 shadow-[0_12px_36px_-16px_rgba(2,8,4,0.9)] backdrop-blur-xl';

  return (
    <>
      <header className={`${positionClass} transition-all duration-300 ${surfaceClass}`}>
        <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
          {/* Marca */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="group flex shrink-0 items-center gap-2.5 rounded-full py-1 pr-2 text-left transition hover:opacity-95"
            aria-label="Ir para a página inicial do portal"
          >
            {isGamePage && (
              <ArrowLeft className="h-4 w-4 text-neutral-400 transition group-hover:-translate-x-0.5 group-hover:text-xbox-neon" />
            )}
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.06] shadow-inner backdrop-blur-md">
              <XboxLogo className="h-4 w-4 text-xbox-neon drop-shadow-[0_0_10px_rgba(82,214,39,0.55)]" />
            </span>
            <div className={`flex items-center gap-2 ${showSearch ? 'hidden sm:flex' : ''}`}>
              <span className="font-display text-lg font-bold tracking-tight text-white">
                Quando lança<span className="text-xbox-neon">?</span>
              </span>
              {!showSearch && (
                <span className="hidden rounded-full border border-white/[0.12] bg-white/[0.06] px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-300 xl:inline-block">
                  Xbox BR
                </span>
              )}
            </div>
          </button>

          {/* Navegação Centralizada (Desktop) */}
          <nav
            className="hidden shrink-0 items-center gap-0.5 rounded-full border border-white/[0.08] bg-[#121814]/70 p-1 backdrop-blur-md lg:flex"
            aria-label="Seções do portal"
          >
            {PORTAL_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = !isGamePage && activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(sectionPath(item.id))}
                  className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] transition-all ${
                    showSearch ? 'xl:px-2.5' : 'xl:px-3.5'
                  } ${
                    active
                      ? 'bg-white/[0.12] text-white shadow-sm'
                      : 'text-neutral-300/75 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-xbox-neon' : 'text-neutral-400/80'}`}
                  />
                  <span>{item.label}</span>
                  {active && (
                    <span className="ml-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-xbox-neon shadow-[0_0_8px_rgba(82,214,39,0.9)]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Ações à Direita: Busca */}
          <div className={`flex min-w-0 items-center gap-2 ${showSearch ? 'flex-1 justify-end' : ''}`}>
            {showSearch ? (
              <div className="w-full min-w-0 max-w-xs sm:max-w-sm lg:max-w-[260px] xl:max-w-[300px]">
                <SmartSearch size="sm" slashShortcut placeholder="Buscar outro jogo…" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                aria-label="Abrir busca rápida de jogos"
                className="flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/[0.12] bg-[#131915]/75 px-3 text-neutral-200 backdrop-blur-md transition hover:border-xbox-neon/45 hover:bg-[#19221c] hover:text-white"
              >
                <Search className="h-4 w-4 shrink-0 text-xbox-neon" />
                <span className="hidden text-xs font-medium text-neutral-300 xl:inline">
                  Buscar jogo
                </span>
                <kbd className="hidden rounded-md border border-white/15 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-neutral-400 xl:inline">
                  /
                </kbd>
              </button>
            )}
          </div>
        </div>

        {/* Navegação secundária em telas menores */}
        <div
          className={`border-t border-white/[0.06] lg:hidden ${
            overlayHero && !scrolled ? 'bg-[#070908]/60 backdrop-blur-md' : 'bg-[#0a0d0b]/85'
          }`}
        >
          <div className="no-scrollbar mx-auto flex max-w-[1540px] items-center gap-1.5 overflow-x-auto px-4 py-2 sm:px-6">
            {PORTAL_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = !isGamePage && activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(sectionPath(item.id))}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] transition ${
                    active
                      ? 'border border-xbox-neon/45 bg-xbox-green/25 text-white'
                      : 'text-neutral-300/75 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <Icon className={`h-3 w-3 ${active ? 'text-xbox-neon' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Modal de Busca Rápida (ativado pelo ícone de lupa no topo) */}
      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[#060807]/80 px-4 pt-20 backdrop-blur-md animate-fade-in sm:pt-28"
          onClick={() => setSearchModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-white/[0.12] bg-[#131915]/95 p-5 shadow-[0_28px_80px_-15px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-xbox-neon">
                  Busca Rápida Microsoft Store BR
                </span>
                <h2 className="mt-0.5 font-display text-xl font-bold text-white">
                  Encontre qualquer jogo ou cole o link da loja
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                aria-label="Fechar busca"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-neutral-300 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <SmartSearch
              size="lg"
              autoFocus
              onAfterNavigate={() => setSearchModalOpen(false)}
            />

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-3.5">
              <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Em destaque:
              </span>
              {MODAL_QUICK_PICKS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSearchModalOpen(false);
                    navigate(gamePath(item.id));
                  }}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-neutral-200 transition hover:border-xbox-neon/45 hover:bg-xbox-green/20 hover:text-white"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
