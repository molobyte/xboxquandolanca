import { ExternalLink } from 'lucide-react';
import XboxLogo from './XboxLogo.jsx';
import { navigate, sectionPath } from '../lib/router.js';

export default function PortalFooter() {
  return (
    <footer className="mt-20 border-t border-white/[0.07] bg-[#070908]">
      <div className="mx-auto flex max-w-[1540px] flex-col gap-6 px-4 py-9 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#141a16]">
            <XboxLogo className="h-4 w-4 text-xbox-neon" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-white">
              Quando lança? · Portal de Lançamentos Xbox Brasil
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Dados consultados em tempo real via Microsoft Store Display Catalog e Xbox Game Pass (mercado BR). Projeto independente não oficial.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => navigate(sectionPath('lancamentos'))}
            className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-300 transition hover:border-xbox-neon/45 hover:text-white"
          >
            Lançamentos
          </button>
          <button
            type="button"
            onClick={() => navigate(sectionPath('gamepass'))}
            className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-300 transition hover:border-xbox-neon/45 hover:text-xbox-neon"
          >
            Game Pass
          </button>
          <button
            type="button"
            onClick={() => navigate(sectionPath('ferramentas'))}
            className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-300 transition hover:border-xbox-neon/45 hover:text-white"
          >
            Truque NZ &amp; Rewards
          </button>
          <a
            href="https://www.xbox.com/pt-BR/games/all-games/console"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-300 transition hover:border-white/25 hover:text-white"
          >
            Loja Xbox BR <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href="https://rewards.bing.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-300 transition hover:border-amber-400/40 hover:text-amber-300"
          >
            Microsoft Rewards <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
