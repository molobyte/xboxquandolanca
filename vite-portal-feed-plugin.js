// vite-portal-feed-plugin.js
// Fornece o endpoint /api/portal-feed com listas oficiais ao vivo da Microsoft Store e Xbox Game Pass (BR).

const CACHE_TTL_MS = 15 * 60 * 1000;
let cachedFeed = null;
let cachedAt = 0;

const SIGLS = {
  comingSoonGp: '095bda36-f5cd-43f2-9ee1-0a72f371fb96',
  recentGp: 'f13cf6b4-57e6-4459-89df-6aec18cf0538',
  leavingSoonGp: '393f05bf-e596-4ef6-9487-6d4fa0eab987',
};

const REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

async function fetchJsonWithTimeout(url, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(url, {
      headers: { ...REQUEST_HEADERS, ...headers },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSiglIds(siglId, limit = 16) {
  const url = `https://catalog.gamepass.com/sigls/v2?id=${siglId}&language=pt-br&market=BR`;
  const data = await fetchJsonWithTimeout(url);
  if (!Array.isArray(data)) return [];
  return data
    .slice(1)
    .map((item) => item?.id)
    .filter((id) => typeof id === 'string' && /^[A-Z0-9]{12}$/i.test(id))
    .slice(0, limit);
}

async function fetchTrendingStoreIds(limit = 32) {
  const url = 'https://emerald.xboxservices.com/xboxcomfd/browse?locale=pt-BR';
  const data = await fetchJsonWithTimeout(url, {
    'x-ms-api-version': '1.0',
    'ms-cv': 'portal.1',
  });
  const channel = Object.values(data?.channels || {})[0];
  const products = channel?.products || [];
  return products
    .map((p) => p?.productId)
    .filter((id) => typeof id === 'string' && /^[A-Z0-9]{12}$/i.test(id))
    .slice(0, limit);
}

export async function fetchPortalFeed() {
  const now = Date.now();
  if (cachedFeed && now - cachedAt < CACHE_TTL_MS) {
    return cachedFeed;
  }

  const [comingSoonGp, recentGp, leavingSoonGp, trending] = await Promise.all([
    fetchSiglIds(SIGLS.comingSoonGp, 12),
    fetchSiglIds(SIGLS.recentGp, 16),
    fetchSiglIds(SIGLS.leavingSoonGp, 12),
    fetchTrendingStoreIds(36),
  ]);

  const payload = {
    comingSoonGp,
    recentGp,
    leavingSoonGp,
    trending,
    fetchedAt: new Date().toISOString(),
  };

  if (comingSoonGp.length || recentGp.length || trending.length) {
    cachedFeed = payload;
    cachedAt = now;
  }

  return payload;
}

async function handlePortalFeedMiddleware(_req, res) {
  try {
    const data = await fetchPortalFeed();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify({ success: true, data }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify({ success: false, error: err?.message || 'Erro interno' }));
  }
}

export function portalFeedPlugin() {
  return {
    name: 'xbox-portal-feed',
    configureServer(server) {
      server.middlewares.use('/api/portal-feed', handlePortalFeedMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/portal-feed', handlePortalFeedMiddleware);
    },
  };
}
