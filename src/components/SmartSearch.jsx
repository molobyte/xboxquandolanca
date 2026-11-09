import { useEffect, useId, useRef, useState } from 'react';
import { Search, Link2, Loader2, CornerDownLeft } from 'lucide-react';
import { extractProductId, suggestGames } from '../lib/xbox.js';
import { gamePath, navigate } from '../lib/router.js';

/**
 * Campo de busca inteligente:
 *  - digitar o nome mostra sugestões da Microsoft Store (autosuggest);
 *  - colar a URL (ou o ID) do jogo e apertar Enter abre direto.
 */
export default function SmartSearch({ size = 'lg', autoFocus = false }) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState('');
  const [maxListHeight, setMaxListHeight] = useState(340);
  const wrapRef = useRef(null);
  const activeItemRef = useRef(null);
  const listId = useId();

  const directId = extractProductId(query);

  // Busca de sugestões com debounce + cancelamento da requisição anterior.
  useEffect(() => {
    const q = query.trim();
    setError('');
    if (directId || q.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const result = await suggestGames(q, controller.signal);
        setItems(result);
        setActive(result.length ? 0 : -1);
      } catch (e) {
        if (e.name !== 'AbortError') setError('Não foi possível buscar sugestões agora.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query, directId]);

  // Fecha ao clicar fora.
  useEffect(() => {
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Calcula dinamicamente a altura máxima do menu para nunca vazar da tela
  useEffect(() => {
    if (!open || !wrapRef.current) return;

    const updateMaxHeight = () => {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const margin = 24; // Margem de segurança inferior
      const available = window.innerHeight - rect.bottom - margin;
      // Limita confortavelmente a no máximo 340px (cerca de 5 itens) e no mínimo 140px, respeitando a tela disponível
      const safeHeight = Math.max(140, Math.min(340, available));
      setMaxListHeight(safeHeight);
    };

    updateMaxHeight();
    window.addEventListener('resize', updateMaxHeight);
    window.addEventListener('scroll', updateMaxHeight, true);
    return () => {
      window.removeEventListener('resize', updateMaxHeight);
      window.removeEventListener('scroll', updateMaxHeight, true);
    };
  }, [open, items.length, query]);

  // Mantém o item ativo sempre visível ao navegar pelo teclado
  useEffect(() => {
    if (active >= 0 && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [active]);

  const go = (id) => {
    setOpen(false);
    setQuery('');
    setItems([]);
    navigate(gamePath(id));
  };

  const submit = () => {
    if (directId) return go(directId);
    const chosen = items[active] || items[0];
    if (chosen) return go(chosen.id);
    if (query.trim().length >= 2 && !loading) {
      setError('Nenhum jogo encontrado. Tente outro nome ou cole o link da loja.');
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (items.length ? (i + 1) % items.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (items.length ? (i - 1 + items.length) % items.length : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const big = size === 'lg';
  const showPanel = open && query.trim().length >= 2 && (directId || loading || items.length > 0 || error);

  return (
    <div ref={wrapRef} className="relative w-full">
      <div
        className={`group flex items-center gap-3 rounded-2xl border bg-white/[0.04] backdrop-blur-xl transition
          border-white/10 focus-within:border-xbox-neon/60 focus-within:bg-white/[0.07] focus-within:shadow-glow
          ${big ? 'h-16 px-5' : 'h-11 px-4'}`}
      >
        {directId ? (
          <Link2 className={`shrink-0 text-xbox-neon ${big ? 'h-6 w-6' : 'h-4 w-4'}`} />
        ) : (
          <Search className={`shrink-0 text-white/40 group-focus-within:text-xbox-neon ${big ? 'h-6 w-6' : 'h-4 w-4'}`} />
        )}
        <input
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={big ? 'Digite o nome do jogo ou cole o link da loja Xbox…' : 'Buscar outro jogo…'}
          className={`w-full bg-transparent outline-none placeholder:text-white/30 ${big ? 'text-lg' : 'text-sm'}`}
          role="combobox"
          aria-expanded={!!showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          spellCheck={false}
          autoComplete="off"
        />
        {loading && <Loader2 className="h-5 w-5 shrink-0 animate-spin text-white/40" />}
        {big && !loading && query && (
          <kbd className="hidden shrink-0 items-center gap-1 rounded-md border border-white/10 px-2 py-1 font-action text-[11px] font-bold text-white/40 sm:flex">
            <CornerDownLeft className="h-3 w-3" /> Enter
          </kbd>
        )}
      </div>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#11151d]/95 shadow-2xl backdrop-blur-xl animate-fade-in"
        >
          {directId ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(directId)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-xbox-green/20">
                <Link2 className="h-5 w-5 text-xbox-neon" />
              </span>
              <span>
                <span className="block font-action text-xs font-bold uppercase tracking-wider">Abrir jogo pelo link</span>
                <span className="block font-mono text-xs text-white/50">ID {directId}</span>
              </span>
            </button>
          ) : error && items.length === 0 ? (
            <p className="px-4 py-4 text-sm text-white/50">{error}</p>
          ) : loading && items.length === 0 ? (
            <p className="px-4 py-4 text-sm text-white/50">Buscando…</p>
          ) : (
            <ul
              className="custom-scrollbar overflow-y-auto py-1 overscroll-contain"
              style={{ maxHeight: `${maxListHeight}px` }}
            >
              {items.map((item, i) => (
                <li
                  key={item.id}
                  ref={i === active ? activeItemRef : null}
                  role="option"
                  aria-selected={i === active}
                >
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(item.id)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                      i === active ? 'bg-xbox-green/15' : 'hover:bg-white/5'
                    }`}
                  >
                    {item.icon ? (
                      <img src={item.icon} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-lg bg-white/5 object-cover" />
                    ) : (
                      <span className="h-11 w-11 shrink-0 rounded-lg bg-white/5" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        <Highlight text={item.title} query={query} />
                      </span>
                      <span className="block font-mono text-[11px] text-white/35">{item.id}</span>
                    </span>
                    {i === active && <CornerDownLeft className="h-4 w-4 shrink-0 text-white/40" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Highlight({ text, query }) {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent text-xbox-neon">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}
