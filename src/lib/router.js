import { useEffect, useState } from 'react';

/**
 * Roteador mínimo baseado em hash (funciona em qualquer hospedagem estática).
 *   #/            -> home
 *   #/jogo/<ID>   -> página do jogo
 */
function parse(hash) {
  const path = hash.replace(/^#/, '') || '/';
  const game = path.match(/^\/jogo\/([A-Za-z0-9]{12})\/?$/);
  if (game) return { name: 'game', id: game[1].toUpperCase() };
  return { name: 'home' };
}

export function useRoute() {
  const [route, setRoute] = useState(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parse(window.location.hash));
      window.scrollTo(0, 0);
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
