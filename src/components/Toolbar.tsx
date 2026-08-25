import React from 'react';
import { useGraphStore } from '../store/graphStore';
import type { ToolType } from '../store/graphStore';
import { PeriodicTable } from './PeriodicTable';

// ── SVG icons (24x24 viewBox) ────────────────────────────────────────────────
const SvgIcon = ({ children, fill = "none" }: { children: React.ReactNode, fill?: string }) => (
  <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill={fill}>
    {children}
  </svg>
);

const Arrow = () => (
  <SvgIcon>
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/>
  </SvgIcon>
);
const Eraser = () => (
  <SvgIcon>
    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
    <path d="M22 21H7" />
    <path d="m5 11 9 9" />
  </SvgIcon>
);
const BondSingle = () => (
  <SvgIcon>
    <line x1="5" y1="19" x2="19" y2="5" />
  </SvgIcon>
);
const BondDouble = () => (
  <SvgIcon>
    <line x1="5" y1="15" x2="15" y2="5" />
    <line x1="9" y1="19" x2="19" y2="9" />
  </SvgIcon>
);
const BondTriple = () => (
  <SvgIcon>
    <line x1="4" y1="14" x2="14" y2="4" />
    <line x1="7" y1="17" x2="17" y2="7" />
    <line x1="10" y1="20" x2="20" y2="10" />
  </SvgIcon>
);
const WedgeSolid = () => (
  <SvgIcon fill="currentColor">
    <polygon points="5,17 5,19 19,5" stroke="none" />
  </SvgIcon>
);
const WedgeHash = () => (
  <SvgIcon>
    <line x1="4" y1="19" x2="7" y2="22" />
    <line x1="7" y1="16" x2="11" y2="20" />
    <line x1="10" y1="13" x2="15" y2="18" />
    <line x1="13" y1="10" x2="19" y2="16" />
    <line x1="16" y1="7" x2="23" y2="14" />
  </SvgIcon>
);
const Ring6 = () => (
  <SvgIcon>
    <polygon points="12,3 19.8,7.5 19.8,16.5 12,21 4.2,16.5 4.2,7.5" />
    <polygon points="12,7 16,9.3 16,14.7 12,17 8,14.7 8,9.3" />
  </SvgIcon>
);
const Ring6Plain = () => (
  <SvgIcon>
    <polygon points="12,3 19.8,7.5 19.8,16.5 12,21 4.2,16.5 4.2,7.5" />
  </SvgIcon>
);
const Ring5 = () => (
  <SvgIcon>
    <polygon points="12,3 21,9.5 17.5,19 6.5,19 3,9.5" />
  </SvgIcon>
);
const Ring4 = () => (
  <SvgIcon>
    <rect x="5" y="5" width="14" height="14" rx="1" />
  </SvgIcon>
);
const Ring3 = () => (
  <SvgIcon>
    <polygon points="12,4 21,18 3,18" strokeLinejoin="miter" />
  </SvgIcon>
);
const TextTool = () => (
  <SvgIcon fill="currentColor">
    <text x="12" y="18" fontSize="18" fontFamily="Inter, sans-serif" fontWeight="700" textAnchor="middle" stroke="none">A</text>
  </SvgIcon>
);

const Hand = () => (
  <SvgIcon>
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
  </SvgIcon>
);


interface ToolGroup {
  tools: { id: ToolType; icon: React.ReactNode; label: string }[];
}

const TOOL_GROUPS: ToolGroup[] = [
  {
    tools: [
      { id: 'SELECT', icon: <Arrow />, label: 'Lasso Select' },
      { id: 'PAN', icon: <Hand />, label: 'Pan Canvas' },
      { id: 'ERASER', icon: <Eraser />, label: 'Eraser' },
    ]
  },
  {
    tools: [
      { id: 'BOND_SINGLE',     icon: <BondSingle />, label: 'Single Bond' },
      { id: 'BOND_DOUBLE',     icon: <BondDouble />, label: 'Double Bond' },
      { id: 'BOND_TRIPLE',     icon: <BondTriple />, label: 'Triple Bond' },
      { id: 'BOND_WEDGE',      icon: <WedgeSolid />, label: 'Wedge Bond' },
      { id: 'BOND_HASH',       icon: <WedgeHash />,  label: 'Hash Bond' },
    ]
  },
  {
    tools: [
      { id: 'RING_BENZENE',     icon: <Ring6 />,      label: 'Benzene' },
      { id: 'RING_CYCLOHEXANE', icon: <Ring6Plain />, label: 'Cyclohexane' },
      { id: 'RING_CYCLOPENTANE',icon: <Ring5 />,      label: 'Cyclopentane' },
      { id: 'RING_CYCLOBUTANE', icon: <Ring4 />,      label: 'Cyclobutane' },
      { id: 'RING_CYCLOPROPANE',icon: <Ring3 />,      label: 'Cyclopropane' },
    ]
  },
  {
    tools: [
      { id: 'ATOM_C',  icon: <span className="label-elem" style={{color:'#222'}}>C</span>,  label: 'Carbon' },
      { id: 'ATOM_N',  icon: <span className="label-elem" style={{color:'#27f'}}>N</span>,  label: 'Nitrogen' },
      { id: 'ATOM_O',  icon: <span className="label-elem" style={{color:'#d62'}}>O</span>,  label: 'Oxygen' },
      { id: 'ATOM_S',  icon: <span className="label-elem" style={{color:'#b90'}}>S</span>,  label: 'Sulfur' },
    ]
  },
  {
    tools: [
      { id: 'TEXT', icon: <TextTool />, label: 'Text' },
    ]
  },
];



export function Toolbar() {
  const { activeTool, setActiveTool, clear } = useGraphStore();
  const [showPT, setShowPT] = React.useState(false);

  return (
    <>
      <div className="tool-panel">
        {TOOL_GROUPS.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <div className="tool-panel__sep" />}
            <div className="tool-group">
              {group.tools.map((t) => (
                <button
                  key={t.id}
                  className={`tool-btn ${activeTool === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTool(t.id)}
                  title={t.label}
                >
                  {t.icon}
                </button>
              ))}
              {gi === 3 && (
                <button
                  className={`tool-btn ${activeTool.startsWith('ATOM_') && !['ATOM_C', 'ATOM_N', 'ATOM_O', 'ATOM_S'].includes(activeTool) ? 'active' : ''}`}
                  title="Periodic Table"
                  onClick={() => setShowPT(true)}
                >
                  <span className="label-elem" style={{ color: '#888', fontSize: '12px' }}>[PT]</span>
                </button>
              )}
            </div>
          </React.Fragment>
        ))}
        <div className="tool-panel__sep" />

        <button className="tool-btn" onClick={clear} title="Clear All" style={{ color: '#ef4444' }}>
          <SvgIcon>
            <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </SvgIcon>
        </button>
      </div>
      {showPT && (
        <PeriodicTable
          onSelect={(sym: string) => setActiveTool(`ATOM_${sym}` as any)}
          onClose={() => setShowPT(false)}
        />
      )}
    </>
  );
}
