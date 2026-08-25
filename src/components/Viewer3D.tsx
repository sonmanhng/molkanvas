import { useEffect, useRef, useState } from 'react';

interface Props {
  sdfData: string;
  onClose: () => void;
}

export function Viewer3D({ sdfData, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    try {
      const mol3d = (window as any).$3Dmol;
      if (!mol3d || !mol3d.createViewer) {
        throw new Error('3Dmol library is not loaded properly in the browser.');
      }
      
      // To handle React 18 Strict Mode (unmount/remount with new DOM nodes):
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      
      const viewer = mol3d.createViewer(containerRef.current, {
        backgroundColor: '#eeeeee'
      });
      viewerRef.current = viewer;
      viewer.clear();
      
      // Ensure the mol block has a trailing newline and SDF separator, WITHOUT trimming the start
      const safeSdf = sdfData.replace(/\s+$/, '') + '\n$$$$\n';
      const model = viewer.addModel(safeSdf, 'sdf'); 
      viewer.setStyle({}, { stick: { radius: 0.15 }, sphere: { scale: 0.25 } });
      
      const parsedAtoms = model.selectedAtoms({});
      
      // Allow DOM to settle layout before zooming and rendering
      setTimeout(() => {
        viewer.resize();
        viewer.zoomTo();
        viewer.render();
      }, 100);
      
      if (parsedAtoms.length === 0) {
        throw new Error('3Dmol parsed 0 atoms from the SDF data!');
      }
    } catch (err: any) {
      setErrorMsg(err.message || String(err));
    }
  }, [sdfData]);

  return (
    <div className="periodic-modal-backdrop" onClick={onClose}>
      <div 
        className="periodic-modal-content" 
        style={{ width: '80vw', height: '80vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fdfdfd' }} 
        onClick={e => e.stopPropagation()}
      >
        <div className="periodic-header">
          <h3>3D Structure (SDF: {sdfData?.length || 0})</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={async () => {
                try {
                  await (window as any).electronAPI.saveFile(sdfData, {
                    title: 'Save 3D SDF',
                    defaultPath: 'structure_3d.sdf',
                    filters: [{ name: 'SDF File', extensions: ['sdf', 'mol'] }]
                  });
                } catch (err) {
                  alert('Lỗi lưu SDF: ' + err);
                }
              }}
              style={{
                padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc',
                backgroundColor: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
              }}
            >
              Save SDF
            </button>
            <button onClick={onClose}>&times;</button>
          </div>
        </div>
        {errorMsg && (
          <div style={{ padding: '16px', color: 'red', fontWeight: 'bold' }}>
            Error: {errorMsg}
          </div>
        )}
        <div style={{ flexGrow: 1, position: 'relative', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
          <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        </div>
      </div>
    </div>
  );
}
