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

const UPCOMING_FILTERS_B64 = Buffer.from(
  JSON.stringify({
    orderby: { id: 'orderby', choices: [{ id: 'ReleaseDate desc' }] },
  })
).toString('base64');

async function fetchJsonWithTimeout(url, headers = {}, options = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 7000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: { ...REQUEST_HEADERS, ...headers },
      ...(options.body ? { body: options.body } : {}),
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

async function fetchUpcomingStoreIds(maxPages = 8) {
  const seen = new Set();
  const ids = [];
  let encodedCT;
  const nowMs = Date.now();
  const cutoffMs = nowMs - 24 * 60 * 60 * 1000;

  for (let page = 0; page < maxPages; page++) {
    const body = JSON.stringify({
      Filters: UPCOMING_FILTERS_B64,
      ReturnFilters: false,
      ChannelKeyToBeUsedInResponse: 'BROWSE_CHANNELID=_FILTERS=ORDERBY=RELEASEDATE DESC',
      ChannelId: '',
      ...(encodedCT ? { EncodedCT: encodedCT } : {}),
    });

    const data = await fetchJsonWithTimeout(
      'https://emerald.xboxservices.com/xboxcomfd/browse?locale=pt-BR',
      {
        'x-ms-api-version': '1.1',
        'ms-cv': 'portal.1',
        'Content-Type': 'application/json',
      },
      { method: 'POST', body, timeoutMs: 5000 }
    );

    if (!data) break;

    const channel = Object.values(data.channels || {})[0];
    const products = channel?.products || [];
    for (const p of products) {
      const id = p?.productId;
      if (typeof id === 'string' && /^[A-Z0-9]{12}$/i.test(id) && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }

    const summaries = Array.isArray(data.productSummaries)
      ? data.productSummaries
      : Object.values(data.productSummaries || {});

    let futureCount = 0;
    let oldestValidTs = null;
    for (const s of summaries) {
      if (!s?.releaseDate) continue;
      const d = new Date(s.releaseDate);
      const ts = d.getTime();
      if (Number.isNaN(ts) || d.getUTCFullYear() < 1900 || d.getUTCFullYear() >= 2099) continue;
      if (ts > nowMs) futureCount++;
      if (oldestValidTs === null || ts < oldestValidTs) oldestValidTs = ts;
    }

    encodedCT = channel?.encodedCT;
    if (!encodedCT || (futureCount === 0 && oldestValidTs !== null && oldestValidTs < cutoffMs)) {
      break;
    }
  }

  return ids;
}

export async function fetchPortalFeed() {
  const now = Date.now();
  if (cachedFeed && now - cachedAt < CACHE_TTL_MS) {
    return cachedFeed;
  }

  const [comingSoonGp, recentGp, leavingSoonGp, trending, upcomingStore] = await Promise.all([
    fetchSiglIds(SIGLS.comingSoonGp, 16),
    fetchSiglIds(SIGLS.recentGp, 16),
    fetchSiglIds(SIGLS.leavingSoonGp, 12),
    fetchTrendingStoreIds(36),
    fetchUpcomingStoreIds(8),
  ]);

  const payload = {
    comingSoonGp,
    recentGp,
    leavingSoonGp,
    trending,
    upcomingStore,
    fetchedAt: new Date().toISOString(),
  };

  if (comingSoonGp.length || recentGp.length || trending.length || upcomingStore.length) {
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
