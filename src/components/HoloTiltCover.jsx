import { useEffect, useRef, useState } from 'react';
import { ImageOff } from 'lucide-react';

/**
 * Capa com efeito 3D Parallax Hover e reflexo holográfico sutil.
 *
 * Características técnicas:
 * - Motor de interpolação (LERP) via requestAnimationFrame direto em CSS Variables (zero re-renders no React).
 * - Para o loop de animação automaticamente quando em repouso (0% de uso de CPU ocioso).
 * - Parallax interno na imagem + iluminação especular suave + reflexo iridescente discreto + borda 3D.
 * - Suporte a toque em dispositivos móveis sem bloquear o scroll vertical da página.
 * - Respeita `prefers-reduced-motion: reduce`.
 */
export default function HoloTiltCover({
  src,
  alt,
  isSquare = false,
  maxTilt = 12,
  scale = 1.03,
  className = '',
}) {
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const rafRef = useRef(null);

  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Estado físico da animação (mantido em ref para evitar re-renderizações a 60/120fps)
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

  // Reinicia estados quando a URL da capa muda
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
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
    // Opacidade holográfica bem sutil para não interferir na leitura da arte da capa
    el.style.setProperty('--holo-opacity', (s.intensity * (0.18 + hyp * 0.16)).toFixed(3));
    el.style.setProperty('--glare-opacity', (s.intensity * 0.55).toFixed(3));
    el.style.setProperty('--angle', `${angle.toFixed(1)}deg`);
    el.style.setProperty('--shadow-x', `${(-s.ry * 1.1).toFixed(1)}px`);
    el.style.setProperty('--shadow-y', `${(18 + s.rx * 0.9).toFixed(1)}px`);
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

  if (!src || failed) {
    return (
      <div
        className={`flex ${aspectClass} w-full items-center justify-center rounded-2xl border border-white/[0.08] bg-[#141a16] ${className}`}
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
      className={`holo-tilt-perspective select-none ${aspectClass} w-full ${className}`}
    >
      <div
        ref={cardRef}
        className="holo-tilt-card relative h-full w-full overflow-hidden rounded-2xl border border-white/[0.12] bg-[#141a16]"
      >
        {/* Camada 1: Imagem da capa com contra-parallax interno suave */}
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          draggable={false}
          className="holo-tilt-image h-full w-full object-cover"
        />

        {/* Camadas ópticas sutis (ativas após o carregamento da imagem e quando sem movimento reduzido) */}
        {loaded && !reducedMotion && (
          <>
            {/* Camada 2: Acabamento Foil Holográfico discreto concentrado apenas próximo ao reflexo */}
            <div className="holo-tilt-foil pointer-events-none absolute inset-0 rounded-2xl" />

            {/* Camada 3: Reflexo de luz especular suave que acompanha o cursor */}
            <div className="holo-tilt-glare pointer-events-none absolute inset-0 rounded-2xl" />

            {/* Camada 4: Borda chanfrada 3D com iluminação direcional */}
            <div className="holo-tilt-rim pointer-events-none absolute inset-0 rounded-2xl" />
          </>
        )}
      </div>
    </div>
  );
}
