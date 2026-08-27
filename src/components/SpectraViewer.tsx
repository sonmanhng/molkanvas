import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useGraphStore } from '../store/graphStore';

type SpecMode = '1H' | '13C' | 'IR';

interface SpectraViewerProps {
  data1H: any;
  onClose: () => void;
  getMolPayload: () => string;
}

const TAB_CONFIG: { mode: SpecMode; label: string; color: string; unit: string }[] = [
  { mode: '1H',  label: '¹H NMR',  color: '#2563eb', unit: 'ppm' },
  { mode: '13C', label: '¹³C NMR', color: '#7c3aed', unit: 'ppm' },
  { mode: 'IR',  label: 'IR',      color: '#dc2626', unit: 'cm⁻¹' },
];

export function SpectraViewer({ data1H, onClose, getMolPayload }: SpectraViewerProps) {
  const setHoveredAtom = useGraphStore(state => state.setHoveredAtom);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 160 });
  const [activeTab, setActiveTab] = useState<SpecMode>('1H');
  const [tabData, setTabData] = useState<Record<SpecMode, any>>({ '1H': data1H, '13C': null, 'IR': null });
  const [loading, setLoading] = useState(false);
  const [hoverVal, setHoverVal] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDims({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    ro.observe(el);
    setDims({ w: el.offsetWidth, h: el.offsetHeight });
    return () => ro.disconnect();
  }, []);

  const switchTab = async (mode: SpecMode) => {
    setActiveTab(mode);
    if (tabData[mode]) return; // already loaded
    setLoading(true);
    try {
      const payload = getMolPayload();
      let result: any;
      if (mode === '13C' || mode === 'IR') {
        if (!(window as any).electronAPI) {
          alert('Lỗi: Bạn đang mở ứng dụng trong trình duyệt web thông thường (Chrome/Edge). Vui lòng chạy qua ứng dụng Electron để sử dụng tính năng này.');
          return;
        }
        result = await (window as any).electronAPI.predictIr(payload, mode);
      }
      setTabData(prev => ({ ...prev, [mode]: result }));
    } catch (e) {
      console.error('Spectra load error', e);
    } finally {
      setLoading(false);
    }
  };

  const currentData = tabData[activeTab];
  const tabCfg = TAB_CONFIG.find(t => t.mode === activeTab)!;

  // --- Chart dimensions ---
  const margin = { top: 12, right: 20, bottom: 32, left: 36 };
  const chartW = Math.max(dims.w - margin.left - margin.right, 1);
  const chartH = Math.max(dims.h - margin.top - margin.bottom, 1);

  // --- Scale helpers (depends on mode) ---
  const getXRange = (): [number, number] => {
    if (activeTab === '1H') return [0, 12];
    if (activeTab === '13C') return [0, 220];
    return [400, 4000];
  };

  const [xMin, xMax] = getXRange();
  const xReversed = activeTab !== 'IR'; // NMR: reversed (high->low), IR: normal (low->high)

  const xScale = (val: number) => {
    const fraction = xReversed
      ? (xMax - val) / (xMax - xMin)
      : (val - xMin) / (xMax - xMin);
    return margin.left + fraction * chartW;
  };

  const xInvert = (px: number) => {
    const fraction = (px - margin.left) / chartW;
    return xReversed
      ? xMax - fraction * (xMax - xMin)
      : xMin + fraction * (xMax - xMin);
  };

  const yScale = (v: number) => margin.top + chartH - (v / 100) * chartH;

  // --- Build points ---
  const spectrum = currentData?.spectrum || [];
  const pts = spectrum.map((d: any) => ({ x: d.x, y: d.y }));
  const peaks = currentData?.peaks || currentData?.bands || [];

  const polyline = pts
    .map((p: any) => `${xScale(p.x).toFixed(1)},${yScale(p.y).toFixed(1)}`)
    .join(' ');

  // --- X axis ticks ---
  const getXTicks = () => {
    if (activeTab === '1H') return [12, 10, 8, 6, 4, 2, 0];
    if (activeTab === '13C') return [220, 180, 140, 100, 60, 20, 0];
    return [4000, 3500, 3000, 2500, 2000, 1500, 1000, 500];
  };
  const xTicks = getXTicks();

  // --- Hover & atom highlighting ---
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const val = xInvert(mx);
    setHoverVal(val);

    if (!peaks || peaks.length === 0) return;
    const shiftKey = activeTab === 'IR' ? 'wavenumber' : 'shift';
    let nearest: any = peaks[0];
    let minDiff = Infinity;
    for (const p of peaks) {
      const diff = Math.abs((p[shiftKey] ?? p.shift ?? 0) - val);
      if (diff < minDiff) { minDiff = diff; nearest = p; }
    }
    const threshold = activeTab === 'IR' ? 40 : (activeTab === '13C' ? 5 : 0.2);
    if (minDiff < threshold && nearest?.parent_id) {
      setHoveredAtom(nearest.parent_id);
    } else {
      setHoveredAtom(null);
    }
  }, [peaks, chartW, activeTab, setHoveredAtom, xMin, xMax, xReversed]);

  const handleMouseLeave = useCallback(() => {
    setHoverVal(null);
    setHoveredAtom(null);
  }, [setHoveredAtom]);

  const cursorX = hoverVal !== null ? xScale(hoverVal) : null;

  // Format hover label
  const hoverLabel = hoverVal !== null
    ? activeTab === 'IR'
      ? `${Math.round(hoverVal)} cm⁻¹`
      : `δ ${hoverVal.toFixed(2)} ppm`
    : null;

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: '230px', background: '#fff',
      borderTop: '1.5px solid #e2e8f0',
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
      zIndex: 50
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 14px', borderBottom: '1px solid #f1f5f9',
        background: '#fafafa', flexShrink: 0, height: '38px'
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', marginRight: '8px' }}>Spectra</span>
          {TAB_CONFIG.map(t => (
            <button
              key={t.mode}
              onClick={() => switchTab(t.mode)}
              style={{
                padding: '3px 10px', fontSize: '12px', fontWeight: 600,
                border: activeTab === t.mode ? `1.5px solid ${t.color}` : '1.5px solid transparent',
                borderRadius: '6px', cursor: 'pointer',
                background: activeTab === t.mode ? `${t.color}15` : 'transparent',
                color: activeTab === t.mode ? t.color : '#94a3b8',
                transition: 'all 0.15s'
              }}
            >{t.label}</button>
          ))}
          <span style={{ marginLeft: '12px', fontSize: '11px', color: '#94a3b8' }}>
            {currentData?.formula}
          </span>
          {hoverLabel && (
            <span style={{ marginLeft: '8px', fontSize: '11px', color: tabCfg.color, fontWeight: 700, fontFamily: 'monospace' }}>
              {hoverLabel}
            </span>
          )}
          {loading && (
            <span style={{ marginLeft: '8px', fontSize: '11px', color: '#94a3b8' }}>Calculating…</span>
          )}
        </div>
        <button
          onClick={() => { setHoveredAtom(null); onClose(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '20px', lineHeight: 1, padding: '0 4px' }}
        >×</button>
      </div>

      {/* Chart */}
      <div ref={containerRef} style={{ flex: 1, overflow: 'hidden' }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '13px' }}>
            ⏳ Predicting {tabCfg.label} spectrum…
          </div>
        )}
        {!loading && !currentData && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '13px' }}>
            Click the tab to predict {tabCfg.label} spectrum
          </div>
        )}
        {!loading && currentData && (
          <svg
            width="100%" height="100%"
            style={{ display: 'block', cursor: 'crosshair' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Grid lines */}
            {xTicks.map(t => (
              <line key={t}
                x1={xScale(t)} y1={margin.top}
                x2={xScale(t)} y2={margin.top + chartH}
                stroke="#f1f5f9" strokeWidth={1}
              />
            ))}
            <line x1={margin.left} y1={margin.top + chartH} x2={margin.left + chartW} y2={margin.top + chartH} stroke="#cbd5e1" strokeWidth={1} />

            {/* Fill */}
            {pts.length > 1 && (
              <polygon
                points={`${xScale(pts[0].x).toFixed(1)},${(margin.top + chartH).toFixed(1)} ${polyline} ${xScale(pts[pts.length-1].x).toFixed(1)},${(margin.top + chartH).toFixed(1)}`}
                fill={`${tabCfg.color}0D`}
              />
            )}

            {/* Spectrum line */}
            {pts.length > 1 && (
              <polyline
                points={polyline}
                fill="none"
                stroke={tabCfg.color}
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
            )}

            {/* Peak markers */}
            {peaks.map((p: any, i: number) => {
              const xVal = p.shift ?? p.wavenumber;
              const sx = xScale(xVal);
              if (sx < margin.left || sx > margin.left + chartW) return null;
              return (
                <line key={i}
                  x1={sx} y1={margin.top}
                  x2={sx} y2={margin.top + chartH}
                  stroke={tabCfg.color} strokeWidth={1}
                  strokeDasharray="3 3" opacity={0.45}
                />
              );
            })}

            {/* Hover cursor */}
            {cursorX !== null && cursorX >= margin.left && cursorX <= margin.left + chartW && (
              <line
                x1={cursorX} y1={margin.top}
                x2={cursorX} y2={margin.top + chartH}
                stroke="#ef4444" strokeWidth={1} strokeDasharray="4 2"
              />
            )}

            {/* X axis */}
            {xTicks.map(t => (
              <g key={t}>
                <line x1={xScale(t)} y1={margin.top + chartH} x2={xScale(t)} y2={margin.top + chartH + 5} stroke="#94a3b8" strokeWidth={1} />
                <text x={xScale(t)} y={margin.top + chartH + 17} textAnchor="middle" fontSize="10" fill="#64748b">{activeTab === 'IR' ? t : t}</text>
              </g>
            ))}
            <text x={margin.left + chartW / 2} y={dims.h - 2} textAnchor="middle" fontSize="10" fill="#94a3b8">
              {activeTab === 'IR' ? 'Wavenumber (cm⁻¹)' : 'Chemical Shift (ppm)'}
            </text>
          </svg>
        )}
      </div>
    </div>
  );
}
