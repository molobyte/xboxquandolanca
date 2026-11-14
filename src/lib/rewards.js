/**
 * Cálculo de pontos Microsoft Rewards para resgatar cartões de presente Xbox (BR).
 * Lógica baseada na extensão xbox-rewards-extension:
 * Preço arredondado para cima (Math.ceil) * taxa (172.1), arredondado para múltiplos de 5.
 */

export const REWARDS_TAXA_PADRAO = 172.1;

export function roundTo4(valor) {
  return Math.round(valor * 10000) / 10000;
}

export function calcularPontosRewards(preco, taxa = REWARDS_TAXA_PADRAO) {
  if (typeof preco !== 'number' || preco <= 0) return null;
  const precoArredondado = Math.ceil(preco);
  const base = roundTo4(precoArredondado * taxa);
  return 5 * Math.round(base / 5);
}

export function formatarPontosRewards(pontos) {
  if (!pontos) return null;
  return new Intl.NumberFormat('pt-BR').format(pontos);
}

/**
 * Regras Microsoft Rewards para cashback de pontos em compras na Xbox Store Brasil.
 */
export const TAXA_CAMBIO_USD = 5.567;
export const REWARDS_CASHBACK_PONTOS_POR_REAL = 175;

const REWARDS_CASHBACK_PERFIS = [
  {
    id: 'lvl1',
    label: 'Nível 1 (Sem Game Pass / Essential)',
    getRule: () => ({ base: 1, bonus: 0, total: 1 }),
  },
  {
    id: 'lvl2',
    label: 'Nível 2 (Sem Game Pass / Essential)',
    getRule: () => ({ base: 10, bonus: 0, total: 10 }),
  },
  {
    id: 'lvl2_gp_std',
    label: 'Nível 2 + Game Pass Premium / PC',
    getRule: (inGamePass) =>
      inGamePass ? { base: 20, bonus: 50, total: 70 } : { base: 20, bonus: 0, total: 20 },
  },
  {
    id: 'lvl2_gp_ult',
    label: 'Nível 2 + Game Pass Ultimate',
    getRule: (inGamePass) =>
      inGamePass ? { base: 40, bonus: 100, total: 140 } : { base: 40, bonus: 0, total: 40 },
  },
];

/**
 * Calcula a tabela de cashback de pontos Microsoft Rewards para uma compra em BRL.
 * Retorna null se o preço base for inválido ou gratuito (<= 0).
 */
export function calcularCashbackRewards(precoBase, inGamePass = false) {
  if (typeof precoBase !== 'number' || Number.isNaN(precoBase) || precoBase <= 0) {
    return null;
  }

  const isGp = Boolean(inGamePass);

  return REWARDS_CASHBACK_PERFIS.map((perfil) => {
    const { base, bonus, total } = perfil.getRule(isGp);
    const usd = precoBase / TAXA_CAMBIO_USD;
    // A Xbox Store trunca separadamente a pontuação base da compra e o bônus do catálogo Game Pass.
    const pontosBase = Math.floor(usd * base);
    const pontosBonus = bonus > 0 ? Math.floor(usd * bonus) : 0;
    const pontos = pontosBase + pontosBonus;
    const valorCashbackBRL = pontos / REWARDS_CASHBACK_PONTOS_POR_REAL;
    const percentualCashback = (valorCashbackBRL / precoBase) * 100;
    const regraTexto =
      bonus > 0
        ? `${total} pts / US$ 1 (${base} + ${bonus} bônus)`
        : `${total} ${total === 1 ? 'pt' : 'pts'} / US$ 1`;

    return {
      id: perfil.id,
      perfil: perfil.label,
      pontosPorUsd: total,
      basePorUsd: base,
      bonusPorUsd: bonus,
      regraTexto,
      pontos,
      valorCashbackBRL,
      percentualCashback,
    };
  });
}
