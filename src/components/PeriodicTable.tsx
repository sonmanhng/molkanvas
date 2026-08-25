

const ELEMENTS = [
  { sym: 'H', num: 1, row: 1, col: 1, color: '#ffaaaa' },
  { sym: 'He', num: 2, row: 1, col: 18, color: '#aaffff' },
  { sym: 'Li', num: 3, row: 2, col: 1, color: '#ffaaaa' },
  { sym: 'Be', num: 4, row: 2, col: 2, color: '#ffaaaa' },
  { sym: 'B', num: 5, row: 2, col: 13, color: '#ffccaa' },
  { sym: 'C', num: 6, row: 2, col: 14, color: '#aaffaa' },
  { sym: 'N', num: 7, row: 2, col: 15, color: '#aaffaa' },
  { sym: 'O', num: 8, row: 2, col: 16, color: '#aaffaa' },
  { sym: 'F', num: 9, row: 2, col: 17, color: '#ffffaa' },
  { sym: 'Ne', num: 10, row: 2, col: 18, color: '#aaffff' },
  { sym: 'Na', num: 11, row: 3, col: 1, color: '#ffaaaa' },
  { sym: 'Mg', num: 12, row: 3, col: 2, color: '#ffaaaa' },
  { sym: 'Al', num: 13, row: 3, col: 13, color: '#cccccc' },
  { sym: 'Si', num: 14, row: 3, col: 14, color: '#ffccaa' },
  { sym: 'P', num: 15, row: 3, col: 15, color: '#aaffaa' },
  { sym: 'S', num: 16, row: 3, col: 16, color: '#aaffaa' },
  { sym: 'Cl', num: 17, row: 3, col: 17, color: '#ffffaa' },
  { sym: 'Ar', num: 18, row: 3, col: 18, color: '#aaffff' },
  { sym: 'K', num: 19, row: 4, col: 1, color: '#ffaaaa' },
  { sym: 'Ca', num: 20, row: 4, col: 2, color: '#ffaaaa' },
  { sym: 'Sc', num: 21, row: 4, col: 3, color: '#ffccff' },
  { sym: 'Ti', num: 22, row: 4, col: 4, color: '#ffccff' },
  { sym: 'V', num: 23, row: 4, col: 5, color: '#ffccff' },
  { sym: 'Cr', num: 24, row: 4, col: 6, color: '#ffccff' },
  { sym: 'Mn', num: 25, row: 4, col: 7, color: '#ffccff' },
  { sym: 'Fe', num: 26, row: 4, col: 8, color: '#ffccff' },
  { sym: 'Co', num: 27, row: 4, col: 9, color: '#ffccff' },
  { sym: 'Ni', num: 28, row: 4, col: 10, color: '#ffccff' },
  { sym: 'Cu', num: 29, row: 4, col: 11, color: '#ffccff' },
  { sym: 'Zn', num: 30, row: 4, col: 12, color: '#ffccff' },
  { sym: 'Ga', num: 31, row: 4, col: 13, color: '#cccccc' },
  { sym: 'Ge', num: 32, row: 4, col: 14, color: '#ffccaa' },
  { sym: 'As', num: 33, row: 4, col: 15, color: '#ffccaa' },
  { sym: 'Se', num: 34, row: 4, col: 16, color: '#aaffaa' },
  { sym: 'Br', num: 35, row: 4, col: 17, color: '#ffffaa' },
  { sym: 'Kr', num: 36, row: 4, col: 18, color: '#aaffff' },
  // Just enough for organic chemistry and some metals. We can add more if needed.
  { sym: 'Rb', num: 37, row: 5, col: 1, color: '#ffaaaa' },
  { sym: 'Sr', num: 38, row: 5, col: 2, color: '#ffaaaa' },
  { sym: 'Y', num: 39, row: 5, col: 3, color: '#ffccff' },
  { sym: 'Zr', num: 40, row: 5, col: 4, color: '#ffccff' },
  { sym: 'Nb', num: 41, row: 5, col: 5, color: '#ffccff' },
  { sym: 'Mo', num: 42, row: 5, col: 6, color: '#ffccff' },
  { sym: 'Tc', num: 43, row: 5, col: 7, color: '#ffccff' },
  { sym: 'Ru', num: 44, row: 5, col: 8, color: '#ffccff' },
  { sym: 'Rh', num: 45, row: 5, col: 9, color: '#ffccff' },
  { sym: 'Pd', num: 46, row: 5, col: 10, color: '#ffccff' },
  { sym: 'Ag', num: 47, row: 5, col: 11, color: '#ffccff' },
  { sym: 'Cd', num: 48, row: 5, col: 12, color: '#ffccff' },
  { sym: 'In', num: 49, row: 5, col: 13, color: '#cccccc' },
  { sym: 'Sn', num: 50, row: 5, col: 14, color: '#cccccc' },
  { sym: 'Sb', num: 51, row: 5, col: 15, color: '#ffccaa' },
  { sym: 'Te', num: 52, row: 5, col: 16, color: '#ffccaa' },
  { sym: 'I', num: 53, row: 5, col: 17, color: '#ffffaa' },
  { sym: 'Xe', num: 54, row: 5, col: 18, color: '#aaffff' },
];

interface Props {
  onSelect: (element: string) => void;
  onClose: () => void;
}

export function PeriodicTable({ onSelect, onClose }: Props) {
  return (
    <div className="periodic-modal-backdrop" onClick={onClose}>
      <div className="periodic-modal-content" onClick={e => e.stopPropagation()}>
        <div className="periodic-header">
          <h3>Periodic Table</h3>
          <button onClick={onClose}>&times;</button>
        </div>
        <div className="periodic-grid">
          {ELEMENTS.map(el => (
            <div
              key={el.sym}
              className="periodic-cell"
              style={{ gridRow: el.row, gridColumn: el.col, backgroundColor: el.color }}
              onClick={() => { onSelect(el.sym); onClose(); }}
            >
              <div className="periodic-num">{el.num}</div>
              <div className="periodic-sym">{el.sym}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
