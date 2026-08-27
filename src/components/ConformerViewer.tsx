import React, { useEffect, useRef, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

interface Conformer {
  id: number;
  energy: number;
  rel_energy: number;
  sdf: string;
}

interface ConformerViewerProps {
  conformers: Conformer[];
  onClose: () => void;
}

export function ConformerViewer({ conformers, onClose }: ConformerViewerProps) {
  const [selectedConf, setSelectedConf] = useState<Conformer>(conformers[0]);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !selectedConf) return;

    try {
      const mol3d = (window as any).$3Dmol;
      if (!mol3d || !mol3d.createViewer) return;

      if (!viewerRef.current) {
        viewerRef.current = mol3d.createViewer(containerRef.current, {
          backgroundColor: '#f8fafc'
        });
      }

      const viewer = viewerRef.current;
      viewer.clear();
      const safeSdf = selectedConf.sdf.replace(/\s+$/, '') + '\n$$$$\n';
      viewer.addModel(safeSdf, 'sdf');
      viewer.setStyle({}, { stick: { radius: 0.15 }, sphere: { scale: 0.25 } });
      viewer.zoomTo();
      viewer.render();
    } catch (err) {
      console.error(err);
    }
  }, [selectedConf]);

  const chartData = conformers.map((c, i) => ({
    x: i + 1, // conformer index
    y: c.rel_energy, // relative energy in kcal/mol
    id: c.id,
    sdf: c.sdf,
    rawEnergy: c.energy
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}>
          <p style={{ margin: 0 }}><strong>Conformer {payload[0].payload.x}</strong></p>
          <p style={{ margin: 0 }}>Relative Energy: {payload[0].value.toFixed(2)} kcal/mol</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="periodic-modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="periodic-modal-content" 
        style={{ width: '85vw', height: '85vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fdfdfd' }} 
        onClick={e => e.stopPropagation()}
      >
        <div className="periodic-header">
          <h3>Conformer Analysis (Energy Landscape)</h3>
          <button onClick={onClose}>&times;</button>
        </div>
        
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* LEFT: 3D Viewer */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0' }}>
            <div style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', fontSize: '13px', fontWeight: 600 }}>
              Viewing Conformer {chartData.find(c => c.id === selectedConf.id)?.x} 
              <span style={{ fontWeight: 'normal', color: '#64748b', marginLeft: '8px' }}>
                (ΔE = {selectedConf.rel_energy.toFixed(2)} kcal/mol)
              </span>
            </div>
            <div ref={containerRef} style={{ flex: 1, position: 'relative' }}></div>
          </div>

          {/* RIGHT: Chart */}
          <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#334155' }}>Energy Landscape (MMFF94)</h4>
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis type="number" dataKey="x" name="Conformer" label={{ value: 'Conformer Index', position: 'bottom' }} />
                  <YAxis type="number" dataKey="y" name="Relative Energy" label={{ value: 'ΔE (kcal/mol)', angle: -90, position: 'insideLeft' }} />
                  <ZAxis range={[60, 60]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                  <Scatter 
                    name="Conformers" 
                    data={chartData} 
                    fill="#3b82f6" 
                    onClick={(e) => {
                      if (e && e.payload) {
                        const clicked = conformers.find(c => c.id === e.payload.id);
                        if (clicked) setSelectedConf(clicked);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '16px', textAlign: 'center' }}>
              Click on a data point to view its 3D structure. The lowest energy conformer is typically the most stable in nature.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
