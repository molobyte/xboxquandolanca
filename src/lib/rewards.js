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
