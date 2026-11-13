import { useState, useRef, useEffect, useMemo } from 'react';
import { TrendingDown, Calendar, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { formatPrice } from '../lib/priceHistory';

export default function PriceHistoryChart({ data }) {
  const [range, setRange] = useState('all'); // 'all' | '1y' | '6m'
  const [showTable, setShowTable] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const history = data?.history || [];

  // Filtra os pontos de acordo com o intervalo selecionado
  const activePoints = useMemo(() => {
    if (!history.length || range === 'all') return history;

    const lastDate = new Date(history[history.length - 1].date);
    const cutoff = new Date(lastDate);
    if (range === '1y') cutoff.setFullYear(lastDate.getFullYear() - 1);
    if (range === '6m') cutoff.setMonth(lastDate.getMonth() - 6);

    const filtered = history.filter((p) => new Date(p.date) >= cutoff);
    return filtered.length > 1 ? filtered : history;
  }, [history, range]);

  // Renderização do Canvas com DPI escalonado e linha em escada (step-line)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activePoints.length) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      if (width === 0 || height === 0) return;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.resetTransform?.() || ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);

      const padding = { top: 22, right: 20, bottom: 28, left: 62 };
      const chartW = width - padding.left - padding.right;
      const chartH = height - padding.top - padding.bottom;

      if (chartW <= 0 || chartH <= 0) return;

      const prices = activePoints.map((p) => p.price);
      const minP = Math.max(0, Math.min(...prices) * 0.9);
      const maxP = Math.max(...prices) * 1.05 || 100;
      const priceRange = maxP - minP || 1;

      const getX = (idx) => padding.left + (idx / (activePoints.length - 1 || 1)) * chartW;
      const getY = (price) => padding.top + chartH - ((price - minP) / priceRange) * chartH;

      // 1. Linhas de grade e valores no eixo Y
      const steps = 4;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';

      for (let i = 0; i <= steps; i++) {
        const val = minP + (priceRange * i) / steps;
        const y = padding.top + chartH - (chartH * i) / steps;

        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartW, y);
        ctx.stroke();

        ctx.fillText(`R$ ${Math.round(val)}`, padding.left - 8, y + 4);
      }

      // 2. Área sombreada verde sob a curva
      const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      grad.addColorStop(0, 'rgba(82, 214, 39, 0.30)');
      grad.addColorStop(1, 'rgba(82, 214, 39, 0.0)');

      ctx.beginPath();
      ctx.moveTo(getX(0), getY(activePoints[0].price));
      for (let i = 1; i < activePoints.length; i++) {
        const currX = getX(i);
        const currY = getY(activePoints[i].price);
        ctx.lineTo(currX, getY(activePoints[i - 1].price));
        ctx.lineTo(currX, currY);
      }
      ctx.lineTo(padding.left + chartW, padding.top + chartH);
      ctx.lineTo(padding.left, padding.top + chartH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // 3. Linha em degraus (Step Line) principal
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(activePoints[0].price));
      for (let i = 1; i < activePoints.length; i++) {
        const currX = getX(i);
        const currY = getY(activePoints[i].price);
        ctx.lineTo(currX, getY(activePoints[i - 1].price));
        ctx.lineTo(currX, currY);
      }
      ctx.strokeStyle = '#52d627';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // 4. Linha pontilhada dourada do menor preço histórico
      if (data.lowestPrice != null && data.lowestPrice >= minP && data.lowestPrice <= maxP) {
        const lowY = getY(data.lowestPrice);
        ctx.strokeStyle = 'rgba(241, 196, 15, 0.65)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padding.left, lowY);
        ctx.lineTo(padding.left + chartW, lowY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 5. Rótulos das datas no eixo X
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(formatDateShort(activePoints[0].date), padding.left, padding.top + chartH + 20);

      ctx.textAlign = 'right';
      ctx.fillText(formatDateShort(activePoints[activePoints.length - 1].date), padding.left + chartW, padding.top + chartH + 20);

      // 6. Indicador de Hover
      if (hoveredPoint) {
        const ptX = getX(hoveredPoint.index);
        const ptY = getY(hoveredPoint.price);

        // Linha vertical guia
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(ptX, padding.top);
        ctx.lineTo(ptX, padding.top + chartH);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ponto verde destacado
        ctx.beginPath();
        ctx.arc(ptX, ptY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#52B788';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    render();

    const resizeObserver = new ResizeObserver(() => {
      animationFrameId = requestAnimationFrame(render);
    });
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [activePoints, data.lowestPrice, hoveredPoint]);

  // Manipulador de mouse no canvas
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !activePoints.length) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const padding = { left: 62, right: 20 };
    const chartW = rect.width - padding.left - padding.right;

    if (mouseX >= padding.left && mouseX <= padding.left + chartW) {
      const ratio = (mouseX - padding.left) / chartW;
      const targetIdx = Math.min(
        activePoints.length - 1,
        Math.max(0, Math.round(ratio * (activePoints.length - 1)))
      );
      const point = activePoints[targetIdx];
      const ptX = padding.left + (targetIdx / (activePoints.length - 1 || 1)) * chartW;

      setHoveredPoint({
        index: targetIdx,
        price: point.price,
        date: point.date,
        x: ptX,
        y: e.clientY - rect.top,
      });
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  if (!history.length) return null;

  return (
    <div
      ref={containerRef}
      className="rounded-2xl border border-white/[0.08] bg-[#151c33]/90 p-4 shadow-portal-card backdrop-blur-xl sm:p-5"
    >
      {/* Topo do gráfico: título, fonte e botões de filtro */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-portal-cyan" />
          <h3 className="font-display text-base font-bold tracking-tight text-white">
            Histórico de Preços
          </h3>
          <span className="hidden text-xs text-slate-400 sm:inline">
            • {data.storeName || 'Microsoft Store'}
          </span>
        </div>

        {/* Filtros de período */}
        <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#0d1223] p-1">
          {[
            { id: 'all', label: 'Tudo' },
            { id: '1y', label: '1 Ano' },
            { id: '6m', label: '6 Meses' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setRange(btn.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                range === btn.id
                  ? 'bg-portal-blue text-white shadow-sm'
                  : 'text-slate-300/75 hover:bg-white/5 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Linha de status / tooltip superior */}
      <div className="flex min-h-[24px] items-center justify-between pb-1 pt-3 text-xs">
        {hoveredPoint ? (
          <div className="flex items-center gap-2 font-mono text-emerald-400">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDateFull(hoveredPoint.date)}</span>
            <span className="text-slate-500">•</span>
            <span className="font-bold text-white">{formatPrice(hoveredPoint.price)}</span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400">
            Passe o mouse ou toque para inspecionar os valores
          </div>
        )}

        {data.lowestPrice != null && (
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-300">
            <span className="inline-block h-1.5 w-3 border-b border-dashed border-amber-300"></span>
            <span>Menor: {formatPrice(data.lowestPrice)}</span>
          </div>
        )}
      </div>

      {/* Canvas do Gráfico */}
      <div className="relative mt-2 h-56 w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c1122] sm:h-64">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="block h-full w-full cursor-crosshair"
        />

        {/* Tooltip flutuante */}
        {hoveredPoint && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full transform rounded-xl border border-portal-blue/60 bg-[#0c1122]/95 px-3 py-1.5 text-center text-xs shadow-2xl backdrop-blur-md transition-all duration-75"
            style={{
              left: `${hoveredPoint.x}px`,
              top: `${Math.max(30, hoveredPoint.y - 12)}px`,
            }}
          >
            <div className="text-sm font-bold text-white">{formatPrice(hoveredPoint.price)}</div>
            <div className="font-mono text-[10px] text-slate-400">{formatDateShort(hoveredPoint.date)}</div>
          </div>
        )}
      </div>

      {/* Rodapé com botão de histórico tabular e link Deku Deals */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {data.recentChanges && data.recentChanges.length > 0 && (
          <button
            onClick={() => setShowTable((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-slate-200 transition hover:bg-white/10 hover:text-white"
          >
            {showTable ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            <span>Tabela de alterações ({data.recentChanges.length})</span>
          </button>
        )}

        {data.sourceUrl && (
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-400 transition hover:text-portal-cyan"
          >
            <span>Ver no Deku Deals</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Tabela de alterações recentes */}
      {showTable && data.recentChanges && data.recentChanges.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d1223]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.03] text-slate-400">
                <th className="px-3.5 py-2.5 font-semibold">Data</th>
                <th className="px-3.5 py-2.5 font-semibold">Preço</th>
                <th className="px-3.5 py-2.5 font-semibold">Variação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {data.recentChanges.map((c, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="px-3.5 py-2 font-mono text-slate-300">{formatDateFull(c.date)}</td>
                  <td className="px-3.5 py-2 font-semibold text-white">{formatPrice(c.price)}</td>
                  <td
                    className={`px-3.5 py-2 font-mono font-medium ${
                      c.diff < 0
                        ? 'text-emerald-400'
                        : c.diff > 0
                        ? 'text-rose-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {c.diff > 0 ? '+' : ''}
                    {c.diff !== 0 ? formatPrice(c.diff) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatDateFull(dateStr) {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-');
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
