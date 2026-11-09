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

  return {
    id: p.ProductId,
    title: loc.ProductTitle || 'Jogo sem título',
    developer: loc.DeveloperName?.trim() || null,
    publisher: loc.PublisherName?.trim() || null,
    description: loc.ProductDescription || loc.ShortDescription || '',
    category: translateCategory(p.Properties?.Category),
    releaseDate: date,
    releaseTba: tba,
    cover: cover ? imageUrl(cover.Uri, { w: 600 }) : null,
    coverIsSquare: cover ? cover.Width === cover.Height : false,
    hero: hero ? imageUrl(hero.Uri, { w: 1920 }) : null,
    screenshots: images
      .filter((i) => i.ImagePurpose === 'Screenshot')
      .slice(0, 8)
      .map((i) => ({ thumb: imageUrl(i.Uri, { w: 640 }), full: imageUrl(i.Uri, { w: 1920 }) })),
    rating: allTime && allTime.RatingCount > 0 ? { average: allTime.AverageRating, count: allTime.RatingCount } : null,
    ageRating: classInd?.RatingId?.split(':')[1] || null,
    price: extractPrice(p),
    platforms: extractPlatforms(p),
    features: [...new Set(features)],
    slug: slugify(loc.ProductTitle) || null,
    storeUrl: `https://www.xbox.com/pt-BR/games/store/${slugify(loc.ProductTitle) || 'jogo'}/${p.ProductId}`,
  };
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
  if (game.releaseTba || !game.price) {
    const relatedIds = (product.MarketProperties?.[0]?.RelatedProducts || [])
      .filter((r) => r.RelationshipType === 'Bundle')
      .map((r) => r.RelatedProductId)
      .slice(0, 8);

    if (relatedIds.length > 0) {
      try {
        const bundleUrl = `${CATALOG}/products?bigIds=${encodeURIComponent(relatedIds.join(','))}&market=${MARKET}&languages=${LANG}`;
        const bRes = await fetch(bundleUrl, { signal });
        if (bRes.ok) {
          const bData = await bRes.json();
          const bundles = (bData.Products || []).map(mapProduct);

          if (game.releaseTba) {
            const validDates = bundles
              .filter((b) => b.releaseDate && !b.releaseTba)
              .map((b) => b.releaseDate);

            if (validDates.length > 0) {
              // Usa a data da versão Standard (ou a mais próxima)
              validDates.sort((a, b) => a.getTime() - b.getTime());
              game.releaseDate = validDates[0];
              game.releaseTba = false;
            }
          }

          if (!game.price) {
            const priced = bundles.find((b) => b.price);
            if (priced) game.price = priced.price;
          }
        }
      } catch {
        // Em caso de falha de rede secundária, mantém os dados originais
      }
    }
  }

  return game;
}
