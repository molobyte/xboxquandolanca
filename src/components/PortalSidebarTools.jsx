import { useEffect, useState } from 'react';
import { Calculator, Clock, ExternalLink, Globe, HelpCircle, Link2, Zap } from 'lucide-react';
import CountryFlag from './CountryFlag.jsx';
import { getBrasiliaAndNzClocks } from '../lib/portal.js';
import { calcularPontosRewards, formatarPontosRewards, REWARDS_TAXA_PADRAO } from '../lib/rewards.js';
import { gamePath, navigate, sectionPath } from '../lib/router.js';

const PRESET_PRICES = [50, 149, 199, 299, 349];

const WORLD_ZONES = [
  { code: 'NZ', name: 'Nova Zelândia (Auckland)', timeZone: 'Pacific/Auckland' },
  { code: 'JP', name: 'Japão (Tóquio)', timeZone: 'Asia/Tokyo' },
  { code: 'GB', name: 'Reino Unido (Londres)', timeZone: 'Europe/London' },
  { code: 'BR', name: 'Brasil (Brasília)', timeZone: 'America/Sao_Paulo' },
  { code: 'US', name: 'Estados Unidos (Nova York)', timeZone: 'America/New_York' },
];

function formatZoneClock(nowMs, timeZone) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(nowMs));
}

export function NzTimezoneWidget({ expanded = false }) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  const clocks = getBrasiliaAndNzClocks(nowMs);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#151c33]/90 p-5 shadow-portal-card backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-xbox-neon">
          <Zap className="h-3.5 w-3.5" />
          Radar Nova Zelândia
        </span>
        <span className="rounded-full border border-amber-400/35 bg-amber-400/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
          +{clocks.diffHours}h à frente
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-white/[0.07] bg-[#0d1223] p-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <CountryFlag code="BR" className="h-2.5 w-3.5" />
            <span className="font-semibold uppercase tracking-wider">Brasília</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-white">{clocks.brTime}</p>
          <p className="font-mono text-[10px] text-slate-400">{clocks.brDate}</p>
        </div>

        <div className="rounded-xl border border-xbox-neon/30 bg-xbox-green/15 p-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-200">
            <CountryFlag code="NZ" className="h-2.5 w-3.5" />
            <span className="font-semibold uppercase tracking-wider text-xbox-neon">Auckland</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-white">{clocks.nzTime}</p>
          <p className="font-mono text-[10px] text-slate-300/80">{clocks.nzDate}</p>
        </div>
      </div>

      <p className="mt-3.5 text-xs leading-relaxed text-slate-300/75">
        Em lançamentos por horário local (meia-noite regional), mudar o console para a Nova Zelândia libera o acesso até{' '}
        <strong className="text-white">{clocks.diffHours}h antes</strong> do Brasil.
      </p>

      {expanded ? (
        <div className="mt-4 space-y-4 border-t border-white/[0.08] pt-4">
          <div>
            <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-200">
              <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
              Passo a passo no console Xbox
            </h4>
            <ol className="mt-2 list-inside list-decimal space-y-1.5 text-xs text-slate-300/80">
              <li>
                Abra <strong className="text-white">Configurações &gt; Sistema &gt; Idioma e Localidade</strong>.
              </li>
              <li>
                Troque a <strong className="text-white">Localidade</strong> para <strong className="text-white">Nova Zelândia</strong>.
              </li>
              <li>
                Clique em <strong className="text-white">Reiniciar agora</strong>. Ao terminar de jogar antecipado, basta voltar para <strong className="text-white">Brasil</strong>.
              </li>
            </ol>
          </div>

          <div>
            <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-200">
              <Globe className="h-3.5 w-3.5 text-portal-cyan" />
              Horários atuais nas lojas Xbox
            </h4>
            <div className="mt-2 divide-y divide-white/[0.06] rounded-xl border border-white/[0.07] bg-[#0d1223]">
              {WORLD_ZONES.map((z) => (
                <div key={z.code} className="flex items-center justify-between px-3 py-2.5 text-xs">
                  <span className="flex items-center gap-2 text-slate-200">
                    <CountryFlag code={z.code} className="h-3 w-4" />
                    {z.name}
                  </span>
                  <span className="font-mono text-white">{formatZoneClock(nowMs, z.timeZone)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => navigate(sectionPath('ferramentas'))}
          className="mt-4 flex w-full items-center justify-between rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-200 transition hover:border-portal-blue/50 hover:bg-portal-blue/15 hover:text-white"
        >
          <span>Guia passo a passo &amp; fusos</span>
          <span className="text-portal-cyan">&rarr;</span>
        </button>
      )}
    </div>
  );
}

export function RewardsCalculatorWidget({ expanded = false }) {
  const [rawValue, setRawValue] = useState('299');
  const numericPrice = Number(String(rawValue).replace(',', '.'));
  const validPrice = Number.isFinite(numericPrice) && numericPrice > 0 ? numericPrice : 0;
  const pontos = calcularPontosRewards(validPrice);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#151c33]/90 p-5 shadow-portal-card backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-300">
          <Calculator className="h-3.5 w-3.5" />
          Calculadora Rewards BR
        </span>
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-slate-300">
          {REWARDS_TAXA_PADRAO} pts/R$
        </span>
      </div>

      <p className="mt-2.5 text-xs text-slate-300/75">
        Estime quantos pontos Microsoft Rewards você precisa para resgatar em cartões-presente Xbox.
      </p>

      <div className="mt-3.5 flex items-center rounded-xl border border-white/[0.1] bg-[#0d1223] px-3.5 focus-within:border-amber-400/60">
        <span className="text-xs font-bold text-slate-400">R$</span>
        <input
          type="text"
          inputMode="decimal"
          value={rawValue}
          onChange={(e) => setRawValue(e.target.value.replace(/[^0-9.,]/g, ''))}
          placeholder="299,00"
          aria-label="Valor do jogo em reais"
          className="w-full bg-transparent px-2 py-2.5 font-display text-lg font-bold text-white outline-none"
        />
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {PRESET_PRICES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setRawValue(String(p))}
            className={`rounded-full border px-2.5 py-1 font-mono text-[11px] transition ${
              Number(rawValue) === p
                ? 'border-amber-400/50 bg-amber-400/20 text-amber-200'
                : 'border-white/[0.08] bg-white/[0.04] text-slate-300 hover:border-white/25 hover:text-white'
            }`}
          >
            R$ {p}
          </button>
        ))}
      </div>

      <div className="mt-3.5 rounded-xl border border-amber-400/25 bg-amber-400/[0.09] p-3.5">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-200/80">
          Pontos estimados necessários
        </span>
        <p className="mt-0.5 font-display text-2xl font-bold text-amber-300">
          {pontos ? `${formatarPontosRewards(pontos)} pts` : '—'}
        </p>
      </div>

      {expanded && (
        <div className="mt-3 rounded-xl border border-white/[0.07] bg-[#0d1223] p-3 text-xs text-slate-300/80">
          Baseado na média de resgate de Gift Cards Xbox no Brasil ({REWARDS_TAXA_PADRAO} pontos por R$ 1,00 arredondado para múltiplos de 5).
        </div>
      )}

      <a
        href="https://rewards.bing.com"
        target="_blank"
        rel="noreferrer"
        className="mt-3.5 flex w-full items-center justify-between rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-200 transition hover:border-amber-400/45 hover:bg-amber-400/10 hover:text-amber-200"
      >
        <span>Abrir painel Microsoft Rewards</span>
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

const SAMPLE_LINKS = [
  { id: '9P3H4968GRSM', label: 'Grand Theft Auto VI' },
  { id: '9PMN4DGRT1LN', label: 'Fable' },
  { id: '9NW6JK0ZC9J6', label: 'Tropico 7' },
  { id: '9N431PX143P8', label: 'Forza Horizon 6' },
];

export function StoreLookupGuideWidget() {
  return (
    <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#151c33]/90 p-5 shadow-portal-card backdrop-blur-xl">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-200">
        <Link2 className="h-3.5 w-3.5 text-portal-cyan" />
        Atalhos &amp; Formatos de Busca
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-slate-300/75">
        Cole links completos da Microsoft Store, URLs do site Xbox ou o código BigId de 12 caracteres direto na busca superior.
      </p>

      <div className="mt-3.5 space-y-2 font-mono text-[11px] text-slate-300">
        <div className="truncate rounded-xl border border-white/[0.07] bg-[#0d1223] px-3 py-2">
          xbox.com/pt-BR/games/store/…/<span className="text-portal-cyan">9P3H4968GRSM</span>
        </div>
        <div className="truncate rounded-xl border border-white/[0.07] bg-[#0d1223] px-3 py-2">
          apps.microsoft.com/detail/<span className="text-portal-cyan">9PMN4DGRT1LN</span>
        </div>
      </div>

      <div className="mt-3.5 border-t border-white/[0.08] pt-3.5">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Consultas rápidas
        </span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SAMPLE_LINKS.map((item) => (
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
      </div>
    </div>
  );
}

export function PortalClockStrip({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#151c33]/90 p-4">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-300">
        <Clock className="h-3.5 w-3.5 text-portal-cyan" />
        {title}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
