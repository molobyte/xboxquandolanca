import { useEffect, useState } from 'react';
import { CalendarClock, Flame, Gamepad2, LayoutGrid, Wrench, ArrowLeft } from 'lucide-react';
import XboxLogo from './XboxLogo.jsx';
import SmartSearch from './SmartSearch.jsx';
import CountryFlag from './CountryFlag.jsx';
import { getBrasiliaAndNzClocks } from '../lib/portal.js';
import { navigate, sectionPath } from '../lib/router.js';

export const PORTAL_NAV_ITEMS = [
  { id: 'geral', label: 'Portal', icon: LayoutGrid },
  { id: 'lancamentos', label: 'Lançamentos', icon: CalendarClock },
  { id: 'ofertas', label: 'Em Alta & Ofertas', icon: Flame },
  { id: 'gamepass', label: 'Game Pass', icon: Gamepad2 },
  { id: 'ferramentas', label: 'Ferramentas', icon: Wrench },
];

export default function PortalHeader({
  activeSection = 'geral',
  showSearch = false,
  isGamePage = false,
}) {
  const [clocks, setClocks] = useState(() => getBrasiliaAndNzClocks());

  useEffect(() => {
    const timer = setInterval(() => {
      setClocks(getBrasiliaAndNzClocks());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090c11]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-10">
        {/* Marca */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="group flex shrink-0 items-center gap-2.5 rounded-[2px] py-1 pr-2 text-left transition hover:opacity-95"
          aria-label="Ir para a página inicial do portal"
        >
          {isGamePage && (
            <ArrowLeft className="h-4 w-4 text-white/50 transition group-hover:-translate-x-0.5 group-hover:text-xbox-neon" />
          )}
          <XboxLogo className="h-6 w-6 text-xbox-neon drop-shadow-[0_0_12px_rgba(82,214,39,0.45)]" />
          <div className={`flex items-center gap-2 ${showSearch ? 'hidden sm:flex' : ''}`}>
            <span className="font-title text-lg font-light tracking-tight text-white">
              Quando lança<span className="font-normal text-xbox-neon">?</span>
            </span>
            <span className="hidden rounded-[2px] border border-xbox-green/40 bg-xbox-green/15 px-1.5 py-0.5 font-action text-[9px] font-bold uppercase tracking-[0.18em] text-xbox-neon xl:inline-block">
              Portal BR
            </span>
          </div>
        </button>

        {/* Navegação de Portal (Desktop) */}
        <nav className="hidden items-center border-l border-white/10 pl-3 lg:flex" aria-label="Seções do portal">
          {PORTAL_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = !isGamePage && activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(sectionPath(item.id))}
                className={`relative flex items-center gap-1.5 rounded-[2px] px-3 py-1.5 font-action text-[11px] font-bold uppercase tracking-[0.12em] transition ${
                  active
                    ? 'bg-white/[0.06] text-white'
                    : 'text-white/55 hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? 'text-xbox-neon' : 'text-white/40'}`} />
                <span>{item.label}</span>
                {active && (
                  <span className="absolute inset-x-0 -bottom-[11px] h-[2px] bg-xbox-neon" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Busca larga na barra superior quando na página do jogo */}
        {showSearch ? (
          <div className="min-w-0 flex-1 lg:ml-auto lg:max-w-xl">
            <SmartSearch size="sm" slashShortcut />
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Relógio ao vivo Brasília vs Nova Zelândia */}
        <button
          type="button"
          onClick={() => navigate(sectionPath('ferramentas'))}
          title="Horário ao vivo: Brasília vs Nova Zelândia (Truque da NZ)"
          className="hidden shrink-0 items-center gap-2.5 rounded-[2px] border border-white/10 bg-[#10151d] px-3 py-1.5 text-left transition hover:border-xbox-neon/40 hover:bg-[#141b25] md:flex"
        >
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-white/80">
            <CountryFlag code="BR" className="h-2.5 w-3.5" />
            <span className="text-white/45">BRT</span>
            <strong className="font-bold text-white">{clocks.brTime}</strong>
          </span>
          <span className="h-3 w-px bg-white/15" />
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-white/80">
            <CountryFlag code="NZ" className="h-2.5 w-3.5" />
            <span className="text-white/45">NZ</span>
            <strong className="font-bold text-white">{clocks.nzTime}</strong>
            <span className="rounded-[2px] bg-xbox-green/25 px-1 py-0.2 font-action text-[10px] font-bold text-xbox-neon">
              +{clocks.diffHours}h
            </span>
          </span>
        </button>
      </div>

      {/* Navegação secundária em telas menores */}
      <div className="border-t border-white/5 bg-[#070a0e] lg:hidden">
        <div className="no-scrollbar mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto px-4 py-1.5 sm:px-6">
          {PORTAL_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = !isGamePage && activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(sectionPath(item.id))}
                className={`flex shrink-0 items-center gap-1.5 rounded-[2px] px-2.5 py-1 font-action text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                  active
                    ? 'border border-xbox-neon/40 bg-xbox-green/20 text-xbox-neon'
                    : 'text-white/55 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
