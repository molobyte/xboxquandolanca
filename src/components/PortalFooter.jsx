import { ExternalLink } from 'lucide-react';
import XboxLogo from './XboxLogo.jsx';
import { navigate, sectionPath } from '../lib/router.js';

export default function PortalFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#06080b]">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="flex items-start gap-3">
          <XboxLogo className="mt-0.5 h-5 w-5 shrink-0 text-xbox-green" />
          <div>
            <p className="font-title text-sm font-normal text-white/85">
              Quando lança? · Portal de Lançamentos Xbox Brasil
            </p>
            <p className="mt-1 font-sans text-xs text-white/40">
              Dados consultados em tempo real via Microsoft Store Display Catalog e Xbox Game Pass (mercado BR). Projeto independente não oficial.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          <button
            type="button"
            onClick={() => navigate(sectionPath('lancamentos'))}
            className="font-action text-[11px] font-bold uppercase tracking-wider text-white/55 transition hover:text-xbox-neon"
          >
            Lançamentos
          </button>
          <button
            type="button"
            onClick={() => navigate(sectionPath('gamepass'))}
            className="font-action text-[11px] font-bold uppercase tracking-wider text-white/55 transition hover:text-xbox-neon"
          >
            Game Pass
          </button>
          <button
            type="button"
            onClick={() => navigate(sectionPath('ferramentas'))}
            className="font-action text-[11px] font-bold uppercase tracking-wider text-white/55 transition hover:text-xbox-neon"
          >
            Truque NZ &amp; Rewards
          </button>
          <a
            href="https://www.xbox.com/pt-BR/games/all-games/console"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-action text-[11px] font-bold uppercase tracking-wider text-white/55 transition hover:text-white"
          >
            Loja Xbox BR <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href="https://rewards.bing.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-action text-[11px] font-bold uppercase tracking-wider text-white/55 transition hover:text-amber-300"
          >
            Microsoft Rewards <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
