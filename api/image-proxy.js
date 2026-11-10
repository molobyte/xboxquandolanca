// Endpoint Serverless para Vercel Free (/api/image-proxy)
// Faz proxy das capas da Microsoft Store adicionando CORS (Access-Control-Allow-Origin: *)
// para permitir uso em texturas WebGL e inferência do Depth Anything no navegador,
// com cache longo na CDN da Vercel (Edge Cache) para custo zero.

const ALLOWED_HOSTS = [
  'store-images.s-microsoft.com',
  'images-eds-ssl.xboxlive.com',
  'assets-xbxweb.xbox.com',
  'compass-ssl.xbox.com',
];

export async function proxyXboxImage(targetUrl) {
  if (!targetUrl) {
    return { status: 400, error: 'Parâmetro url é obrigatório' };
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return { status: 400, error: 'URL inválida' };
  }

  const isAllowed = ALLOWED_HOSTS.some(
    (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
  );

  if (!isAllowed) {
    return { status: 403, error: 'Domínio não permitido pelo proxy' };
  }

  const upstream = await fetch(parsed.toString(), {
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
  });

  if (!upstream.ok) {
    return { status: upstream.status, error: `Falha ao buscar imagem (${upstream.status})` };
  }

  const contentType = upstream.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await upstream.arrayBuffer();
  return {
    status: 200,
    contentType,
    buffer: Buffer.from(arrayBuffer),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const urlObj = new URL(req.url || '', 'http://localhost');
    const targetUrl = (req.query?.url ?? urlObj.searchParams.get('url') ?? '').trim();

    const result = await proxyXboxImage(targetUrl);
    if (result.error) {
      res.statusCode = result.status || 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: result.error }));
      return;
    }

    // Cache imutável na Edge CDN da Vercel (1 ano) para não consumir invocações repetidas
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    res.statusCode = 200;
    res.end(result.buffer);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: err?.message || 'Erro interno no proxy de imagem' }));
  }
}
