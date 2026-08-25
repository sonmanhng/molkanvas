import React, { useState, useRef } from 'react';
import { useGraphStore } from '../store/graphStore';

interface TLCSpot {
  id: string;
  rf: number;
  color: string;
  smear: number; // 0 to 1
}

interface TLCLane {
  id: string;
  label: string;
  spots: TLCSpot[];
}

export function TLCGenerator({ onClose }: { onClose: () => void }) {
  const store = useGraphStore();
  const [lanes, setLanes] = useState<TLCLane[]>([
    {
      id: 'lane_1', label: '1', spots: [
        { id: 's1', rf: 0.2, color: '#ef4444', smear: 0.1 },
        { id: 's2', rf: 0.5, color: '#3b82f6', smear: 0.05 }
      ]
    },
    {
      id: 'lane_2', label: '2', spots: [
        { id: 's3', rf: 0.5, color: '#3b82f6', smear: 0.05 }
      ]
    }
  ]);
  const [uvMode, setUvMode] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const PLATE_WIDTH = Math.max(120, lanes.length * 60 + 40);
  const PLATE_HEIGHT = 300;
  const MARGIN_X = 20;
  const MARGIN_BOTTOM = 30;
  const MARGIN_TOP = 20;
  const RUN_LENGTH = PLATE_HEIGHT - MARGIN_BOTTOM - MARGIN_TOP;

  const addLane = () => {
    setLanes([...lanes, { id: 'lane_' + Math.random(), label: String(lanes.length + 1), spots: [] }]);
  };
  const removeLane = (id: string) => {
    setLanes(lanes.filter(l => l.id !== id));
  };
  const addSpot = (laneId: string) => {
    setLanes(lanes.map(l => {
      if (l.id === laneId) {
        return { ...l, spots: [...l.spots, { id: 'spot_' + Math.random(), rf: 0.5, color: '#64748b', smear: 0.1 }] };
      }
      return l;
    }));
  };
  const updateSpot = (laneId: string, spotId: string, updates: Partial<TLCSpot>) => {
    setLanes(lanes.map(l => {
      if (l.id === laneId) {
        return { ...l, spots: l.spots.map(s => s.id === spotId ? { ...s, ...updates } : s) };
      }
      return l;
    }));
  };
  const removeSpot = (laneId: string, spotId: string) => {
    setLanes(lanes.map(l => {
      if (l.id === laneId) {
        return { ...l, spots: l.spots.filter(s => s.id !== spotId) };
      }
      return l;
    }));
  };

  const handleInsert = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    // Convert to base64
    const base64 = btoa(unescape(encodeURIComponent(svgData)));
    const dataUrl = `data:image/svg+xml;base64,${base64}`;
    
    // Insert into store
    const { panX, panY, zoom } = store;
    const cx = (400 - panX) / zoom - PLATE_WIDTH / 2;
    const cy = (300 - panY) / zoom - PLATE_HEIGHT / 2;
    
    store.addImage(dataUrl, cx, cy, PLATE_WIDTH, PLATE_HEIGHT);
    store.snapshot();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', width: '900px', height: '600px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>TLC Plate Studio</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Controls (Left) */}
          <div style={{ width: '400px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: '#334155' }}>
                <input type="checkbox" checked={uvMode} onChange={e => setUvMode(e.target.checked)} />
                UV 254nm Mode
              </label>
              <button onClick={addLane} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                + Add Lane
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {lanes.map((lane, i) => (
                <div key={lane.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: '#475569' }}>Lane {i + 1}</strong>
                      <input 
                        type="text" value={lane.label} onChange={e => setLanes(lanes.map(l => l.id === lane.id ? { ...l, label: e.target.value } : l))}
                        style={{ width: '60px', padding: '2px 6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <button onClick={() => addSpot(lane.id)} style={{ padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', marginRight: '4px' }}>+ Spot</button>
                      <button onClick={() => removeLane(lane.id)} style={{ padding: '4px 8px', background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Del</button>
                    </div>
                  </div>
                  
                  {lane.spots.map((spot) => (
                    <div key={spot.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 24px', gap: '8px', alignItems: 'center', marginBottom: '8px', padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                      <input type="color" value={spot.color} onChange={e => updateSpot(lane.id, spot.id, { color: e.target.value })} style={{ width: '24px', height: '24px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b' }}>
                          <span style={{ width: '30px' }}>Rf:</span>
                          <input type="range" min="0.01" max="0.99" step="0.01" value={spot.rf} onChange={e => updateSpot(lane.id, spot.id, { rf: parseFloat(e.target.value) })} style={{ flex: 1 }} />
                          <span style={{ width: '30px', textAlign: 'right' }}>{spot.rf.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b' }}>
                          <span style={{ width: '40px' }}>Tailing:</span>
                          <input type="range" min="0" max="1" step="0.05" value={spot.smear} onChange={e => updateSpot(lane.id, spot.id, { smear: parseFloat(e.target.value) })} style={{ flex: 1 }} />
                        </div>
                      </div>
                      <button onClick={() => removeSpot(lane.id, spot.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}>&times;</button>
                    </div>
                  ))}
                  {lane.spots.length === 0 && <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No spots in this lane.</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Preview (Right) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', padding: '24px' }}>
            <div style={{ 
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              background: 'white',
              position: 'relative'
            }}>
              <svg 
                ref={svgRef}
                width={PLATE_WIDTH} 
                height={PLATE_HEIGHT} 
                viewBox={`0 0 ${PLATE_WIDTH} ${PLATE_HEIGHT}`}
                style={{ display: 'block' }}
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Plate Background */}
                <rect 
                  x="0" y="0" width={PLATE_WIDTH} height={PLATE_HEIGHT} 
                  fill={uvMode ? '#84cc16' : '#ffffff'} 
                  stroke="#cbd5e1" strokeWidth="2"
                />
                
                {/* Baseline & Solvent Front */}
                <line x1={MARGIN_X/2} y1={PLATE_HEIGHT - MARGIN_BOTTOM} x2={PLATE_WIDTH - MARGIN_X/2} y2={PLATE_HEIGHT - MARGIN_BOTTOM} stroke={uvMode ? '#4d7c0f' : '#cbd5e1'} strokeWidth="1" strokeDasharray="4 2" />
                <line x1={MARGIN_X/2} y1={MARGIN_TOP} x2={PLATE_WIDTH - MARGIN_X/2} y2={MARGIN_TOP} stroke={uvMode ? '#4d7c0f' : '#cbd5e1'} strokeWidth="1" />
                
                {/* Lanes & Spots */}
                {lanes.map((lane, i) => {
                  const laneX = MARGIN_X + (lanes.length === 1 ? (PLATE_WIDTH - 2*MARGIN_X)/2 : i * ((PLATE_WIDTH - 2*MARGIN_X) / (lanes.length - 1)));
                  return (
                    <g key={lane.id}>
                      {/* Lane Label */}
                      <text x={laneX} y={PLATE_HEIGHT - 10} fontSize="12" fontFamily="sans-serif" fill={uvMode ? '#3f6212' : '#64748b'} textAnchor="middle">{lane.label}</text>
                      {/* Tick mark */}
                      <line x1={laneX} y1={PLATE_HEIGHT - MARGIN_BOTTOM - 2} x2={laneX} y2={PLATE_HEIGHT - MARGIN_BOTTOM + 2} stroke={uvMode ? '#4d7c0f' : '#cbd5e1'} strokeWidth="1" />
                      
                      {/* Spots */}
                      {lane.spots.map(spot => {
                        const spotY = PLATE_HEIGHT - MARGIN_BOTTOM - (spot.rf * RUN_LENGTH);
                        const spotWidth = 8 + (spot.smear * 12);
                        const spotHeight = 4 + (spot.smear * 30); // Tailing stretches downwards and upwards
                        const renderColor = uvMode ? `rgba(17, 24, 39, ${0.7 + spot.smear * 0.3})` : spot.color;
                        
                        return (
                          <g key={spot.id}>
                            <ellipse 
                              cx={laneX} 
                              cy={spotY + (spotHeight/4)} // offset down a bit if smeared
                              rx={spotWidth / 2} 
                              ry={spotHeight / 2} 
                              fill={renderColor}
                              opacity={uvMode ? 1 : 0.8}
                              style={uvMode ? { filter: 'drop-shadow(0px 0px 4px rgba(0,0,0,0.4))' } : {}}
                            />
                            {/* Inner dense core for realism */}
                            <ellipse 
                              cx={laneX} 
                              cy={spotY}
                              rx={(spotWidth / 2) * 0.6} 
                              ry={2} 
                              fill={renderColor}
                              opacity={0.9}
                            />
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </svg>
            </div>
            
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleInsert} style={{ padding: '8px 24px', border: 'none', background: '#10b981', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)' }}>
                Insert to Canvas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
