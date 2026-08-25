import React from 'react';
import { useGraphStore } from '../store/graphStore';

export const TEMPLATES = [
  { name: 'Benzene', smiles: 'C1=CC=CC=C1' },
  { name: 'Naphthalene', smiles: 'C1=CC2=CC=CC=C2C=C1' },
  { name: 'Cyclopentadiene', smiles: 'C1=CCC=C1' },
  { name: 'Indole', smiles: 'C1=CC=C2C(=C1)C=CN2' },
  { name: 'Purine', smiles: 'C1=NC2=NC=NC(=C2N1)N' },
  { name: 'Steroid Core', smiles: 'C1CC2CCC3C(C2C1)CCC4C3(CCC4)C' },
  { name: 'Tryptophan', smiles: 'C1=CC=C2C(=C1)C(=CN2)CC(C(=O)O)N' },
  { name: 'Aspirin', smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O' },
  { name: 'Caffeine', smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C' },
  { name: 'Penicillin Core', smiles: 'CC1(C)S[C@@H]2[C@H](NC(=O)*)C(=O)N2[C@H]1C(=O)O' },
];

export function TemplateSidebar() {
  const handleTemplateClick = async (smiles: string) => {
    try {
      const res = await (window as any).electronAPI.smilesToGraph(smiles);
      if (res.error) {
        alert(res.error);
        return;
      }
      if (res && res.atoms && res.bonds) {
        const state = useGraphStore.getState();
        state.snapshot();
        state.loadGraph(res.atoms, res.bonds);
      }
    } catch (err) {
      alert('Error loading template: ' + err);
    }
  };

  return (
    <div className="template-sidebar" style={{
      width: '180px',
      borderRight: '1px solid #e2e8f0',
      background: '#f8fafc',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      padding: '12px'
    }}>
      <h3 style={{ fontSize: '13px', margin: '0 0 12px 0', color: '#1e293b' }}>Templates</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {TEMPLATES.map(t => (
          <button
            key={t.name}
            onClick={() => handleTemplateClick(t.smiles)}
            style={{
              padding: '8px',
              textAlign: 'left',
              fontSize: '12px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#334155',
              fontWeight: 500,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#94a3b8';
              e.currentTarget.style.background = '#f1f5f9';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.background = '#ffffff';
            }}
          >
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}
