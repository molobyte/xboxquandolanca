import { useEffect, useState } from 'react';

export const PORTAL_SECTIONS = ['geral', 'lancamentos', 'ofertas', 'gamepass', 'ferramentas'];

/**
 * Roteador mínimo baseado em hash (funciona em qualquer hospedagem estática).
 *   #/                     -> home (seção geral)
 *   #/?secao=lancamentos   -> home (seção específica)
 *   #/jogo/<ID>            -> página do jogo
 */
function parse(hash) {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  const game = path.match(/^\/jogo\/([A-Za-z0-9]{12})\/?$/);
  if (game) return { name: 'game', id: game[1].toUpperCase(), section: 'geral' };

  const params = new URLSearchParams(query);
  const sec = params.get('secao');
  const section = PORTAL_SECTIONS.includes(sec) ? sec : 'geral';
  return { name: 'home', section };
}

export function useRoute() {
  const [route, setRoute] = useState(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      const next = parse(window.location.hash);
      setRoute((prev) => {
        if (prev.name !== next.name || prev.id !== next.id) {
          window.scrollTo(0, 0);
        }
        return next;
      });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function navigate(path) {
  window.location.hash = path;
}

export const gamePath = (id) => `/jogo/${id}`;
export const sectionPath = (section) => (section && section !== 'geral' ? `/?secao=${section}` : '/');
