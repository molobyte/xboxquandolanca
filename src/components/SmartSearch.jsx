import { useEffect, useId, useRef, useState } from 'react';
import { Search, Link2, Loader2, CornerDownLeft } from 'lucide-react';
import { extractProductId, suggestGames } from '../lib/xbox.js';
import { gamePath, navigate } from '../lib/router.js';

/**
 * Campo de busca inteligente:
 *  - digitar o nome mostra sugestões da Microsoft Store (autosuggest);
 *  - colar a URL (ou o ID) do jogo e apertar Enter abre direto.
 */
export default function SmartSearch({
  size = 'lg',
  autoFocus = false,
  slashShortcut = false,
  placeholder,
  onAfterNavigate,
}) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState('');
  const [maxListHeight, setMaxListHeight] = useState(340);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
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

  // Atalho '/' para focar a busca rapidamente no desktop.
  useEffect(() => {
    if (!slashShortcut) return;
    const onKey = (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slashShortcut]);

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
    onAfterNavigate?.();
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

  const big = size === 'lg' || size === 'hero';
  const isHero = size === 'hero';
  const showPanel = open && query.trim().length >= 2 && (directId || loading || items.length > 0 || error);

  return (
    <div ref={wrapRef} className="relative w-full text-left">
      <div
        className={`group flex items-center gap-3 transition-all
          focus-within:border-white/25 focus-within:bg-white/[0.07]
          ${
            isHero
              ? 'liquid-glass h-15 rounded-2xl px-5 sm:h-16 sm:px-6'
              : big
              ? 'liquid-glass h-13 rounded-2xl px-4 sm:h-14 sm:px-5'
              : 'liquid-glass-subtle h-9 rounded-full px-3.5'
          }`}
      >
        {directId ? (
          <Link2 className={`shrink-0 text-xbox-neon ${isHero ? 'h-5 w-5' : big ? 'h-5 w-5' : 'h-3.5 w-3.5'}`} />
        ) : (
          <Search className={`shrink-0 text-white/45 transition group-focus-within:text-white/85 ${isHero ? 'h-5 w-5' : big ? 'h-5 w-5' : 'h-3.5 w-3.5'}`} />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={
            placeholder ||
            (big ? 'Busque qualquer jogo Xbox ou cole o link da Microsoft Store…' : 'Buscar jogo ou colar URL…')
          }
          className={`w-full min-w-0 bg-transparent text-left font-sans text-white outline-none placeholder:text-white/40 ${
            isHero ? 'text-base sm:text-lg' : big ? 'text-sm sm:text-base' : 'text-xs'
          }`}
          role="combobox"
          aria-expanded={!!showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          spellCheck={false}
          autoComplete="off"
        />
        {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/60" />}
        {big && !loading && query && (
          <kbd className="hidden shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-0.5 font-sans text-[11px] font-medium text-white/60 sm:flex">
            <CornerDownLeft className="h-3 w-3" /> Enter
          </kbd>
        )}
      </div>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="liquid-glass-menu absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl animate-fade-in"
        >
          {directId ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(directId)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.06]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-xbox-neon/40 bg-xbox-green/25">
                <Link2 className="h-5 w-5 text-xbox-neon" />
              </span>
              <span>
                <span className="block font-sans text-xs font-bold uppercase tracking-wider text-white">Abrir jogo pelo link</span>
                <span className="block font-mono text-xs text-neutral-400">ID {directId}</span>
              </span>
            </button>
          ) : error && items.length === 0 ? (
            <p className="px-4 py-4 text-sm text-neutral-400">{error}</p>
          ) : loading && items.length === 0 ? (
            <p className="px-4 py-4 text-sm text-neutral-400">Buscando na Microsoft Store…</p>
          ) : (
            <ul
              className="custom-scrollbar overflow-y-auto p-1.5 overscroll-contain"
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
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                      i === active ? 'bg-xbox-green/25 ring-1 ring-xbox-neon/40' : 'hover:bg-white/[0.05]'
                    }`}
                  >
                    {item.icon ? (
                      <img src={item.icon} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-xl border border-white/10 bg-white/5 object-cover" />
                    ) : (
                      <span className="h-11 w-11 shrink-0 rounded-xl border border-white/10 bg-white/5" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">
                        <Highlight text={item.title} query={query} />
                      </span>
                      <span className="block font-mono text-[11px] text-neutral-400">{item.id}</span>
                    </span>
                    {i === active && <CornerDownLeft className="h-4 w-4 shrink-0 text-xbox-neon" />}
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
      <mark className="bg-transparent font-bold text-xbox-neon">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}
