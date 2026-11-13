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
    <div className="liquid-glass rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
          <Zap className="h-3.5 w-3.5 text-xbox-neon" />
          Radar Nova Zelândia
        </span>
        <span className="liquid-glass-subtle rounded-full px-2.5 py-0.5 text-[10px] font-medium text-white/75">
          +{clocks.diffHours}h à frente
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="liquid-glass-subtle rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[11px] text-white/45">
            <CountryFlag code="BR" className="h-2.5 w-3.5" />
            <span className="font-medium uppercase tracking-wider">Brasília</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-white">{clocks.brTime}</p>
          <p className="font-mono text-[10px] text-white/40">{clocks.brDate}</p>
        </div>

        <div className="liquid-glass-subtle rounded-xl border-xbox-neon/25 bg-xbox-green/[0.12] p-3">
          <div className="flex items-center gap-1.5 text-[11px] text-white/75">
            <CountryFlag code="NZ" className="h-2.5 w-3.5" />
            <span className="font-medium uppercase tracking-wider text-xbox-neon">Auckland</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-white">{clocks.nzTime}</p>
          <p className="font-mono text-[10px] text-white/55">{clocks.nzDate}</p>
        </div>
      </div>

      <p className="mt-3.5 text-xs leading-relaxed text-white/60">
        Em lançamentos por horário local (meia-noite regional), mudar o console para a Nova Zelândia libera o acesso até{' '}
        <strong className="font-semibold text-white">{clocks.diffHours}h antes</strong> do Brasil.
      </p>

      {expanded ? (
        <div className="mt-4 space-y-4 border-t border-white/[0.06] pt-4">
          <div>
            <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/70">
              <HelpCircle className="h-3.5 w-3.5 text-white/45" />
              Passo a passo no console Xbox
            </h4>
            <ol className="mt-2 list-inside list-decimal space-y-1.5 text-xs text-white/65">
              <li>
                Abra <strong className="font-medium text-white">Configurações &gt; Sistema &gt; Idioma e Localidade</strong>.
              </li>
              <li>
                Troque a <strong className="font-medium text-white">Localidade</strong> para <strong className="font-medium text-white">Nova Zelândia</strong>.
              </li>
              <li>
                Clique em <strong className="font-medium text-white">Reiniciar agora</strong>. Ao terminar de jogar antecipado, basta voltar para <strong className="font-medium text-white">Brasil</strong>.
              </li>
            </ol>
          </div>

          <div>
            <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/70">
              <Globe className="h-3.5 w-3.5 text-xbox-neon" />
              Horários atuais nas lojas Xbox
            </h4>
            <div className="liquid-glass-subtle mt-2 divide-y divide-white/[0.05] rounded-xl">
              {WORLD_ZONES.map((z) => (
                <div key={z.code} className="flex items-center justify-between px-3 py-2.5 text-xs">
                  <span className="flex items-center gap-2 text-white/75">
                    <CountryFlag code={z.code} className="h-3 w-4" />
                    {z.name}
                  </span>
                  <span className="font-mono text-white/90">{formatZoneClock(nowMs, z.timeZone)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => navigate(sectionPath('ferramentas'))}
          className="liquid-glass-subtle mt-4 flex w-full items-center justify-between rounded-full px-4 py-2 text-xs font-medium text-white/75 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
        >
          <span>Guia passo a passo &amp; fusos</span>
          <span className="text-white/50">&rarr;</span>
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
    <div className="liquid-glass rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
          <Calculator className="h-3.5 w-3.5 text-xbox-neon" />
          Calculadora Rewards BR
        </span>
        <span className="liquid-glass-subtle rounded-full px-2 py-0.5 font-mono text-[10px] text-white/55">
          {REWARDS_TAXA_PADRAO} pts/R$
        </span>
      </div>

      <p className="mt-2.5 text-xs text-white/55">
        Estime quantos pontos Microsoft Rewards você precisa para resgatar em cartões-presente Xbox.
      </p>

      <div className="liquid-glass-subtle mt-3.5 flex items-center rounded-xl px-3.5 focus-within:border-white/25">
        <span className="text-xs font-semibold text-white/45">R$</span>
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
                ? 'border-white/25 bg-white/[0.12] text-white'
                : 'border-white/[0.06] bg-white/[0.03] text-white/55 hover:border-white/15 hover:text-white'
            }`}
          >
            R$ {p}
          </button>
        ))}
      </div>

      <div className="liquid-glass-subtle mt-3.5 rounded-xl p-3.5">
        <span className="block text-[10px] font-medium uppercase tracking-wider text-white/45">
          Pontos estimados necessários
        </span>
        <p className="mt-0.5 font-display text-2xl font-bold text-white">
          {pontos ? `${formatarPontosRewards(pontos)} pts` : '—'}
        </p>
      </div>

      {expanded && (
        <div className="liquid-glass-subtle mt-3 rounded-xl p-3 text-xs text-white/55">
          Baseado na média de resgate de Gift Cards Xbox no Brasil ({REWARDS_TAXA_PADRAO} pontos por R$ 1,00 arredondado para múltiplos de 5).
        </div>
      )}

      <a
        href="https://rewards.bing.com"
        target="_blank"
        rel="noreferrer"
        className="liquid-glass-subtle mt-3.5 flex w-full items-center justify-between rounded-full px-4 py-2 text-xs font-medium text-white/75 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
      >
        <span>Abrir painel Microsoft Rewards</span>
        <ExternalLink className="h-3.5 w-3.5 text-white/45" />
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
    <div className="liquid-glass min-w-0 rounded-2xl p-5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
        <Link2 className="h-3.5 w-3.5 text-xbox-neon" />
        Atalhos &amp; Formatos de Busca
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-white/55">
        Cole links completos da Microsoft Store, URLs do site Xbox ou o código BigId de 12 caracteres direto na busca superior.
      </p>

      <div className="mt-3.5 space-y-2 font-mono text-[11px] text-white/65">
        <div className="liquid-glass-subtle truncate rounded-xl px-3 py-2">
          xbox.com/pt-BR/games/store/…/<span className="text-xbox-neon">9P3H4968GRSM</span>
        </div>
        <div className="liquid-glass-subtle truncate rounded-xl px-3 py-2">
          apps.microsoft.com/detail/<span className="text-xbox-neon">9PMN4DGRT1LN</span>
        </div>
      </div>

      <div className="mt-3.5 border-t border-white/[0.06] pt-3.5">
        <span className="block text-[10px] font-medium uppercase tracking-wider text-white/40">
          Consultas rápidas
        </span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SAMPLE_LINKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(gamePath(item.id))}
              className="liquid-glass-subtle rounded-full px-3 py-1 text-xs font-medium text-white/75 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
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
    <div className="rounded-2xl border border-white/[0.08] bg-[#141a16]/90 p-4">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-300">
        <Clock className="h-3.5 w-3.5 text-xbox-neon" />
        {title}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
