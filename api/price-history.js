import { fetchPriceHistoryFromDeku } from '../vite-price-history-plugin.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const urlObj = new URL(req.url || '', 'http://localhost');
    const slug = (req.query?.slug ?? urlObj.searchParams.get('slug') ?? '').trim();
    const query = (req.query?.query ?? urlObj.searchParams.get('query') ?? '').trim();

    if (!slug && !query) {
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, error: 'slug ou query é obrigatório' }));
      return;
    }

    const data = await fetchPriceHistoryFromDeku({ slug, query });

    if (data) {
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, data }));
    } else {
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      res.statusCode = 200;
      res.end(JSON.stringify({ success: false, error: 'Histórico não encontrado' }));
    }
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: err?.message || 'Erro interno' }));
  }
}
