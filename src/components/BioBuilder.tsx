import React, { useState } from 'react';
import { useGraphStore } from '../store/graphStore';
import { BIO_SHAPES } from './BioShapeLibrary';

export function BioBuilder({ onClose }: { onClose: () => void }) {
  const store = useGraphStore();
  const [activeTab, setActiveTab] = useState<'sequence' | 'shapes'>('sequence');
  const [sequence, setSequence] = useState('');
  const [seqType, setSeqType] = useState<'peptide' | 'fasta' | 'helm'>('peptide');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRenderSequence = async () => {
    if (!sequence.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Call electron IPC
      const result = await (window as any).electronAPI.parseSequence({ sequence, type: seqType });
      if (result.error) {
        setError(result.error);
      } else if (result.atoms && result.bonds) {
        store.loadGraph(result.atoms, result.bonds);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleShapeClick = (shape: any) => {
    const { panX, panY, zoom } = store;
    const cx = (400 - panX) / zoom - 50;
    const cy = (300 - panY) / zoom - 50;
    store.addImage(shape.svgDataUrl, cx, cy, 100, 100);
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
        background: 'white', borderRadius: '12px', width: '600px', height: '450px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>🧬 BioDraw Studio</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
          <button 
            onClick={() => setActiveTab('sequence')}
            style={{ flex: 1, padding: '12px', border: 'none', background: activeTab === 'sequence' ? 'white' : '#f1f5f9', fontWeight: activeTab === 'sequence' ? 600 : 400, color: activeTab === 'sequence' ? '#2563eb' : '#64748b', cursor: 'pointer', borderBottom: activeTab === 'sequence' ? '2px solid #2563eb' : '2px solid transparent' }}
          >
            Sequence Decoder
          </button>
          <button 
            onClick={() => setActiveTab('shapes')}
            style={{ flex: 1, padding: '12px', border: 'none', background: activeTab === 'shapes' ? 'white' : '#f1f5f9', fontWeight: activeTab === 'shapes' ? 600 : 400, color: activeTab === 'shapes' ? '#10b981' : '#64748b', cursor: 'pointer', borderBottom: activeTab === 'shapes' ? '2px solid #10b981' : '2px solid transparent' }}
          >
            Bio Shapes Library
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {activeTab === 'sequence' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="radio" name="seqType" checked={seqType === 'peptide'} onChange={() => setSeqType('peptide')} />
                  Peptide (e.g. Ala-Gly)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="radio" name="seqType" checked={seqType === 'fasta'} onChange={() => setSeqType('fasta')} />
                  FASTA (DNA/RNA)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="radio" name="seqType" checked={seqType === 'helm'} onChange={() => setSeqType('helm')} />
                  HELM Notation
                </label>
              </div>
              <textarea 
                value={sequence} 
                onChange={e => setSequence(e.target.value)}
                placeholder={seqType === 'peptide' ? "Enter 3-letter or 1-letter amino acid sequence (e.g., Ala-Gly-Ser or AGS)" : "Enter sequence data..."}
                style={{ width: '100%', height: '150px', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontFamily: 'monospace', fontSize: '14px', boxSizing: 'border-box' }}
              />
              {error && <div style={{ color: '#ef4444', fontSize: '13px', background: '#fee2e2', padding: '8px', borderRadius: '4px' }}>{error}</div>}
              <button 
                onClick={handleRenderSequence}
                disabled={loading || !sequence.trim()}
                style={{ padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Rendering...' : 'Render to 2D Structure'}
              </button>
            </div>
          )}

          {activeTab === 'shapes' && (
            <div>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px', marginTop: 0 }}>Select a biological component to insert into your drawing.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
                {BIO_SHAPES.map(shape => (
                  <button
                    key={shape.name}
                    onClick={() => handleShapeClick(shape)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px',
                      background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#10b981'}
                    onMouseOut={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                  >
                    <img src={shape.svgDataUrl} style={{ width: '60px', height: '60px', objectFit: 'contain', marginBottom: '8px' }} alt={shape.name} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', textAlign: 'center' }}>{shape.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
