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

function extractAttr(tagHtml, attrName) {
  const re = new RegExp(`\\b${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const m = tagHtml.match(re);
  return m ? (m[1] ?? m[2] ?? m[3] ?? '').trim() : null;
}

function decodeHtmlEntities(str = '') {
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#xbd;|&frac12;/gi, '½')
    .replace(/&#xbc;|&frac14;/gi, '¼')
    .replace(/&#xbe;|&frac34;/gi, '¾')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatHltbTime(raw = '') {
  const cleaned = decodeHtmlEntities(raw);
  if (!cleaned) return null;

  // Ex.: "60 hours", "101½ hours", "1 hour", "45 mins", "45 minutes"
  const hourMatch = cleaned.match(/(\d+)\s*(½|\.5)?\s*hours?/i);
  if (hourMatch) {
    const whole = Number(hourMatch[1]);
    const hasHalf = Boolean(hourMatch[2]);
    return hasHalf ? `${whole}h30` : `${whole}h`;
  }

  const minMatch = cleaned.match(/(\d+)\s*(?:mins?|minutes?)/i);
  if (minMatch) {
    return `${Number(minMatch[1])}min`;
  }

  return cleaned;
}

export function extractReviewsData(html) {
  let metacritic = null;
  let opencritic = null;

  // Metacritic
  const mcLiMatch = html.match(/<li\b[^>]*>\s*<strong>Metacritic:<\/strong>([\s\S]*?)<\/li>/i);
  if (mcLiMatch) {
    const block = mcLiMatch[1];
    const anchorTagMatch = block.match(/<a\b[^>]*>/i);
    const url = anchorTagMatch ? extractAttr(anchorTagMatch[0], 'href') : null;

    let score = null;
    let userScore = null;

    const spanMatches = [...block.matchAll(/<span\b([^>]*)>([\s\S]*?)<\/span>/gi)];
    for (const [, attrs, inner] of spanMatches) {
      const text = decodeHtmlEntities(inner.replace(/<[^>]+>/g, ''));
      if (!text || /^tbd$/i.test(text)) continue;

      const isCriticBadge = /\bbg-/i.test(attrs) || /\brounded\b/i.test(attrs);
      if (isCriticBadge && /^\d{1,3}$/.test(text)) {
        const val = Number(text);
        if (val >= 0 && val <= 100) score = val;
      } else if (/^\d{1,2}(?:\.\d+)?$/.test(text)) {
        const val = Number(text);
        if (val >= 0 && val <= 10 && userScore === null) {
          userScore = val;
        } else if (val > 10 && val <= 100 && score === null) {
          score = Math.round(val);
        }
      }
    }

    if (score !== null || userScore !== null) {
      metacritic = { score, userScore, url };
    }
  }

  // OpenCritic
  const ocLiMatch = html.match(/<li\b[^>]*>\s*<strong>OpenCritic:<\/strong>([\s\S]*?)<\/li>/i);
  if (ocLiMatch) {
    const block = ocLiMatch[1];
    const anchorMatch = block.match(/<a\b([^>]*)>([\s\S]*?)<\/a>/i);
    if (anchorMatch) {
      const anchorAttrs = anchorMatch[1];
      const anchorInner = anchorMatch[2];
      const url = extractAttr(`<a ${anchorAttrs}>`, 'href');

      let tier = null;
      const titleAttr = extractAttr(`<a ${anchorAttrs}>`, 'title') || extractAttr(`<a ${anchorAttrs}>`, 'alt') || '';
      const tierFromTitle = titleAttr.match(/rating:\s*([a-z]+)/i);
      const tierFromClass = anchorInner.match(/opencritic-tier\s+opencritic-([a-z]+)/i);
      const rawTier = (tierFromTitle?.[1] || tierFromClass?.[1] || '').toLowerCase();
      if (rawTier) {
        tier = rawTier.charAt(0).toUpperCase() + rawTier.slice(1);
      }

      const plainText = decodeHtmlEntities(anchorInner.replace(/<[^>]+>/g, ' '));
      const scoreMatch = plainText.match(/\b(\d{1,3})\b/);
      if (scoreMatch) {
        const score = Number(scoreMatch[1]);
        if (score >= 0 && score <= 100) {
          opencritic = { score, tier, url };
        }
      }
    }
  }

  if (!metacritic && !opencritic) return null;
  return { metacritic, opencritic };
}

export function extractHowLongToBeat(html) {
  const hltbMatch = html.match(
    /<li\b[^>]*>\s*<strong>\s*<a\b([^>]*howlongtobeat[^>]*)>[\s\S]*?<\/a>\s*:?\s*<\/strong>([\s\S]*?)<\/ul>\s*<\/li>/i
  );
  if (!hltbMatch) return null;

  const url = extractAttr(`<a ${hltbMatch[1]}>`, 'href');
  const listHtml = hltbMatch[2];
  const entries = [];

  const itemMatches = [...listHtml.matchAll(/<li\b[^>]*>\s*<strong>([^<:]+):?<\/strong>\s*([^<]+)<\/li>/gi)];
  for (const [, rawLabel, rawVal] of itemMatches) {
    const label = decodeHtmlEntities(rawLabel);
    const rawValue = decodeHtmlEntities(rawVal);
    const displayValue = formatHltbTime(rawValue);
    if (!label || !displayValue) continue;
    entries.push({ label, rawValue, displayValue });
  }

  if (entries.length === 0) return null;
  return { url, entries };
}

export function extractPriceData(html, sourceUrl) {
  // Extrai nome do jogo do <title>
  let gameTitle = 'Jogo';
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    gameTitle = titleMatch[1].replace(/\s*[-|]\s*Deku Deals.*$/i, '').trim();
  }

  const reviews = extractReviewsData(html);
  const howLongToBeat = extractHowLongToBeat(html);

  const match = html.match(/id=['"]price_history_data['"][^>]*>(.*?)<\/script>/s);
  let rawData = null;
  if (match) {
    try {
      rawData = JSON.parse(match[1]);
    } catch {
      rawData = null;
    }
  }

  const headers = rawData?.headers || [];
  const rows = rawData?.data || [];

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

  if (history.length === 0 && !reviews && !howLongToBeat) {
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
    storeName: history.length > 0 ? storeName : null,
    currentPrice: lastPrice,
    lowestPrice: lowestPrice === Infinity ? null : lowestPrice,
    lowestDate,
    highestPrice: history.length > 0 ? highestPrice : null,
    totalPoints: history.length,
    history,
    recentChanges: priceChanges.slice(-8).reverse(),
    reviews,
    howLongToBeat,
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

export function priceHistoryPlugin() {
  return {
    name: 'price-history-proxy',
    configureServer(server) {
      server.middlewares.use('/api/price-history', handlePriceHistoryMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/price-history', handlePriceHistoryMiddleware);
    },
  };
}
