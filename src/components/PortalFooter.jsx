import { ExternalLink } from 'lucide-react';
import XboxLogo from './XboxLogo.jsx';
import { navigate, sectionPath } from '../lib/router.js';

export default function PortalFooter() {
  return (
    <footer className="mt-20 border-t border-white/[0.06] bg-[#060807]">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-6 px-4 py-9 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="flex items-start gap-3">
          <span className="liquid-glass-subtle mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
            <XboxLogo className="h-4 w-4 text-xbox-neon" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-white/90">
              Quando lança? · Portal de Lançamentos Xbox Brasil
            </p>
            <p className="mt-1 text-xs text-white/40">
              Dados consultados em tempo real via Microsoft Store Display Catalog e Xbox Game Pass (mercado BR). Projeto independente não oficial.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => navigate(sectionPath('lancamentos'))}
            className="liquid-glass-subtle rounded-full px-3.5 py-1.5 text-xs font-medium text-white/65 transition hover:border-white/20 hover:text-white"
          >
            Lançamentos
          </button>
          <button
            type="button"
            onClick={() => navigate(sectionPath('gamepass'))}
            className="liquid-glass-subtle rounded-full px-3.5 py-1.5 text-xs font-medium text-white/65 transition hover:border-white/20 hover:text-white"
          >
            Game Pass
          </button>
          <button
            type="button"
            onClick={() => navigate(sectionPath('ferramentas'))}
            className="liquid-glass-subtle rounded-full px-3.5 py-1.5 text-xs font-medium text-white/65 transition hover:border-white/20 hover:text-white"
          >
            Truque NZ &amp; Rewards
          </button>
          <a
            href="https://www.xbox.com/pt-BR/games/all-games/console"
            target="_blank"
            rel="noreferrer"
            className="liquid-glass-subtle inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/65 transition hover:border-white/20 hover:text-white"
          >
            Loja Xbox BR <ExternalLink className="h-3 w-3 text-white/45" />
          </a>
          <a
            href="https://rewards.bing.com"
            target="_blank"
            rel="noreferrer"
            className="liquid-glass-subtle inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/65 transition hover:border-white/20 hover:text-white"
          >
            Microsoft Rewards <ExternalLink className="h-3 w-3 text-white/45" />
          </a>
        </div>
      </div>
    </footer>
  );
}
