import { fetchPortalFeed } from '../vite-portal-feed-plugin.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const data = await fetchPortalFeed();
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, data }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: err?.message || 'Erro interno' }));
  }
}
