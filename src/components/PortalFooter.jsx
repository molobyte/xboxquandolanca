import { ExternalLink } from 'lucide-react';
import XboxLogo from './XboxLogo.jsx';
import { navigate, sectionPath } from '../lib/router.js';

const rawUpdatedAt =
  typeof __APP_UPDATED_AT__ !== 'undefined' ? __APP_UPDATED_AT__ : new Date().toISOString();
const parsedUpdatedAt = new Date(rawUpdatedAt);
const UPDATED_AT_DATE = Number.isNaN(parsedUpdatedAt.getTime()) ? new Date() : parsedUpdatedAt;
const UPDATED_AT_ISO = UPDATED_AT_DATE.toISOString();
const UPDATED_AT_LABEL = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}).format(UPDATED_AT_DATE);

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
            <div className="mt-2 flex flex-col gap-1 text-xs text-white/45 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
              <span>
                Desenvolvido por{' '}
                <a
                  href="https://paganini.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 font-medium text-white/75 underline decoration-white/20 underline-offset-4 transition hover:text-xbox-neon hover:decoration-xbox-neon/60"
                >
                  paganini.dev
                  <ExternalLink className="h-3 w-3 text-white/45 transition-colors group-hover:text-xbox-neon" />
                </a>
              </span>
              <span className="hidden text-white/20 sm:inline" aria-hidden="true">
                ·
              </span>
              <span>
                Última atualização:{' '}
                <time dateTime={UPDATED_AT_ISO} className="tabular-nums text-white/60">
                  {UPDATED_AT_LABEL}
                </time>
              </span>
            </div>
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
