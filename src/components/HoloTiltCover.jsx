import { useEffect, useRef, useState } from 'react';
import { ImageOff, Sparkles, Layers, Eye } from 'lucide-react';
import { generateOrGetDepthMap, getProxiedImageUrl } from '../lib/depthEstimation.js';
import { createDepthParallaxRenderer } from '../lib/depthWebGL.js';

function loadImageElement(src, crossOrigin = 'anonymous') {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar imagem para textura WebGL'));
    img.src = src;
  });
}

/**
 * Capa com efeito 3D Parallax Hover + Acabamento de Figurinha Holográfica
 * + Depth Estimation (Depth Anything V2 via WebGPU/WASM + Raymarched WebGL Parallax Occlusion).
 *
 * Arquitetura A (Vercel Free / Custo Zero):
 * 1. Exibe a capa imediatamente com 3D Tilt + Holografia (0ms de espera).
 * 2. Em segundo plano (Web Worker + Cache IndexedDB), gera o mapa de profundidade via Depth Anything V2.
 * 3. Quando pronto, ativa o shader WebGL que separa fisicamente o primeiro plano (personagem/logo) do fundo.
 */
export default function HoloTiltCover({
  src,
  alt,
  isSquare = false,
  maxTilt = 13,
  scale = 1.035,
  className = '',
}) {
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const glCanvasRef = useRef(null);
  const glRendererRef = useRef(null);
  const rafRef = useRef(null);
  const showDepthRef = useRef(false);

  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Estado do pipeline Depth Anything V2: 'idle' | 'loading' | 'ready' | 'unsupported'
  const [depthState, setDepthState] = useState({ status: 'idle', progress: null });
  const [showDepthMap, setShowDepthMap] = useState(false);

  // Estado físico da animação (mantido em ref para 60/120fps sem re-renders do React)
  const physicsRef = useRef({
    rx: 0,
    ry: 0,
    px: 0,
    py: 0,
    gx: 50,
    gy: 50,
    intensity: 0,
    targetRx: 0,
    targetRy: 0,
    targetPx: 0,
    targetPy: 0,
    targetGx: 50,
    targetGy: 50,
    targetIntensity: 0,
    active: false,
  });

  useEffect(() => {
    showDepthRef.current = showDepthMap;
    if (glRendererRef.current) {
      const s = physicsRef.current;
      glRendererRef.current.render({
        px: s.px,
        py: s.py,
        intensity: s.intensity,
        showDepth: showDepthMap,
      });
    }
  }, [showDepthMap]);

  // Reinicia estados quando a URL da capa muda
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
    setShowDepthMap(false);
    setDepthState({ status: 'idle', progress: null });

    if (glRendererRef.current) {
      glRendererRef.current.destroy();
      glRendererRef.current = null;
    }
  }, [src]);

  // Detecta preferência do sistema por movimento reduzido
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    const onChange = (e) => setReducedMotion(e.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
  }, []);

  // Pipeline em segundo plano: Depth Anything V2 + Textura WebGL
  useEffect(() => {
    if (!src || failed || reducedMotion) return;

    let cancelled = false;

    async function initDepthPipeline() {
      try {
        setDepthState({ status: 'loading', progress: null });

        const proxiedCoverUrl = getProxiedImageUrl(src);

        // Carrega em paralelo a imagem com CORS liberado e o Mapa de Profundidade (IndexedDB ou Web Worker IA)
        const [corsCoverImg, depthDataUrl] = await Promise.all([
          loadImageElement(proxiedCoverUrl, 'anonymous'),
          generateOrGetDepthMap(src, {
            onStatus: (info) => {
              if (cancelled) return;
              if (info.stage === 'downloading' && typeof info.progress === 'number') {
                setDepthState({ status: 'loading', progress: info.progress });
              } else if (info.stage === 'inferring') {
                setDepthState({ status: 'loading', progress: null });
              }
            },
          }),
        ]);

        if (cancelled || !depthDataUrl || !glCanvasRef.current) return;

        const depthImg = await loadImageElement(depthDataUrl, null);
        if (cancelled || !glCanvasRef.current) return;

        const renderer = createDepthParallaxRenderer(glCanvasRef.current, corsCoverImg, depthImg);
        if (!renderer) {
          setDepthState({ status: 'unsupported', progress: null });
          return;
        }

        glRendererRef.current = renderer;
        const s = physicsRef.current;
        renderer.render({
          px: s.px,
          py: s.py,
          intensity: s.intensity,
          showDepth: showDepthRef.current,
        });

        setDepthState({ status: 'ready', progress: null });
      } catch {
        if (!cancelled) {
          setDepthState({ status: 'unsupported', progress: null });
        }
      }
    }

    initDepthPipeline();

    return () => {
      cancelled = true;
      if (glRendererRef.current) {
        glRendererRef.current.destroy();
        glRendererRef.current = null;
      }
    };
  }, [src, failed, reducedMotion]);

  // Limpa requestAnimationFrame ao desmontar
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const applyStyles = (s) => {
    const el = cardRef.current;
    if (!el) return;

    const currentScale = 1 + (scale - 1) * s.intensity;
    const hyp = Math.min(1, Math.hypot(s.px, s.py));
    const angle = Math.atan2(s.py, s.px) * (180 / Math.PI) + 90;

    el.style.setProperty('--rx', `${s.rx.toFixed(2)}deg`);
    el.style.setProperty('--ry', `${s.ry.toFixed(2)}deg`);
    el.style.setProperty('--scale', currentScale.toFixed(4));
    el.style.setProperty('--px', s.px.toFixed(3));
    el.style.setProperty('--py', s.py.toFixed(3));
    el.style.setProperty('--gx', `${s.gx.toFixed(1)}%`);
    el.style.setProperty('--gy', `${s.gy.toFixed(1)}%`);
    el.style.setProperty('--holo-opacity', (s.intensity * (0.55 + hyp * 0.45)).toFixed(3));
    el.style.setProperty('--glare-opacity', (s.intensity * 0.85).toFixed(3));
    el.style.setProperty('--angle', `${angle.toFixed(1)}deg`);
    el.style.setProperty('--shadow-x', `${(-s.ry * 1.1).toFixed(1)}px`);
    el.style.setProperty('--shadow-y', `${(18 + s.rx * 0.9).toFixed(1)}px`);

    // Atualiza o shader WebGL de profundidade 3D sincronizado a cada frame
    if (glRendererRef.current) {
      glRendererRef.current.render({
        px: s.px,
        py: s.py,
        intensity: s.intensity,
        showDepth: showDepthRef.current,
      });
    }
  };

  const tick = () => {
    const s = physicsRef.current;
    const ease = s.active ? 0.14 : 0.1;

    s.rx += (s.targetRx - s.rx) * ease;
    s.ry += (s.targetRy - s.ry) * ease;
    s.px += (s.targetPx - s.px) * ease;
    s.py += (s.targetPy - s.py) * ease;
    s.gx += (s.targetGx - s.gx) * ease;
    s.gy += (s.targetGy - s.gy) * ease;
    s.intensity += (s.targetIntensity - s.intensity) * ease;

    applyStyles(s);

    const isSettled =
      !s.active &&
      Math.abs(s.rx) < 0.02 &&
      Math.abs(s.ry) < 0.02 &&
      Math.abs(s.px) < 0.002 &&
      Math.abs(s.py) < 0.002 &&
      Math.abs(s.intensity) < 0.005;

    if (!isSettled) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      s.rx = 0;
      s.ry = 0;
      s.px = 0;
      s.py = 0;
      s.gx = 50;
      s.gy = 50;
      s.intensity = 0;
      applyStyles(s);
      rafRef.current = null;
    }
  };

  const startLoop = () => {
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  const updateFromClientCoords = (clientX, clientY) => {
    if (reducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const relX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const relY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const normX = (relX - 0.5) * 2;
    const normY = (relY - 0.5) * 2;

    const s = physicsRef.current;
    s.targetRx = -normY * maxTilt;
    s.targetRy = normX * maxTilt;
    s.targetPx = normX;
    s.targetPy = normY;
    s.targetGx = relX * 100;
    s.targetGy = relY * 100;
    s.targetIntensity = 1;
    s.active = true;

    startLoop();
  };

  const resetTilt = () => {
    const s = physicsRef.current;
    s.targetRx = 0;
    s.targetRy = 0;
    s.targetPx = 0;
    s.targetPy = 0;
    s.targetGx = 50;
    s.targetGy = 50;
    s.targetIntensity = 0;
    s.active = false;
    startLoop();
  };

  const handleMouseMove = (e) => {
    updateFromClientCoords(e.clientX, e.clientY);
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      updateFromClientCoords(touch.clientX, touch.clientY);
    }
  };

  const aspectClass = isSquare ? 'aspect-square' : 'aspect-[2/3]';
  const isDepthReady = depthState.status === 'ready';

  if (!src || failed) {
    return (
      <div
        className={`flex ${aspectClass} w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 ${className}`}
      >
        <ImageOff className="h-10 w-10 text-white/20" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseMove}
      onMouseLeave={resetTilt}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={resetTilt}
      onTouchCancel={resetTilt}
      className={`group/holo holo-tilt-perspective select-none ${aspectClass} w-full ${className}`}
    >
      <div
        ref={cardRef}
        className="holo-tilt-card relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5"
      >
        {/* Camada 1A: Imagem base instantânea (usada imediatamente e como fallback antes do WebGL ficar pronto) */}
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          draggable={false}
          className={`holo-tilt-image h-full w-full object-cover transition-opacity duration-500 ${
            isDepthReady ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Camada 1B: Renderizador WebGL 3D Depth Parallax (Depth Anything V2 Raymarching) */}
        <canvas
          ref={glCanvasRef}
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            isDepthReady ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Camadas ópticas holográficas */}
        {loaded && !reducedMotion && (
          <>
            {/* Camada 2: Acabamento Foil Holográfico Iridescente */}
            <div className="holo-tilt-foil pointer-events-none absolute inset-0 rounded-2xl" />

            {/* Camada 3: Reflexo de luz especular dinâmico */}
            <div className="holo-tilt-glare pointer-events-none absolute inset-0 rounded-2xl" />

            {/* Camada 4: Borda chanfrada 3D com iluminação direcional */}
            <div className="holo-tilt-rim pointer-events-none absolute inset-0 rounded-2xl" />
          </>
        )}

        {/* Indicador discreto do status da IA de Profundidade / Botão para inspecionar o Depth Map */}
        {!reducedMotion && depthState.status === 'loading' && (
          <div className="pointer-events-none absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-2.5 py-1 text-[10px] font-action font-semibold uppercase tracking-wider text-white/80 backdrop-blur-md">
            <Sparkles className="h-3 w-3 animate-pulse text-xbox-neon" />
            <span>
              {typeof depthState.progress === 'number'
                ? `IA 3D ${depthState.progress}%`
                : 'Gerando 3D IA…'}
            </span>
          </div>
        )}

        {!reducedMotion && isDepthReady && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDepthMap((v) => !v);
            }}
            title={
              showDepthMap
                ? 'Voltar para a arte da capa com Parallax 3D'
                : 'Visualizar mapa de profundidade gerado pela IA (Depth Anything V2)'
            }
            className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/75 px-2.5 py-1 text-[10px] font-action font-semibold uppercase tracking-wider text-white/90 opacity-0 shadow-lg backdrop-blur-md transition duration-200 hover:border-xbox-neon/60 hover:bg-black/90 hover:text-xbox-neon group-hover/holo:opacity-100 focus:opacity-100"
          >
            {showDepthMap ? (
              <>
                <Eye className="h-3 w-3 text-xbox-neon" />
                <span>Ver Capa 3D</span>
              </>
            ) : (
              <>
                <Layers className="h-3 w-3 text-xbox-neon" />
                <span>3D IA · Ver Mapa</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
