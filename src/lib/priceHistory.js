// src/lib/priceHistory.js
// Cliente para consulta de histórico de preços

const CLIENT_CACHE = new Map();

export async function getPriceHistory({ title, slug, signal } = {}) {
  const key = `${slug || ''}::${title || ''}`;
  if (CLIENT_CACHE.has(key)) {
    return CLIENT_CACHE.get(key);
  }

  try {
    const params = new URLSearchParams();
    if (slug) params.set('slug', slug);
    if (title) params.set('query', title);

    const res = await fetch(`/api/price-history?${params.toString()}`, { signal });
    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    if (json.success && json.data) {
      CLIENT_CACHE.set(key, json.data);
      return json.data;
    }
  } catch (err) {
    if (err.name === 'AbortError') return null;
    console.warn('[PriceHistory] Não foi possível carregar o histórico:', err);
  }

  return null;
}

export function formatPrice(val) {
  if (val == null || isNaN(val)) return 'N/D';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}
