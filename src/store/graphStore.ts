import { create } from 'zustand';

export type AtomId = string;
export type BondId = string;

export interface Atom {
  id: AtomId;
  x: number;
  y: number;
  element: string;
  charge?: number;  // -3..+3
}

export type BondType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'WEDGE' | 'HASH';

export interface Bond {
  id: BondId;
  source: AtomId;
  target: AtomId;
  type: BondType;
}

export type ImageId = string;
export interface EmbeddedImage {
  id: ImageId;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ToolType =
  | 'SELECT' | 'PAN'
  | 'BOND_SINGLE' | 'BOND_DOUBLE' | 'BOND_TRIPLE' | 'BOND_WEDGE' | 'BOND_HASH'
  | 'RING_BENZENE' | 'RING_CYCLOHEXANE' | 'RING_CYCLOPENTANE' | 'RING_CYCLOBUTANE' | 'RING_CYCLOPROPANE'
  | `ATOM_${string}`
  | 'TEXT' | 'ERASER';

export interface MolGraph {
  atoms: Record<AtomId, Atom>;
  bonds: Record<BondId, Bond>;
  images: Record<ImageId, EmbeddedImage>;
  stereoLabels: { id: string, type: 'atom' | 'bond', targetId: string, text: string, x: number, y: number }[];
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

const HISTORY_LIMIT = 100;

interface GraphState extends MolGraph {
  // UI / tool
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;

  // Hover
  hoveredAtom: AtomId | null;
  setHoveredAtom: (id: AtomId | null) => void;
  hoveredBond: BondId | null;
  setHoveredBond: (id: BondId | null) => void;

  // Selection
  selectedAtoms: Set<AtomId>;
  setSelectedAtoms: (ids: Set<AtomId>) => void;

  // Viewport (zoom/pan)
  zoom: number;
  panX: number;
  panY: number;
  setViewport: (zoom: number, panX: number, panY: number) => void;

  // Undo/Redo history
  past: MolGraph[];
  future: MolGraph[];
  undo: () => void;
  redo: () => void;
  snapshot: () => void; // call BEFORE any mutating action
  loadGraph: (atoms: Record<AtomId, Atom>, bonds: Record<BondId, Bond>, images?: Record<ImageId, EmbeddedImage>) => void;

  // Graph mutations
  addAtom: (x: number, y: number, element?: string) => AtomId;
  addBond: (source: AtomId, target: AtomId, type?: BondType) => BondId;
  moveAtom: (id: AtomId, x: number, y: number) => void;
  moveAtoms: (ids: AtomId[], dx: number, dy: number) => void;
  setAtomElement: (id: AtomId, element: string) => void;
  setBondType: (id: BondId, type: BondType) => void;
  removeAtom: (id: AtomId) => void;
  removeBond: (id: BondId) => void;
  addImage: (src: string, x: number, y: number, width: number, height: number) => ImageId;
  removeImage: (id: ImageId) => void;
  moveImage: (id: ImageId, dx: number, dy: number) => void;
  clear: () => void;
  setStereoLabels: (labels: any[]) => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  atoms: {},
  bonds: {},
  images: {},
  stereoLabels: [],

  activeTool: 'BOND_SINGLE',
  setActiveTool: (tool) => set({ activeTool: tool }),

  hoveredAtom: null,
  setHoveredAtom: (id) => set({ hoveredAtom: id }),
  hoveredBond: null,
  setHoveredBond: (id) => set({ hoveredBond: id }),

  selectedAtoms: new Set(),
  setSelectedAtoms: (ids) => set({ selectedAtoms: ids }),

  zoom: 1,
  panX: 0,
  panY: 0,
  setViewport: (zoom, panX, panY) => set({ zoom, panX, panY }),

  past: [],
  future: [],

  snapshot: () => {
    set((state) => {
      const g = { atoms: state.atoms, bonds: state.bonds, images: state.images };
      return {
        past: [...state.past.slice(-HISTORY_LIMIT), g],
        future: []
      };
    });
  },

  undo: () => {
    const state = get();
    const { past, atoms, bonds, images } = state;
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [{ atoms, bonds, images }, ...state.future],
      atoms: prev.atoms,
      bonds: prev.bonds,
      images: prev.images || {}
    });
  },

  redo: () => {
    const state = get();
    const { past, future, atoms, bonds, images } = state;
    if (future.length === 0) return;
    const next = future[0];
    set({
      past: [...past, { atoms, bonds, images }],
      future: future.slice(1),
      atoms: next.atoms,
      bonds: next.bonds,
      images: next.images || {}
    });
  },

  loadGraph: (atoms, bonds, images = {}) => set({ atoms, bonds, images, stereoLabels: [] }),

  setStereoLabels: (labels) => set({ stereoLabels: labels }),

  addAtom: (x, y, element = 'C') => {
    const id = generateId();
    set((s) => ({ atoms: { ...s.atoms, [id]: { id, x, y, element } }, stereoLabels: [] }));
    return id;
  },

  addBond: (source, target, type = 'SINGLE') => {
    if (source === target) return '';
    const { bonds } = get();
    const existing = Object.values(bonds).find(
      b => (b.source === source && b.target === target) || (b.source === target && b.target === source)
    );
    if (existing) {
      set(state => ({ stereoLabels: [] })); // still clear labels just in case
      return existing.id;
    }
    const id = generateId();
    set(state => ({
      bonds: { ...state.bonds, [id]: { id, source, target, type } },
      stereoLabels: [],
    }));
    return id;
  },

  moveAtom: (id, x, y) => set(state => ({
    atoms: { ...state.atoms, [id]: { ...state.atoms[id], x, y } },
    stereoLabels: [],
  })),

  moveAtoms: (ids, dx, dy) => set(state => {
    const newAtoms = { ...state.atoms };
    ids.forEach(id => {
      if (newAtoms[id]) {
        newAtoms[id] = { ...newAtoms[id], x: newAtoms[id].x + dx, y: newAtoms[id].y + dy };
      }
    });
    return { atoms: newAtoms, stereoLabels: [] };
  }),

  setAtomElement: (id, element) => set(state => ({
    atoms: { ...state.atoms, [id]: { ...state.atoms[id], element } },
    stereoLabels: [],
  })),

  setBondType: (id, type) => set(state => ({
    bonds: { ...state.bonds, [id]: { ...state.bonds[id], type } },
    stereoLabels: [],
  })),

  removeAtom: (id) => set(state => {
    const { [id]: removedAtom, ...newAtoms } = state.atoms;
    const newBonds = { ...state.bonds };
    for (const bId in newBonds) {
      if (newBonds[bId].source === id || newBonds[bId].target === id) {
        delete newBonds[bId];
      }
    }
    const newSel = new Set(state.selectedAtoms);
    newSel.delete(id);
    return { atoms: newAtoms, bonds: newBonds, selectedAtoms: newSel, stereoLabels: [] };
  }),

  removeBond: (id) => set(state => {
    const { [id]: removedBond, ...newBonds } = state.bonds;
    return { bonds: newBonds, stereoLabels: [] };
  }),

  addImage: (src, x, y, width, height) => {
    const id = 'img_' + generateId();
    set((state) => ({ images: { ...state.images, [id]: { id, src, x, y, width, height } } }));
    return id;
  },

  removeImage: (id) => {
    set((state) => {
      const next = { ...state.images };
      delete next[id];
      return { images: next };
    });
  },

  moveImage: (id, dx, dy) => {
    set((state) => {
      const img = state.images[id];
      if (!img) return state;
      return {
        images: {
          ...state.images,
          [id]: { ...img, x: img.x + dx, y: img.y + dy }
        }
      };
    });
  },

  clear: () => {
    get().snapshot();
    set({ atoms: {}, bonds: {}, images: {}, selectedAtoms: new Set(), hoveredAtom: null, hoveredBond: null });
  },
}));
