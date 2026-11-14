import { Coins, Gamepad2, Info } from 'lucide-react';
import { calcularCashbackRewards } from '../lib/rewards.js';
import { formatPrice } from '../lib/priceHistory.js';

const intFmt = new Intl.NumberFormat('pt-BR');

export default function RewardsCashbackCard({ price, inGamePass = false }) {
  if (!price || typeof price.list !== 'number') return null;

  const precoBase = price.list;
  const rows = calcularCashbackRewards(precoBase, inGamePass);

  return (
    <section
      aria-labelledby="rewards-cashback-heading"
      className="liquid-glass rounded-2xl p-4 sm:p-5"
    >
      {/* Cabeçalho alinhado ao card de Histórico de Preços */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-white/55" />
          <h3
            id="rewards-cashback-heading"
            className="font-display text-sm font-semibold tracking-tight text-white sm:text-base"
          >
            Cashback Microsoft Rewards
          </h3>
        </div>

        {precoBase > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="liquid-glass-subtle rounded-full px-2.5 py-0.5 font-mono text-[11px] text-white/75">
              Base: {formatPrice(precoBase)}
            </span>
            {inGamePass ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-xbox-neon/30 bg-xbox-green/20 px-2.5 py-0.5 text-[11px] font-medium text-xbox-mint">
                <Gamepad2 className="h-3 w-3 text-xbox-neon" />
                No catálogo Game Pass — Bônus extra ativo
              </span>
            ) : (
              <span className="liquid-glass-subtle rounded-full px-2.5 py-0.5 text-[11px] text-white/50">
                Fora do catálogo Game Pass
              </span>
            )}
          </div>
        )}
      </div>

      {precoBase <= 0 || !rows ? (
        <div className="liquid-glass-subtle mt-3.5 flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-xs text-white/60">
          <Info className="h-4 w-4 shrink-0 text-white/45" />
          <span>
            Jogos gratuitos não geram pontos de compra no Microsoft Rewards.
          </span>
        </div>
      ) : (
        <>
          <div className="liquid-glass-subtle custom-scrollbar mt-3.5 overflow-x-auto rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] text-white/45">
                  <th className="px-3.5 py-2.5 font-medium">Perfil / Assinatura</th>
                  <th className="px-3.5 py-2.5 text-right font-medium">Pontos Recebidos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {rows.map((row) => {
                  const isUltimate = row.id === 'lvl2_gp_ult';
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-white/[0.02] ${
                        isUltimate ? 'bg-xbox-green/[0.07]' : ''
                      }`}
                    >
                      <td className="px-3.5 py-2.5 font-medium text-white/90">
                        {row.perfil}
                      </td>
                      <td
                        className={`px-3.5 py-2.5 text-right font-mono font-semibold tabular-nums whitespace-nowrap ${
                          isUltimate ? 'text-xbox-neon' : 'text-white/90'
                        }`}
                      >
                        {intFmt.format(row.pontos)} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-white/40">
            Cálculo estimado com base na conversão interna da Xbox Store (~R$ 5,57/US$) sobre o valor final pago (pode variar em ~1 ponto conforme arredondamento e atualização cambial da Microsoft). O Nível 2 exige acumular 500 pontos no mês. O bônus adicional de +5% (Premium/PC) e +10% (Ultimate) aplica-se apenas a jogos do catálogo ativo do Game Pass.
          </p>
        </>
      )}
    </section>
  );
}
