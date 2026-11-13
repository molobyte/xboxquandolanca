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
    <div className="rounded-[2px] border border-white/12 border-t-2 border-t-xbox-neon bg-[#0d1218] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-action text-[11px] font-bold uppercase tracking-[0.16em] text-xbox-neon">
          <Zap className="h-3.5 w-3.5" />
          Radar Nova Zelândia
        </span>
        <span className="rounded-[2px] border border-amber-400/35 bg-amber-400/10 px-1.5 py-0.5 font-action text-[10px] font-bold text-amber-300">
          +{clocks.diffHours}h à frente
        </span>
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-2">
        <div className="rounded-[2px] border border-white/10 bg-[#121821] p-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-white/55">
            <CountryFlag code="BR" className="h-2.5 w-3.5" />
            <span className="font-action uppercase tracking-wider">Brasília</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-white">{clocks.brTime}</p>
          <p className="font-mono text-[10px] text-white/40">{clocks.brDate}</p>
        </div>

        <div className="rounded-[2px] border border-xbox-green/40 bg-xbox-green/10 p-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-white/75">
            <CountryFlag code="NZ" className="h-2.5 w-3.5" />
            <span className="font-action uppercase tracking-wider text-xbox-neon">Auckland</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-white">{clocks.nzTime}</p>
          <p className="font-mono text-[10px] text-white/55">{clocks.nzDate}</p>
        </div>
      </div>

      <p className="mt-3 font-sans text-xs leading-relaxed text-white/60">
        Em lançamentos por horário local (meia-noite regional), mudar o console para a Nova Zelândia libera o acesso até{' '}
        <strong className="text-white">{clocks.diffHours}h antes</strong> do Brasil.
      </p>

      {expanded ? (
        <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
          <div>
            <h4 className="flex items-center gap-1.5 font-action text-[11px] font-bold uppercase tracking-wider text-white/75">
              <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
              Passo a passo no console Xbox
            </h4>
            <ol className="mt-2 list-inside list-decimal space-y-1.5 font-sans text-xs text-white/70">
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
            <h4 className="flex items-center gap-1.5 font-action text-[11px] font-bold uppercase tracking-wider text-white/75">
              <Globe className="h-3.5 w-3.5 text-xbox-neon" />
              Horários atuais nas lojas Xbox
            </h4>
            <div className="mt-2 divide-y divide-white/5 rounded-[2px] border border-white/10 bg-[#090d12]">
              {WORLD_ZONES.map((z) => (
                <div key={z.code} className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="flex items-center gap-2 text-white/80">
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
          className="mt-3 flex w-full items-center justify-between rounded-[2px] border border-white/10 bg-white/[0.03] px-3 py-2 font-action text-[11px] font-bold uppercase tracking-wider text-white/75 transition hover:border-xbox-neon/40 hover:bg-white/[0.06] hover:text-white"
        >
          <span>Guia passo a passo &amp; fusos</span>
          <span className="text-xbox-neon">&rarr;</span>
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
    <div className="rounded-[2px] border border-white/12 border-t-2 border-t-amber-400 bg-[#0d1218] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-action text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300">
          <Calculator className="h-3.5 w-3.5" />
          Calculadora Rewards BR
        </span>
        <span className="font-mono text-[10px] text-white/40">{REWARDS_TAXA_PADRAO} pts/R$</span>
      </div>

      <p className="mt-2 font-sans text-xs text-white/55">
        Estime quantos pontos Microsoft Rewards você precisa para resgatar em cartões-presente Xbox.
      </p>

      <div className="mt-3 flex items-center rounded-[2px] border border-white/15 bg-[#080b0f] px-3 focus-within:border-amber-400">
        <span className="font-action text-xs font-bold text-white/45">R$</span>
        <input
          type="text"
          inputMode="decimal"
          value={rawValue}
          onChange={(e) => setRawValue(e.target.value.replace(/[^0-9.,]/g, ''))}
          placeholder="299,00"
          aria-label="Valor do jogo em reais"
          className="w-full bg-transparent px-2 py-2 font-display text-lg font-bold text-white outline-none"
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {PRESET_PRICES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setRawValue(String(p))}
            className={`rounded-[2px] border px-2 py-1 font-mono text-[11px] transition ${
              Number(rawValue) === p
                ? 'border-amber-400/50 bg-amber-400/15 text-amber-200'
                : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white'
            }`}
          >
            R$ {p}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-[2px] border border-amber-400/25 bg-amber-400/10 p-3">
        <span className="block font-action text-[10px] font-bold uppercase tracking-wider text-amber-200/80">
          Pontos estimados necessários
        </span>
        <p className="mt-0.5 font-display text-2xl font-bold text-amber-300">
          {pontos ? `${formatarPontosRewards(pontos)} pts` : '—'}
        </p>
      </div>

      {expanded && (
        <div className="mt-3 rounded-[2px] border border-white/10 bg-[#090d12] p-3 text-xs text-white/65">
          Baseado na média de resgate de Gift Cards Xbox no Brasil ({REWARDS_TAXA_PADRAO} pontos por R$ 1,00 arredondado para múltiplos de 5).
        </div>
      )}

      <a
        href="https://rewards.bing.com"
        target="_blank"
        rel="noreferrer"
        className="mt-3 flex w-full items-center justify-between rounded-[2px] border border-white/10 bg-white/[0.03] px-3 py-2 font-action text-[11px] font-bold uppercase tracking-wider text-white/75 transition hover:border-amber-400/40 hover:text-amber-200"
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
    <div className="min-w-0 rounded-[2px] border border-white/12 bg-[#0d1218] p-4 sm:p-5">
      <div className="flex items-center gap-1.5 font-action text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
        <Link2 className="h-3.5 w-3.5 text-xbox-neon" />
        Atalhos &amp; Formatos de Busca
      </div>
      <p className="mt-2 font-sans text-xs leading-relaxed text-white/55">
        Cole links completos da Microsoft Store, URLs do site Xbox ou o código BigId de 12 caracteres direto na busca superior.
      </p>

      <div className="mt-3 space-y-1.5 font-mono text-[11px] text-white/60">
        <div className="truncate rounded-[2px] border border-white/10 bg-[#080b0f] px-2.5 py-1.5">
          xbox.com/pt-BR/games/store/…/<span className="text-xbox-neon">9P3H4968GRSM</span>
        </div>
        <div className="truncate rounded-[2px] border border-white/10 bg-[#080b0f] px-2.5 py-1.5">
          apps.microsoft.com/detail/<span className="text-xbox-neon">9PMN4DGRT1LN</span>
        </div>
      </div>

      <div className="mt-3 border-t border-white/10 pt-3">
        <span className="block font-action text-[10px] font-bold uppercase tracking-wider text-white/45">
          Consultas rápidas
        </span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SAMPLE_LINKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(gamePath(item.id))}
              className="rounded-[2px] border border-white/10 bg-white/[0.03] px-2 py-1 font-sans text-xs text-white/75 transition hover:border-xbox-neon/50 hover:bg-xbox-green/15 hover:text-white"
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
    <div className="rounded-[2px] border border-white/10 bg-[#0d1218] p-4">
      <div className="flex items-center gap-2 font-action text-[11px] font-bold uppercase tracking-wider text-white/60">
        <Clock className="h-3.5 w-3.5 text-xbox-neon" />
        {title}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
