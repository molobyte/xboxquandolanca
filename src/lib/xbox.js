/**
 * Microsoft Store / Xbox Display Catalog (público, sem autenticação, com CORS liberado).
 *  - Autosuggest: /v7.0/productFamilies/autosuggest
 *  - Produto:     /v7.0/products?bigIds=<ID>
 */

const CATALOG = 'https://displaycatalog.mp.microsoft.com/v7.0';
export const MARKET = 'BR';
export const LANG = 'pt-br';

/** Normaliza URIs de imagem ("//store-images..." -> "https://store-images...") e permite redimensionar. */
export function imageUrl(uri, { w, h, q = 90 } = {}) {
  if (!uri) return null;
  let url = uri.startsWith('//') ? `https:${uri}` : uri;
  const params = new URLSearchParams();
  if (w) params.set('w', w);
  if (h) params.set('h', h);
  if (w || h) params.set('q', q);
  const qs = params.toString();
  return qs ? `${url}${url.includes('?') ? '&' : '?'}${qs}` : url;
}

/**
 * Tenta extrair um Product ID (BigId, 12 caracteres) de um texto:
 *  - "9PLKVSWR299F"
 *  - https://www.xbox.com/pt-BR/games/store/forza-motorsport/9PLKVSWR299F
 *  - https://apps.microsoft.com/detail/9PLKVSWR299F?hl=pt-br
 *  - https://www.microsoft.com/pt-br/p/forza/9plkvswr299f
 */
export function extractProductId(input) {
  const text = (input || '').trim();
  if (!text) return null;

  const isId = (s) => /^[A-Z0-9]{12}$/i.test(s) && /\d/.test(s) && /[A-Z]/i.test(s);
  if (isId(text)) return text.toUpperCase();

  const looksLikeUrl = /^(https?:\/\/|www\.)|xbox\.com|microsoft\.com/i.test(text);
  if (!looksLikeUrl) return null;

  const segments = text.split(/[/?&#=]/).filter(Boolean).reverse();
  const found = segments.find(isId);
  return found ? found.toUpperCase() : null;
}

/** Sugestões de jogos para o texto digitado. */
export async function suggestGames(query, signal) {
  const url =
    `${CATALOG}/productFamilies/autosuggest?market=${MARKET}&languages=${LANG}` +
    `&productFamilyNames=Games&topProducts=8&query=${encodeURIComponent(query)}`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const seen = new Set();
  const items = [];
  for (const group of data.Results || []) {
    for (const p of group.Products || []) {
      if (!p.ProductId || seen.has(p.ProductId)) continue;
      seen.add(p.ProductId);
      items.push({
        id: p.ProductId,
        title: p.Title,
        icon: imageUrl(p.Icon, { w: 96, h: 96, q: 80 }),
      });
    }
  }
  return items;
}

const FEATURE_LABELS = {
  SinglePlayer: 'Um jogador',
  XblOnlineMultiPlayer: 'Multijogador online',
  XblLocalMultiPlayer: 'Multijogador local',
  XblOnlineCoop: 'Cooperativo online',
  XblLocalCoop: 'Cooperativo local',
  XblCrossPlatformMultiPlayer: 'Multiplataforma',
  XblCrossPlatformCoop: 'Cooperativo multiplataforma',
  XPA: 'Xbox Play Anywhere',
  ConsoleGen9Optimized: 'Otimizado para Xbox Series X|S',
  Capability4k: '4K Ultra HD',
  CapabilityHDR: 'HDR',
  CapabilityVRR: 'VRR',
  RayTracing: 'Ray tracing',
  '60fps': '60 FPS',
  '120fps': '120 FPS',
  SpatialSound: 'Áudio espacial',
  DolbyAtmos: 'Dolby Atmos',
  ConsoleKeyboardMouse: 'Teclado e mouse',
  XboxLiveCloudSaves: 'Salvamento na nuvem',
  XboxCloudGaming: 'Jogos na nuvem',
};

const PLACEHOLDER_YEARS = (y) => y < 1900 || y >= 2099;

function validDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/** Data de lançamento: OriginalReleaseDate do mercado, com fallbacks nas SKUs. */
function extractReleaseDate(p) {
  const candidates = [p.MarketProperties?.[0]?.OriginalReleaseDate];
  for (const sku of p.DisplaySkuAvailabilities || []) {
    candidates.push(sku.Sku?.MarketProperties?.[0]?.FirstAvailableDate);
    for (const a of sku.Availabilities || []) {
      candidates.push(a.Properties?.OriginalReleaseDate, a.Properties?.PreOrderReleaseDate);
    }
  }

  for (const c of candidates) {
    const d = validDate(c);
    if (!d) continue;
    if (PLACEHOLDER_YEARS(d.getUTCFullYear())) continue;
    return { date: d, tba: false };
  }
  return { date: null, tba: true };
}

function extractPrice(p) {
  for (const sku of p.DisplaySkuAvailabilities || []) {
    for (const a of sku.Availabilities || []) {
      if (!a.Actions?.includes('Purchase')) continue;
      const price = a.OrderManagementData?.Price;
      if (price && typeof price.ListPrice === 'number') {
        return { list: price.ListPrice, msrp: price.MSRP, currency: price.CurrencyCode || 'BRL' };
      }
    }
  }
  return null;
}

function extractPlatforms(p) {
  const gens = p.Properties?.XboxConsoleGenCompatible;
  const set = new Set();
  if (Array.isArray(gens) && gens.length) {
    if (gens.includes('ConsoleGen9')) set.add('Xbox Series X|S');
    if (gens.includes('ConsoleGen8')) set.add('Xbox One');
  }
  for (const sku of p.DisplaySkuAvailabilities || []) {
    for (const a of sku.Availabilities || []) {
      for (const pl of a.Conditions?.ClientConditions?.AllowedPlatforms || []) {
        if (pl.PlatformName === 'Windows.Desktop') set.add('PC');
        if (pl.PlatformName === 'Windows.Xbox' && !set.has('Xbox Series X|S') && !set.has('Xbox One')) {
          set.add('Xbox');
        }
      }
    }
  }
  return [...set];
}

function pickImage(images, purposes) {
  for (const purpose of purposes) {
    const img = images.find((i) => i.ImagePurpose?.toLowerCase() === purpose.toLowerCase());
    if (img?.Uri) return img;
  }
  return null;
}

/** Extrai screenshots únicos da Microsoft Store (a API costuma duplicar entradas Desktop/N e Xbox/N). */
function extractScreenshots(images = [], limit = 8) {
  const seenHashes = new Set();
  const seenUris = new Set();
  const out = [];

  for (const img of images) {
    if (img?.ImagePurpose !== 'Screenshot' || !img.Uri) continue;

    const hash = img.UnscaledImageSHA256Hash || null;
    const normUri = img.Uri.replace(/^https?:/i, '').trim().toLowerCase();

    if ((hash && seenHashes.has(hash)) || seenUris.has(normUri)) continue;

    if (hash) seenHashes.add(hash);
    seenUris.add(normUri);

    out.push({
      thumb: imageUrl(img.Uri, { w: 640 }),
      full: imageUrl(img.Uri, { w: 1920 }),
    });

    if (out.length >= limit) break;
  }

  return out;
}

const CATEGORY_PT = {
  'Action & adventure': 'Ação e aventura',
  'Card & board': 'Cartas e tabuleiro',
  Casino: 'Cassino',
  Classics: 'Clássicos',
  Educational: 'Educativo',
  'Family & kids': 'Família e crianças',
  Fighting: 'Luta',
  'Multi-Player Online Battle Arena': 'MOBA',
  Music: 'Música',
  Other: 'Outros',
  Platformer: 'Plataforma',
  'Puzzle & trivia': 'Quebra-cabeça e perguntas',
  'Racing & flying': 'Corrida e voo',
  'Role playing': 'RPG',
  Shooter: 'Tiro',
  Simulation: 'Simulação',
  Sports: 'Esportes',
  Strategy: 'Estratégia',
  Tools: 'Ferramentas',
  Word: 'Palavras',
};

const translateCategory = (c) => (c ? CATEGORY_PT[c] || c : null);

function slugify(text = '') {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function mapProduct(p) {
  const loc = p.LocalizedProperties?.[0] || {};
  const images = loc.Images || [];
  const market = p.MarketProperties?.[0] || {};

  const cover = pickImage(images, ['Poster', 'BoxArt', 'FeaturePromotionalSquareArt']);
  const hero = pickImage(images, ['SuperHeroArt', 'TitledHeroArt', 'BrandedKeyArt', 'Screenshot']);

  const allTime = (market.UsageData || []).find((u) => u.AggregateTimeSpan === 'AllTime');
  const classInd = (market.ContentRatings || []).find((r) => r.RatingSystem === 'DJCTQ' || r.RatingSystem === 'ClassInd');
  const { date, tba } = extractReleaseDate(p);

  const features = (p.Properties?.Attributes || [])
    .map((a) => FEATURE_LABELS[a.Name])
    .filter(Boolean);

  const bundleIds = (market.RelatedProducts || [])
    .filter((r) => r.RelationshipType === 'Bundle' && r.RelatedProductId)
    .map((r) => r.RelatedProductId.toUpperCase())
    .slice(0, 8);

  return {
    id: p.ProductId,
    title: loc.ProductTitle || 'Jogo sem título',
    developer: loc.DeveloperName?.trim() || null,
    publisher: loc.PublisherName?.trim() || null,
    description: loc.ProductDescription || loc.ShortDescription || '',
    shortDescription: loc.ShortDescription || '',
    category: translateCategory(p.Properties?.Category),
    releaseDate: date,
    releaseTba: tba,
    cover: cover ? imageUrl(cover.Uri, { w: 600 }) : null,
    coverIsSquare: cover ? cover.Width === cover.Height : false,
    hero: hero ? imageUrl(hero.Uri, { w: 1920 }) : null,
    cardHero: hero ? imageUrl(hero.Uri, { w: 640 }) : cover ? imageUrl(cover.Uri, { w: 600 }) : null,
    screenshots: extractScreenshots(images, 8),
    rating: allTime && allTime.RatingCount > 0 ? { average: allTime.AverageRating, count: allTime.RatingCount } : null,
    ageRating: classInd?.RatingId?.split(':')[1] || null,
    price: extractPrice(p),
    platforms: extractPlatforms(p),
    features: [...new Set(features)],
    bundleIds,
    slug: slugify(loc.ProductTitle) || null,
    storeUrl: `https://www.xbox.com/pt-BR/games/store/${slugify(loc.ProductTitle) || 'jogo'}/${p.ProductId}`,
  };
}

function applyBundleInfo(game, bundles) {
  if (!bundles?.length) return game;
  const next = { ...game };

  if (next.releaseTba || !next.releaseDate) {
    const validDates = bundles
      .filter((b) => b.releaseDate && !b.releaseTba)
      .map((b) => b.releaseDate);

    if (validDates.length > 0) {
      validDates.sort((a, b) => a.getTime() - b.getTime());
      next.releaseDate = validDates[0];
      next.releaseTba = false;
    }
  }

  if (!next.price) {
    const priced = bundles
      .filter((b) => b.price && !/\bupgrade\b/i.test(b.title))
      .sort((a, b) => a.price.list - b.price.list)[0];
    if (priced) next.price = priced.price;
  }

  return next;
}

export async function getGame(id, signal) {
  const url = `${CATALOG}/products?bigIds=${encodeURIComponent(id)}&market=${MARKET}&languages=${LANG}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Falha ao consultar a loja (HTTP ${res.status}).`);
  const data = await res.json();
  const product = data.Products?.[0];
  if (!product) throw new Error('Jogo não encontrado na Microsoft Store.');
  const game = mapProduct(product);

  // Se o jogo não tem data definida ou não tem preço (caso de hubs/jogos base), consulta as edições relacionadas
  if ((game.releaseTba || !game.price) && game.bundleIds?.length > 0) {
    try {
      const bundles = await getGamesByIds(game.bundleIds, signal);
      return applyBundleInfo(game, bundles);
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
      // Em caso de falha de rede secundária, mantém os dados originais
    }
  }

  return game;
}

/** Resolve datas de lançamento (e preços) de hubs/jogos sem data usando seus bundles relacionados em lote. */
export async function resolveMissingReleaseDates(games, signal) {
  const pending = (games || []).filter(
    (g) => (g.releaseTba || !g.releaseDate) && g.bundleIds?.length > 0
  );
  if (!pending.length) return games;

  const bundleIds = [...new Set(pending.flatMap((g) => g.bundleIds))].slice(0, 40);
  if (!bundleIds.length) return games;

  try {
    const bundles = await getGamesByIds(bundleIds, signal);
    const byId = new Map(bundles.map((b) => [b.id.toUpperCase(), b]));
    return games.map((g) => {
      if ((!g.releaseTba && g.releaseDate) || !g.bundleIds?.length) return g;
      const related = g.bundleIds.map((bid) => byId.get(bid)).filter(Boolean);
      return applyBundleInfo(g, related);
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    return games;
  }
}

/** Busca vários jogos em lote (até 20 BigIds por requisição) na Microsoft Store. */
export async function getGamesByIds(ids, signal) {
  const unique = [...new Set((ids || []).map((id) => id?.toUpperCase()).filter(Boolean))];
  if (!unique.length) return [];

  const chunks = [];
  for (let i = 0; i < unique.length; i += 20) {
    chunks.push(unique.slice(i, i + 20));
  }

  const responses = await Promise.allSettled(
    chunks.map(async (chunk) => {
      const url = `${CATALOG}/products?bigIds=${encodeURIComponent(chunk.join(','))}&market=${MARKET}&languages=${LANG}`;
      const res = await fetch(url, { signal });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.Products || []).map(mapProduct);
    })
  );

  const byId = new Map();
  for (const r of responses) {
    if (r.status === 'fulfilled') {
      for (const g of r.value) {
        if (g?.id) byId.set(g.id.toUpperCase(), g);
      }
    }
  }

  return unique.map((id) => byId.get(id)).filter(Boolean);
}

export const REGIONAL_MARKETS = [
  { code: 'NZ', name: 'Nova Zelândia', flag: '🇳🇿', timeZone: 'Pacific/Auckland' },
  { code: 'JP', name: 'Japão', flag: '🇯🇵', timeZone: 'Asia/Tokyo' },
  { code: 'GB', name: 'Reino Unido / Europa', flag: '🇬🇧', timeZone: 'Europe/London' },
  { code: 'US', name: 'Estados Unidos (ET)', flag: '🇺🇸', timeZone: 'America/New_York' },
];

const regionalCache = new Map();

async function fetchMarketRelease(id, market, signal) {
  const url = `${CATALOG}/products?bigIds=${encodeURIComponent(id)}&market=${market}&languages=en-us`;
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const data = await res.json();
  const product = data.Products?.[0];
  if (!product) return null;
  let rel = extractReleaseDate(product);

  // Fallback para bundles caso o hub não tenha a data no mercado
  if (rel.tba) {
    const relatedIds = (product.MarketProperties?.[0]?.RelatedProducts || [])
      .filter((r) => r.RelationshipType === 'Bundle')
      .map((r) => r.RelatedProductId)
      .slice(0, 5);

    if (relatedIds.length > 0) {
      try {
        const bUrl = `${CATALOG}/products?bigIds=${encodeURIComponent(relatedIds.join(','))}&market=${market}&languages=en-us`;
        const bRes = await fetch(bUrl, { signal });
        if (bRes.ok) {
          const bData = await bRes.json();
          const validDates = (bData.Products || [])
            .map(extractReleaseDate)
            .filter((b) => b.date && !b.tba)
            .map((b) => b.date);

          if (validDates.length > 0) {
            validDates.sort((a, b) => a.getTime() - b.getTime());
            rel = { date: validDates[0], tba: false };
          }
        }
      } catch {
        // Ignora erros no fallback
      }
    }
  }

  return rel.date;
}

/**
 * Consulta o horário de lançamento internacional para verificar o Truque da Nova Zelândia e horários mundiais.
 */
export async function getRegionalReleases(id, brazilDate, signal) {
  if (!id || !brazilDate) return null;

  const cacheKey = `${id}_${brazilDate.getTime()}`;
  if (regionalCache.has(cacheKey)) {
    return regionalCache.get(cacheKey);
  }

  const promises = REGIONAL_MARKETS.map(async (region) => {
    try {
      const date = await fetchMarketRelease(id, region.code, signal);
      return { ...region, date };
    } catch {
      return { ...region, date: null };
    }
  });

  const regions = await Promise.all(promises);
  const nz = regions.find((r) => r.code === 'NZ');

  let isSimultaneous = false;
  let hoursAheadOfBrazil = 0;
  let canUseNewZealandTrick = false;

  if (nz?.date && brazilDate) {
    const diffMs = brazilDate.getTime() - nz.date.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (Math.abs(diffHours) <= 1) {
      isSimultaneous = true;
    } else if (diffHours > 1) {
      canUseNewZealandTrick = true;
      hoursAheadOfBrazil = diffHours;
    }
  }

  const result = {
    regions,
    nzRelease: nz?.date || null,
    isSimultaneous,
    canUseNewZealandTrick,
    hoursAheadOfBrazil,
  };

  regionalCache.set(cacheKey, result);
  return result;
}
