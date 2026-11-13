import { getGamesByIds } from './xbox.js';

const PORTAL_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedPortal = null;
let cachedAt = 0;

const RECENT_STORAGE_KEY = 'xbox_quando_lanca_recent_v1';

const FALLBACK_FEED = {
  comingSoonGp: [
    '9NW6JK0ZC9J6',
    '9PMN4DGRT1LN',
    '9NFW93G1GFXG',
    '9N40DK5N4LD4',
    '9P8XK6X57GBF',
    '9NL8MF491NRZ',
  ],
  trending: [
    '9P3H4968GRSM',
    '9P36PB4N42GW',
    '9N431PX143P8',
    '9N4PT8HGCDHQ',
    'BX3M8L83BBRW',
    '9NWWL1CBWFCG',
    '9P1S707BPW6W',
    '9NJ6F163VF8C',
  ],
  recentGp: [],
  leavingSoonGp: [],
};

function baseTitleKey(title = '') {
  return title
    .toLowerCase()
    .replace(/[®™©]/g, '')
    .replace(/\s*[-–—:]\s*(edição|edition|ultimate|deluxe|standard|cofre|pacote|bundle|windows|xbox).*$/i, '')
    .replace(/\s*\((windows|xbox[^)]*)\)/gi, '')
    .trim();
}

function editionRank(title = '') {
  const t = title.toLowerCase();
  if (/\(windows\)/.test(t)) return 4;
  if (/(ultimate|deluxe|cofre|vault|premium|gold|collector|definitive|pacote|bundle)/.test(t)) return 3;
  if (/(standard|padrão)/.test(t)) return 1;
  return 0;
}

function dedupeGames(list) {
  const byKey = new Map();
  const orderedKeys = [];
  for (const g of list) {
    if (!g?.id) continue;
    const key = baseTitleKey(g.title) || g.id;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, g);
      orderedKeys.push(key);
    } else if (editionRank(g.title) < editionRank(existing.title)) {
      byKey.set(key, g);
    }
  }
  return orderedKeys.map((k) => byKey.get(k));
}

export async function getPortalData(signal) {
  const now = Date.now();
  if (cachedPortal && now - cachedAt < PORTAL_CACHE_TTL_MS) {
    return cachedPortal;
  }

  let feed = null;
  try {
    const res = await fetch('/api/portal-feed', { signal });
    if (res.ok) {
      const json = await res.json();
      if (json?.success && json.data) feed = json.data;
    }
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
  }

  if (
    !feed ||
    (!feed.trending?.length && !feed.comingSoonGp?.length && !feed.recentGp?.length)
  ) {
    feed = FALLBACK_FEED;
  }

  const allIds = [
    ...(feed.comingSoonGp || []),
    ...(feed.trending || []),
    ...(feed.recentGp || []),
    ...(feed.leavingSoonGp || []),
  ];

  const games = await getGamesByIds(allIds, signal);
  const byId = new Map(games.map((g) => [g.id.toUpperCase(), g]));
  const pickList = (ids) => dedupeGames((ids || []).map((id) => byId.get(id.toUpperCase())).filter(Boolean));

  const comingSoonGp = pickList(feed.comingSoonGp);
  const recentGp = pickList(feed.recentGp);
  const leavingSoonGp = pickList(feed.leavingSoonGp);
  const trending = pickList(feed.trending);

  const gpIds = new Set([
    ...comingSoonGp.map((g) => g.id),
    ...recentGp.map((g) => g.id),
  ]);

  const enriched = dedupeGames([...comingSoonGp, ...trending, ...recentGp]).map((g) => ({
    ...g,
    inGamePass: gpIds.has(g.id),
  }));

  const currentTs = Date.now();
  const datedUpcoming = enriched
    .filter((g) => g.releaseDate && !g.releaseTba && g.releaseDate.getTime() > currentTs)
    .sort((a, b) => a.releaseDate.getTime() - b.releaseDate.getTime());

  const tbaUpcoming = comingSoonGp.filter((g) => g.releaseTba || !g.releaseDate);
  const upcoming = dedupeGames([...datedUpcoming, ...tbaUpcoming]);

  const deals = dedupeGames(games)
    .filter((g) => g.price && g.price.msrp > g.price.list && g.price.list > 0)
    .sort((a, b) => {
      const pctA = 1 - a.price.list / a.price.msrp;
      const pctB = 1 - b.price.list / b.price.msrp;
      return pctB - pctA;
    });

  const result = {
    upcoming,
    datedUpcoming,
    trending: trending.map((g) => ({ ...g, inGamePass: gpIds.has(g.id) })),
    comingSoonGp,
    recentGp,
    leavingSoonGp,
    deals,
    fetchedAt: feed.fetchedAt || new Date().toISOString(),
  };

  if (games.length > 0) {
    cachedPortal = result;
    cachedAt = now;
  }

  return result;
}

export function getRecentGames() {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordRecentGame(game) {
  if (!game?.id || !game?.title) return;
  try {
    const existing = getRecentGames().filter((item) => item.id !== game.id);
    const entry = {
      id: game.id,
      title: game.title,
      publisher: game.publisher || null,
      cardHero: game.cardHero || game.hero || game.cover || null,
      cover: game.cover || null,
      releaseDate: game.releaseDate ? game.releaseDate.toISOString() : null,
      releaseTba: !!game.releaseTba,
      price: game.price || null,
      visitedAt: Date.now(),
    };
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify([entry, ...existing].slice(0, 8)));
  } catch {
    // Ignora caso localStorage esteja indisponível
  }
}

function getZoneOffsetMinutes(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const map = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = Number(p.value);
  }
  const hour = map.hour === 24 ? 0 : map.hour;
  const asUtc = Date.UTC(map.year, map.month - 1, map.day, hour, map.minute, map.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}

const clockFmtCache = new Map();
function formatTimeInZone(date, timeZone) {
  if (!clockFmtCache.has(timeZone)) {
    clockFmtCache.set(
      timeZone,
      new Intl.DateTimeFormat('pt-BR', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }
  return clockFmtCache.get(timeZone).format(date);
}

const dayFmtCache = new Map();
function formatWeekdayInZone(date, timeZone) {
  if (!dayFmtCache.has(timeZone)) {
    dayFmtCache.set(
      timeZone,
      new Intl.DateTimeFormat('pt-BR', {
        timeZone,
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
      })
    );
  }
  return dayFmtCache.get(timeZone).format(date);
}

export function getBrasiliaAndNzClocks(nowMs = Date.now()) {
  const d = new Date(nowMs);
  const brTz = 'America/Sao_Paulo';
  const nzTz = 'Pacific/Auckland';

  const brOffset = getZoneOffsetMinutes(d, brTz);
  const nzOffset = getZoneOffsetMinutes(d, nzTz);
  const diffHours = Math.round((nzOffset - brOffset) / 60);

  return {
    brTime: formatTimeInZone(d, brTz),
    brDate: formatWeekdayInZone(d, brTz),
    nzTime: formatTimeInZone(d, nzTz),
    nzDate: formatWeekdayInZone(d, nzTz),
    diffHours,
  };
}
