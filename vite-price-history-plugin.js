// vite-price-history-plugin.js
// Plugin para Vite fornecer o endpoint /api/price-history usando a lógica de dd-study (Deku Deals)

const CACHE = new Map();

function cleanTitle(title = '') {
  return title
    .replace(/\s*[-–—]\s*(edição\s+padrão|standard\s+edition|edição\s+deluxe|deluxe\s+edition|edição\s+premium|premium\s+edition|edição\s+definitiva|definitive\s+edition|bundle|pacote).*/i, '')
    .replace(/\s*\(xbox\s+(one|series\s+[xs])\)/i, '')
    .trim();
}

function slugify(text = '') {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function extractPriceData(html, sourceUrl) {
  const match = html.match(/id=['"]price_history_data['"][^>]*>(.*?)<\/script>/s);
  if (!match) return null;

  let rawData;
  try {
    rawData = JSON.parse(match[1]);
  } catch (e) {
    return null;
  }

  const headers = rawData.headers || [];
  const rows = rawData.data || [];

  if (rows.length === 0) return null;

  // Descobre todas as colunas do Xbox / Microsoft Store
  const xboxColIndices = [];
  let storeName = 'Microsoft Store';

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase();
    if (h.includes('xbox') || h.includes('microsoft')) {
      xboxColIndices.push(i);
      storeName = headers[i];
    }
  }

  // Se não encontrou coluna explícita de Xbox, usa a primeira coluna de preço disponível
  if (xboxColIndices.length === 0 && headers.length > 0) {
    xboxColIndices.push(0);
    storeName = headers[0];
  }

  // Extrai nome do jogo do <title>
  let gameTitle = 'Jogo';
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    gameTitle = titleMatch[1].replace(/\s*[-|]\s*Deku Deals.*$/i, '').trim();
  }

  const history = [];
  let lowestPrice = Infinity;
  let highestPrice = 0;
  let lowestDate = '';
  let lastPrice = null;

  for (const row of rows) {
    const date = row[0];
    let price = null;

    // Se houver múltiplas colunas do Xbox, busca da coluna mais recente para a mais antiga
    for (let j = xboxColIndices.length - 1; j >= 0; j--) {
      const colIdx = xboxColIndices[j] + 2;
      const val = row[colIdx];
      if (val !== null && val !== undefined && !isNaN(val)) {
        price = Number(val);
        break;
      }
    }

    if (price !== null) {
      history.push({ date, price });
      lastPrice = price;

      if (price < lowestPrice) {
        lowestPrice = price;
        lowestDate = date;
      }
      if (price > highestPrice) {
        highestPrice = price;
      }
    }
  }

  if (history.length === 0) {
    return null;
  }

  // Identifica mudanças de preço para exibição tabular
  const priceChanges = [];
  let prevPrice = null;

  for (const item of history) {
    if (prevPrice === null || item.price !== prevPrice) {
      priceChanges.push({
        date: item.date,
        price: item.price,
        diff: prevPrice !== null ? +(item.price - prevPrice).toFixed(2) : 0,
      });
      prevPrice = item.price;
    }
  }

  return {
    gameTitle,
    sourceUrl,
    storeName,
    currentPrice: lastPrice,
    lowestPrice: lowestPrice === Infinity ? null : lowestPrice,
    lowestDate,
    highestPrice,
    totalPoints: history.length,
    history,
    recentChanges: priceChanges.slice(-8).reverse(),
  };
}

const REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
};

async function fetchDekuItemHtml(itemPathOrSlug) {
  const cleanPath = itemPathOrSlug.startsWith('/items/')
    ? itemPathOrSlug.split('?')[0]
    : `/items/${itemPathOrSlug.replace(/^\/+/, '').split('?')[0]}`;
  const targetUrl = `https://www.dekudeals.com${cleanPath}?country=br&platform=all`;

  const res = await fetch(targetUrl, {
    headers: REQUEST_HEADERS,
    redirect: 'follow',
  });

  if (!res.ok || !res.url.includes('/items/')) return null;

  // Caso tenha ocorrido redirecionamento para outro slug sem manter country=br e platform=all
  if (!res.url.includes('country=br') || !res.url.includes('platform=all')) {
    const redirectedUrl = new URL(res.url);
    redirectedUrl.searchParams.set('country', 'br');
    redirectedUrl.searchParams.set('platform', 'all');
    const retryRes = await fetch(redirectedUrl.toString(), {
      headers: REQUEST_HEADERS,
      redirect: 'follow',
    });
    if (!retryRes.ok) return null;
    return { html: await retryRes.text(), url: retryRes.url };
  }

  return { html: await res.text(), url: res.url };
}

export async function fetchPriceHistoryFromDeku({ slug, query }) {
  const cacheKey = (slug || '') + '::' + (query || '');
  if (CACHE.has(cacheKey)) {
    return CACHE.get(cacheKey);
  }

  const candidates = [];
  if (slug) candidates.push(slug);
  if (query) {
    const cleaned = cleanTitle(query);
    const cleanedSlug = slugify(cleaned);
    if (cleanedSlug && !candidates.includes(cleanedSlug)) candidates.push(cleanedSlug);
    const fullSlug = slugify(query);
    if (fullSlug && !candidates.includes(fullSlug)) candidates.push(fullSlug);
  }

  // 1. Tenta buscar direto por cada slug candidato (forçando country=br)
  for (const candidate of candidates) {
    try {
      const result = await fetchDekuItemHtml(candidate);
      if (result) {
        const parsed = extractPriceData(result.html, result.url);
        if (parsed) {
          CACHE.set(cacheKey, parsed);
          return parsed;
        }
      }
    } catch {
      // continua tentando
    }
  }

  // 2. Se slugs diretos não funcionaram, tenta busca no Deku Deals
  const searchQuery = query ? cleanTitle(query) : (slug || '').replace(/-/g, ' ');
  if (!searchQuery) return null;

  const searchUrl = `https://www.dekudeals.com/search?q=${encodeURIComponent(searchQuery)}&country=br&platform=all`;

  try {
    const searchRes = await fetch(searchUrl, {
      headers: REQUEST_HEADERS,
      redirect: 'follow',
    });

    if (searchRes.ok) {
      if (searchRes.url.includes('/items/')) {
        // Se redirecionou direto para a página do item, garante country=br&platform=all
        if (searchRes.url.includes('country=br') && searchRes.url.includes('platform=all')) {
          const html = await searchRes.text();
          const parsed = extractPriceData(html, searchRes.url);
          if (parsed) {
            CACHE.set(cacheKey, parsed);
            return parsed;
          }
        } else {
          const redirectedPath = new URL(searchRes.url).pathname;
          const result = await fetchDekuItemHtml(redirectedPath);
          if (result) {
            const parsed = extractPriceData(result.html, result.url);
            if (parsed) {
              CACHE.set(cacheKey, parsed);
              return parsed;
            }
          }
        }
      } else {
        const searchHtml = await searchRes.text();
        const itemMatch = searchHtml.match(/href=["'](\/items\/[^"'?]+)["']/);
        if (itemMatch) {
          const result = await fetchDekuItemHtml(itemMatch[1]);
          if (result) {
            const parsed = extractPriceData(result.html, result.url);
            if (parsed) {
              CACHE.set(cacheKey, parsed);
              return parsed;
            }
          }
        }
      }
    }
  } catch {
    // ignora
  }

  return null;
}

async function handlePriceHistoryMiddleware(req, res) {
  try {
    const urlObj = new URL(req.url, 'http://localhost');
    const slug = urlObj.searchParams.get('slug') || '';
    const query = urlObj.searchParams.get('query') || '';

    if (!slug && !query) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'slug ou query é obrigatório' }));
      return;
    }

    const data = await fetchPriceHistoryFromDeku({ slug, query });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (data) {
      res.end(JSON.stringify({ success: true, data }));
    } else {
      res.end(JSON.stringify({ success: false, error: 'Histórico não encontrado' }));
    }
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}

import { proxyXboxImage } from './api/image-proxy.js';

async function handleImageProxyMiddleware(req, res) {
  try {
    const urlObj = new URL(req.url, 'http://localhost');
    const targetUrl = (urlObj.searchParams.get('url') || '').trim();
    const result = await proxyXboxImage(targetUrl);

    res.setHeader('Access-Control-Allow-Origin', '*');
    if (result.error) {
      res.statusCode = result.status || 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: result.error }));
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.end(result.buffer);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify({ error: err.message }));
  }
}

export function priceHistoryPlugin() {
  return {
    name: 'price-history-proxy',
    configureServer(server) {
      server.middlewares.use('/api/price-history', handlePriceHistoryMiddleware);
      server.middlewares.use('/api/image-proxy', handleImageProxyMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/price-history', handlePriceHistoryMiddleware);
      server.middlewares.use('/api/image-proxy', handleImageProxyMiddleware);
    },
  };
}
