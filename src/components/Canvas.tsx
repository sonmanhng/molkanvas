import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useGraphStore } from '../store/graphStore';
import type { AtomId, BondType } from '../store/graphStore';

// Style helpers
export function getStyle() {
  const style = useGraphStore.getState().documentStyle;
  if (style === 'ACS_1996') {
    // Scale factor 2.5 to map physical pt to readable CSS pixels while keeping EXACT ACS 1996 proportions
    const S = 2.5;
    return {
      BOND_LENGTH: 14.4 * S,
      ATOM_HIT_R: 12,
      DBL_OFFSET: 14.4 * S * 0.18, // 18% of length
      FONT_SIZE: 10 * S,
      FONT_WEIGHT: 'normal',
      BOND_WIDTH: 0.6 * S,
      BOLD_WIDTH: 2.0 * S,
      HASH_SPACING: 2.5 * S,
      FONT_FAMILY: 'Arial, Helvetica, sans-serif'
    };
  }
  return {
    BOND_LENGTH: 50,
    ATOM_HIT_R: 14,
    DBL_OFFSET: 4,
    FONT_SIZE: 16,
    FONT_WEIGHT: 'bold',
    BOND_WIDTH: 1.5,
    BOLD_WIDTH: 6.0,
    HASH_SPACING: 6.0,
    FONT_FAMILY: 'sans-serif'
  };
}

const ELEMENT_COLORS: Record<string, string> = {
  C: '#1a1a1a', H: '#555', O: '#cc4400', N: '#0044cc',
  S: '#aa8800', P: '#cc6600', F: '#007700', Cl: '#007700',
  Br: '#993300', I: '#660099',
};

// Implicit hydrogen count for standard valence
const IMPLICIT_H: Record<string, number> = {
  C: 4, N: 3, O: 2, S: 2, P: 3, F: 1, Cl: 1, Br: 1, I: 1,
};

const MAX_VALENCE: Record<string, number[]> = {
  C: [4], N: [3, 4], O: [2], S: [2, 4, 6], P: [3, 5],
  F: [1], Cl: [1, 3, 5, 7], Br: [1, 3, 5, 7], I: [1, 3, 5, 7], H: [1]
};

// Estimate the radius of an atom's visual label (for bond clipping)
function getAtomRadius(element: string, hCount: number): number {
  if (element === 'C') return 0; // C is invisible, bond goes to center
  const chars = element.length + (hCount > 0 ? 1 + (hCount > 1 ? 1 : 0) : 0);
  const { FONT_SIZE } = getStyle();
  const S = 2.5;
  // Exact margin calc based on 1.6pt margin scaled
  return chars * (FONT_SIZE * 0.28) + (1.6 * S); 
}

// Clip a bond endpoint to stop at atom boundary
function clipEndpoint(
  fromX: number, fromY: number,
  toX: number, toY: number,
  radius: number
): { x: number; y: number } {
  const dx = toX - fromX, dy = toY - fromY;
  const len = Math.hypot(dx, dy);
  if (len < 1) return { x: toX, y: toY };
  const clip = Math.min(radius, len * 0.45);
  return { x: toX - (dx / len) * clip, y: toY - (dy / len) * clip };
}

function snapAngle(sx: number, sy: number, ex: number, ey: number) {
  const { BOND_LENGTH } = getStyle();
  const angle = Math.round(Math.atan2(ey - sy, ex - sx) / (Math.PI / 6)) * (Math.PI / 6);
  return { x: sx + Math.cos(angle) * BOND_LENGTH, y: sy + Math.sin(angle) * BOND_LENGTH };
}

// Pick best outgoing angle from atom: furthest from all existing bonds, snapped to 30°
function getBestAngle(atomId: AtomId, atoms: Record<string, any>, bonds: Record<string, any>): number {
  const atom = atoms[atomId];
  const neighbors = Object.values(bonds as Record<string, any>).filter(
    (b: any) => b.source === atomId || b.target === atomId
  );
  const existingAngles = neighbors.map((b: any) => {
    const other = b.source === atomId ? atoms[b.target] : atoms[b.source];
    if (!other) return 0;
    return Math.atan2(other.y - atom.y, other.x - atom.x);
  });

  if (existingAngles.length === 0) return -Math.PI / 6; // default 30° below horizontal

  // Try all 12 multiples of 30° and pick one with max min-distance to existing angles
  let bestAngle = -Math.PI / 6;
  let bestScore = -1;
  for (let i = 0; i < 12; i++) {
    const candidate = (i * Math.PI) / 6;
    const minDist = Math.min(...existingAngles.map(ea => {
      let d = Math.abs(candidate - ea) % (2 * Math.PI);
      if (d > Math.PI) d = 2 * Math.PI - d;
      return d;
    }));
    if (minDist > bestScore) {
      bestScore = minDist;
      bestAngle = candidate;
    }
  }
  return bestAngle;
}

function ringCoords(cx: number, cy: number, n: number) {
  const { BOND_LENGTH } = getStyle();
  const r = BOND_LENGTH / (2 * Math.sin(Math.PI / n));
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
}

function parallelLine(x1: number, y1: number, x2: number, y2: number, offset: number, shorten = 0.15) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len * offset, ny = dx / len * offset;
  return {
    x1: x1 + dx * shorten + nx, y1: y1 + dy * shorten + ny,
    x2: x2 - dx * shorten + nx, y2: y2 - dy * shorten + ny,
  };
}

// Wedge (filled triangle)// Standalone implicit-H calculator (for use inside renderBond without hooks)
function getImplicitHFor(atomId: string, atoms: Record<string, any>, bonds: Record<string, any>): number {
  const a = atoms[atomId];
  if (!a || a.element === 'C') return 0;
  const maxH = IMPLICIT_H[a.element] ?? 0;
  const bonded = Object.values(bonds as Record<string, any>).filter(
    (b: any) => b.source === atomId || b.target === atomId
  ).reduce((acc: number, b: any) => acc + (b.type === 'DOUBLE' ? 2 : b.type === 'TRIPLE' ? 3 : 1), 0);
  return Math.max(0, maxH - bonded);
}

function WedgeBond({ x1, y1, x2, y2, color }: { x1:number; y1:number; x2:number; y2:number; color:string }) {
  const { BOLD_WIDTH } = getStyle();
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len * (BOLD_WIDTH / 2), ny = dx / len * (BOLD_WIDTH / 2);
  return <polygon
    points={`${x1},${y1} ${x2 + nx},${y2 + ny} ${x2 - nx},${y2 - ny}`}
    fill={color} stroke="none" pointerEvents="none"
  />;
}

// Hash bond (series of thin lines)
function HashBond({ x1, y1, x2, y2, color }: { x1:number; y1:number; x2:number; y2:number; color:string }) {
  const { BOLD_WIDTH, HASH_SPACING, BOND_WIDTH } = getStyle();
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const lines = [];
  const N = Math.max(3, Math.floor(len / (HASH_SPACING * 0.7)));
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const cx = x1 + dx * t, cy = y1 + dy * t;
    const hw = (BOND_WIDTH / 2) + t * (BOLD_WIDTH / 2);
    lines.push(<line key={i} x1={cx - nx*hw} y1={cy - ny*hw} x2={cx + nx*hw} y2={cy + ny*hw}
      stroke={color} strokeWidth={BOND_WIDTH} strokeLinecap="round" />);
  }
  return <>{lines}</>;
}

export function Canvas() {
  const store = useGraphStore();
  const { BOND_LENGTH, BOND_WIDTH, DBL_OFFSET, FONT_SIZE, FONT_FAMILY, ATOM_HIT_R } = getStyle();
  const {
    atoms, bonds, images, stereoLabels, zoom, panX, panY, setViewport,
    addAtom, addBond, removeAtom, removeBond, removeImage, moveImage, snapshot,
    hoveredAtom, selectedAtoms, selectedImages, selectedBonds, setHoveredAtom, setHoveredBond, hoveredBond, setSelectedAtoms, setSelectedBonds, setSelectedImages, activeTool, setActiveTool, moveAtoms, updateSelectionTransforms
  } = store;

  const [drawing, setDrawingState] = useState<{ src: AtomId | '__pending__'; x: number; y: number, pendingX?: number, pendingY?: number } | null>(null);
  const drawingRef = useRef<typeof drawing>(null);
  const setDrawing = (v: typeof drawing) => { drawingRef.current = v; setDrawingState(v); };

  const [dragging, setDragging] = useState<{ ids: AtomId[]; lastX: number; lastY: number } | null>(null);
  const draggingRef = useRef<typeof dragging>(null);
  const setDraggingS = (v: typeof dragging) => { draggingRef.current = v; setDragging(v); };

  const [draggingImg, setDraggingImg] = useState<{ id: string; lastX: number; lastY: number } | null>(null);
  const draggingImgRef = useRef<typeof draggingImg>(null);
  const setDraggingImgS = (v: typeof draggingImg) => { draggingImgRef.current = v; setDraggingImg(v); };

  const [selBox, setSelBox] = useState<{ ox: number; oy: number; x: number; y: number } | null>(null);
  const selBoxRef = useRef<typeof selBox>(null);
  const setSelBoxS = (v: typeof selBox) => { selBoxRef.current = v; setSelBox(v); };

  const [scaling, setScaling] = useState<{
    initialDist: number;
    initialAngle: number;
    centroid: {x: number, y: number};
    atomsData: Record<string, {x: number, y: number}>;
    imagesData: Record<string, {x: number, y: number, width: number, height: number}>;
  } | null>(null);
  const scalingRef = useRef<typeof scaling>(null);
  const setScalingS = (v: typeof scaling) => { scalingRef.current = v; setScaling(v); };

  const [editingText, setEditingText] = useState<{ id?: AtomId; x: number; y: number; val: string } | null>(null);
  const editingTextCreatedAt = useRef(0);

  const [panning, setPanningState] = useState<{ lastX: number; lastY: number } | null>(null);
  const panningRef = useRef<typeof panning>(null);
  const panMovedRef = useRef<boolean>(false);
  const setPanning = (v: typeof panning) => { panningRef.current = v; setPanningState(v); };

  const svgRef = useRef<SVGSVGElement>(null);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (e.shiftKey) store.redo(); else store.undo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedAtoms.forEach(id => { snapshot(); removeAtom(id); });
        selectedImages.forEach(id => { snapshot(); removeImage(id); });
        setSelectedAtoms(new Set());
        setSelectedImages(new Set());
      }
      if (e.key === 'Escape') { setSelectedAtoms(new Set()); setSelectedImages(new Set()); }
      const toolKeys: Record<string, any> = {
        's': 'SELECT', 'p': 'PAN',
        'e': 'ERASER', 't': 'TEXT',
        'b': 'BOND_SINGLE', 'v': 'BOND_DOUBLE',
        'h': 'RING_CYCLOHEXANE', 'f': 'RING_BENZENE',
        'c': 'ATOM_C', 'n': 'ATOM_N', 'o': 'ATOM_O', 'x': 'ATOM_S'
      };
      const key = e.key.toLowerCase();
      if (toolKeys[key] && !e.ctrlKey && !e.metaKey) {
        setActiveTool(toolKeys[key]);
      };
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedAtoms, selectedImages, store, snapshot, removeAtom, removeImage, setSelectedAtoms, setSelectedImages, setActiveTool]);

  // ── Coord helpers ────────────────────────────────────────────────────────────
  const svgPt = useCallback((e: { clientX: number; clientY: number }) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    return { x: (e.clientX - ctm.e) / ctm.a, y: (e.clientY - ctm.f) / ctm.d };
  }, []);

  const svgToWorld = useCallback((sx: number, sy: number) => ({
    x: (sx - panX) / zoom,
    y: (sy - panY) / zoom,
  }), [zoom, panX, panY]);

  const getWorld = useCallback((e: React.PointerEvent) => {
    const s = svgPt(e);
    return svgToWorld(s.x, s.y);
  }, [svgPt, svgToWorld]);

  const findAtomAt = useCallback((wx: number, wy: number, exclude?: AtomId) => {
    for (const a of Object.values(useGraphStore.getState().atoms)) {
      if (a.id === exclude) continue;
      if (Math.hypot(a.x - wx, a.y - wy) < ATOM_HIT_R * 1.5) return a.id;
    }
    return null;
  }, [ATOM_HIT_R]);

  const placeRing = useCallback((cx: number, cy: number, n: number, isBenzene = false) => {
    snapshot();
    const state = useGraphStore.getState();
    const coords = ringCoords(cx, cy, n);
    const ids = coords.map(c => {
      const near = findAtomAt(c.x, c.y);
      return near || state.addAtom(c.x, c.y, 'C');
    });
    for (let i = 0; i < n; i++) {
      const type: BondType = (isBenzene && i % 2 === 1) ? 'DOUBLE' : 'SINGLE';
      state.addBond(ids[i], ids[(i + 1) % n], type);
    }
  }, [snapshot, findAtomAt]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const { x: sx, y: sy } = svgPt(e);
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(8, Math.max(0.1, zoom * delta));
    const newPanX = sx - (sx - panX) * (newZoom / zoom);
    const newPanY = sy - (sy - panY) * (newZoom / zoom);
    setViewport(newZoom, newPanX, newPanY);
  };

  const startPan = (e: React.PointerEvent) => {
    panMovedRef.current = false;
    setPanning({ lastX: e.clientX, lastY: e.clientY });
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onCanvasDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey) || activeTool === 'PAN') {
      startPan(e);
      return;
    }
    const { x, y } = getWorld(e);
    const hit = findAtomAt(x, y);

    if (activeTool === 'SELECT') {
      if (!hit) {
        setSelBoxS({ ox: x, oy: y, x, y });
        if (!e.shiftKey) { setSelectedAtoms(new Set()); setSelectedBonds(new Set()); }
      }
      return;
    }
    if (activeTool === 'TEXT') {
      e.preventDefault();
      editingTextCreatedAt.current = Date.now();
      if (hit) {
        const el = store.atoms[hit].element;
        setEditingText({ id: hit, x: store.atoms[hit].x, y: store.atoms[hit].y, val: el === 'C' ? '' : el });
      } else {
        setEditingText({ x, y, val: '' });
      }
      return;
    }
    if (activeTool.startsWith('BOND_')) {
      if (hit) {
        setDrawing({ src: hit, x, y });
      } else {
        setDrawing({ src: '__pending__', x, y, pendingX: x, pendingY: y });
      }
      return;
    }
    if (activeTool.startsWith('ATOM_')) {
      const el = activeTool.split('_').slice(1).join('');
      snapshot();
      if (hit) store.setAtomElement(hit, el);
      else addAtom(x, y, el);
      return;
    }
    if (activeTool.startsWith('RING_')) {
      const n = activeTool === 'RING_BENZENE' || activeTool === 'RING_CYCLOHEXANE' ? 6
        : activeTool === 'RING_CYCLOPENTANE' ? 5
        : activeTool === 'RING_CYCLOBUTANE' ? 4 : 3;
      const isBenz = activeTool === 'RING_BENZENE';
      placeRing(x, y, n, isBenz);
    }
  };

  const onAtomDown = (e: React.PointerEvent, id: AtomId) => {
    if (activeTool === 'PAN' || e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey)) { 
      startPan(e); 
      return; 
    }
    e.stopPropagation();
    const { x, y } = getWorld(e);

    if (activeTool === 'ERASER') { snapshot(); removeAtom(id); return; }
    if (activeTool === 'TEXT') {
      e.preventDefault();
      editingTextCreatedAt.current = Date.now();
      const el = store.atoms[id].element;
      setEditingText({ id, x: store.atoms[id].x, y: store.atoms[id].y, val: el === 'C' ? '' : el });
      return;
    }
    if (activeTool.startsWith('ATOM_')) {
      const el = activeTool.split('_').slice(1).join('');
      snapshot(); store.setAtomElement(id, el); return;
    }
    if (activeTool === 'SELECT') {
      const newSel = new Set(selectedAtoms);
      if (e.shiftKey) { newSel.has(id) ? newSel.delete(id) : newSel.add(id); }
      else if (!newSel.has(id)) { newSel.clear(); newSel.add(id); setSelectedBonds(new Set()); }
      setSelectedAtoms(newSel);
      snapshot();
      const dragIds = Array.from(newSel);
      setDraggingS({ ids: dragIds, lastX: x, lastY: y });
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      return;
    }
    const ringSizes: Record<string, number> = {
      RING_BENZENE: 6, RING_CYCLOHEXANE: 6, RING_CYCLOPENTANE: 5,
      RING_CYCLOBUTANE: 4, RING_CYCLOPROPANE: 3,
    };
    if (ringSizes[activeTool]) {
      const n = ringSizes[activeTool];
      const isBenzene = activeTool === 'RING_BENZENE';
      snapshot();
      const st = useGraphStore.getState();
      const atom = st.atoms[id];
      if (!atom) return;
      const angle = getBestAngle(id, st.atoms, st.bonds);
      const R = BOND_LENGTH / (2 * Math.sin(Math.PI / n));
      const cx = atom.x + Math.cos(angle) * R;
      const cy = atom.y + Math.sin(angle) * R;
      const startAngle = angle + Math.PI;
      const ids: AtomId[] = [];
      for (let i = 0; i < n; i++) {
        const a = startAngle + (2 * Math.PI * i) / n;
        const vx = cx + R * Math.cos(a);
        const vy = cy + R * Math.sin(a);
        const near = findAtomAt(vx, vy);
        if (i === 0) ids.push(id);
        else ids.push(near || st.addAtom(vx, vy, 'C'));
      }
      for (let i = 0; i < n; i++) {
        const bt: BondType = (isBenzene && i % 2 === 1) ? 'DOUBLE' : 'SINGLE';
        st.addBond(ids[i], ids[(i + 1) % n], bt);
      }
      return;
    }
    if (activeTool.startsWith('BOND_')) {
      setDrawing({ src: id, x, y });
    }
  };

  const onBondDown = (e: React.PointerEvent, bondId: string) => {
    if (activeTool === 'PAN' || e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey)) { 
      startPan(e); 
      return; 
    }
    e.stopPropagation();
    if (activeTool === 'ERASER') { snapshot(); removeBond(bondId); return; }

    if (activeTool === 'SELECT') {
      const s = new Set(e.shiftKey ? selectedBonds : []);
      if (s.has(bondId)) s.delete(bondId);
      else s.add(bondId);
      if (!e.shiftKey) { setSelectedAtoms(new Set()); }
      setSelectedBonds(s);
      return;
    }

    const ringSizes: Record<string, number> = {
      RING_BENZENE: 6, RING_CYCLOHEXANE: 6, RING_CYCLOPENTANE: 5,
      RING_CYCLOBUTANE: 4, RING_CYCLOPROPANE: 3,
    };
    const n = ringSizes[activeTool];
    if (!n) return;

    const st = useGraphStore.getState();
    const bond = st.bonds[bondId];
    if (!bond) return;
    const atomA = st.atoms[bond.source];
    const atomB = st.atoms[bond.target];
    if (!atomA || !atomB) return;

    snapshot();
    fuseRingToBond(atomA.id, atomB.id, n, activeTool === 'RING_BENZENE');
  };

  const fuseRingToBond = (atomAId: AtomId, atomBId: AtomId, n: number, isBenzene: boolean) => {
    const st = useGraphStore.getState();
    const atomA = st.atoms[atomAId], atomB = st.atoms[atomBId];
    if (!atomA || !atomB) return;

    const L = Math.hypot(atomB.x - atomA.x, atomB.y - atomA.y) || BOND_LENGTH;
    const mx = (atomA.x + atomB.x) / 2, my = (atomA.y + atomB.y) / 2;
    const ux = (atomB.x - atomA.x) / L, uy = (atomB.y - atomA.y) / L;
    const px = -uy, py = ux;

    const distToCenter = L / (2 * Math.tan(Math.PI / n));

    const c1 = { x: mx + px * distToCenter, y: my + py * distToCenter };
    const c2 = { x: mx - px * distToCenter, y: my - py * distToCenter };
    const atomCount = (c: {x:number;y:number}) =>
      Object.values(st.atoms).filter(a => Math.hypot(a.x - c.x, a.y - c.y) < L * 1.1).length;
    const center = atomCount(c1) <= atomCount(c2) ? c1 : c2;

    const R = L / (2 * Math.sin(Math.PI / n));
    const angleA = Math.atan2(atomA.y - center.y, atomA.x - center.x);

    const stepCW  = -2 * Math.PI / n;
    const stepCCW =  2 * Math.PI / n;
    const bViaCW  = { x: center.x + R * Math.cos(angleA + stepCW),  y: center.y + R * Math.sin(angleA + stepCW) };
    const bViaCCW = { x: center.x + R * Math.cos(angleA + stepCCW), y: center.y + R * Math.sin(angleA + stepCCW) };
    const dCW  = Math.hypot(bViaCW.x  - atomB.x, bViaCW.y  - atomB.y);
    const dCCW = Math.hypot(bViaCCW.x - atomB.x, bViaCCW.y - atomB.y);
    const step = dCW < dCCW ? stepCCW : stepCW;

    const ids: AtomId[] = [atomAId];
    for (let i = 1; i < n - 1; i++) {
      const angle = angleA + step * i;
      const vx = center.x + R * Math.cos(angle);
      const vy = center.y + R * Math.sin(angle);
      const near = findAtomAt(vx, vy);
      ids.push(near || st.addAtom(vx, vy, 'C'));
    }
    ids.push(atomBId);

    for (let i = 0; i < ids.length - 1; i++) {
    const bt: BondType = (isBenzene && i % 2 === 0) ? 'DOUBLE' : 'SINGLE';
      st.addBond(ids[i], ids[i + 1], bt);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const { x, y } = svgToWorld(svgPt(e).x, svgPt(e).y);

    if (scalingRef.current) {
      const s = scalingRef.current;
      const currentDist = Math.hypot(x - s.centroid.x, y - s.centroid.y) || 1;
      const currentAngle = Math.atan2(y - s.centroid.y, x - s.centroid.x);
      const scale = Math.max(0.1, currentDist / s.initialDist);
      const rotate = currentAngle - s.initialAngle; // Currently ignoring rotation, just scale

      const nextAtoms: Record<string, {x:number, y:number}> = {};
      const nextImages: Record<string, {x:number, y:number, width:number, height:number}> = {};

      for (const [id, pos] of Object.entries(s.atomsData)) {
        nextAtoms[id] = {
          x: s.centroid.x + (pos.x - s.centroid.x) * scale,
          y: s.centroid.y + (pos.y - s.centroid.y) * scale
        };
      }
      for (const [id, rect] of Object.entries(s.imagesData)) {
        nextImages[id] = {
          x: s.centroid.x + (rect.x - s.centroid.x) * scale,
          y: s.centroid.y + (rect.y - s.centroid.y) * scale,
          width: rect.width * scale,
          height: rect.height * scale
        };
      }
      updateSelectionTransforms(nextAtoms, nextImages);
      return;
    }

    if (panningRef.current) {
      const dx = e.clientX - panningRef.current.lastX;
      const dy = e.clientY - panningRef.current.lastY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) panMovedRef.current = true;
      setViewport(zoom, panX + dx, panY + dy);
      setPanning({ lastX: e.clientX, lastY: e.clientY });
      return;
    }
    if (draggingImgRef.current) {
      const d = draggingImgRef.current;
      moveImage(d.id, x - d.lastX, y - d.lastY);
      setDraggingImgS({ ...d, lastX: x, lastY: y });
      return;
    }
    if (draggingRef.current) {
      const d = draggingRef.current;
      moveAtoms(d.ids, x - d.lastX, y - d.lastY);
      setDraggingS({ ...d, lastX: x, lastY: y });
      return;
    }
    if (selBoxRef.current) {
      const sb = selBoxRef.current;
      setSelBoxS({ ...sb, x, y });
      const minX = Math.min(sb.ox, x), maxX = Math.max(sb.ox, x);
      const minY = Math.min(sb.oy, y), maxY = Math.max(sb.oy, y);
      const selAtoms = new Set<AtomId>(
        Object.values(atoms).filter(a => a.x >= minX && a.x <= maxX && a.y >= minY && a.y <= maxY).map(a => a.id)
      );
      const selImgs = new Set<string>(
        Object.values(images).filter(img => img.x + img.width/2 >= minX && img.x + img.width/2 <= maxX && img.y + img.height/2 >= minY && img.y + img.height/2 <= maxY).map(img => img.id)
      );
      setSelectedAtoms(selAtoms);
      setSelectedImages(selImgs);
      return;
    }
    if (drawingRef.current) {
      const d = drawingRef.current;
      if (d.src === '__pending__') {
        setDrawing({ ...d, x, y });
        return;
      }
      const src = useGraphStore.getState().atoms[d.src as AtomId];
      if (!src) return;
      const hov = findAtomAt(x, y, d.src as AtomId);
      if (hov) {
        const a = useGraphStore.getState().atoms[hov];
        setDrawing({ ...d, x: a.x, y: a.y });
      } else {
        const s = snapAngle(src.x, src.y, x, y);
        setDrawing({ ...d, x: s.x, y: s.y });
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    if (scalingRef.current) { setScalingS(null); return; }
    if (draggingRef.current) { setDraggingS(null); return; }
    if (draggingImgRef.current) { setDraggingImgS(null); return; }
    if (selBoxRef.current) { setSelBoxS(null); return; }
    if (panningRef.current) { setPanning(null); return; }

    const d = drawingRef.current;
    if (d) {
      const { x, y } = getWorld(e);
      let srcId = d.src;
      if (srcId === '__pending__') {
        const dist = Math.hypot(x - d.pendingX!, y - d.pendingY!);
        if (dist < 15) {
          snapshot();
          const newSrc = addAtom(d.pendingX!, d.pendingY!, 'C');
          const state2 = useGraphStore.getState();
          const angle = getBestAngle(newSrc, state2.atoms, state2.bonds);
          const ex = d.pendingX! + Math.cos(angle) * BOND_LENGTH;
          const ey = d.pendingY! + Math.sin(angle) * BOND_LENGTH;
          const existingAt = findAtomAt(ex, ey, newSrc);
          const tgt2 = existingAt || addAtom(ex, ey, 'C');
          const bt2: BondType = activeTool === 'BOND_DOUBLE' ? 'DOUBLE' : activeTool === 'BOND_TRIPLE' ? 'TRIPLE' : activeTool === 'BOND_WEDGE' ? 'WEDGE' : activeTool === 'BOND_HASH' ? 'HASH' : 'SINGLE';
          addBond(newSrc, tgt2, bt2);
          setDrawing(null);
          return;
        }
        snapshot();
        srcId = addAtom(d.pendingX!, d.pendingY!, 'C');
      }

      const src = useGraphStore.getState().atoms[srcId as AtomId];
      if (src) {
        let tgt = findAtomAt(x, y, srcId as AtomId);
        const dist = Math.hypot(d.x - src.x, d.y - src.y);
        if (!tgt && dist < 15) {
          const state = useGraphStore.getState();
          const angle = getBestAngle(srcId as AtomId, state.atoms, state.bonds);
          const ex = src.x + Math.cos(angle) * BOND_LENGTH;
          const ey = src.y + Math.sin(angle) * BOND_LENGTH;
          const existingAt = findAtomAt(ex, ey, srcId as AtomId);
          tgt = existingAt || addAtom(ex, ey, 'C');
        } else if (!tgt) {
          tgt = addAtom(d.x, d.y, 'C');
        }
        if (tgt && tgt !== srcId) {
          snapshot();
          const bt: BondType =
            activeTool === 'BOND_DOUBLE' ? 'DOUBLE' :
            activeTool === 'BOND_TRIPLE' ? 'TRIPLE' :
            activeTool === 'BOND_WEDGE' ? 'WEDGE' :
            activeTool === 'BOND_HASH' ? 'HASH' : 'SINGLE';
          addBond(srcId as AtomId, tgt, bt);
        }
      }
      setDrawing(null);
    }
  };

  const onContextMenu = (e: React.MouseEvent) => e.preventDefault();

  const getImplicitH = useCallback((atomId: AtomId) => {
    const a = atoms[atomId];
    if (!a || a.element === 'C') return 0;
    const maxH = IMPLICIT_H[a.element] ?? 0;
    const bonded = Object.values(bonds).filter(b => b.source === atomId || b.target === atomId)
      .reduce((acc, b) => acc + (b.type === 'DOUBLE' ? 2 : b.type === 'TRIPLE' ? 3 : 1), 0);
    return Math.max(0, maxH - bonded);
  }, [atoms, bonds]);

  const hasValenceError = useCallback((atomId: AtomId) => {
    const a = atoms[atomId];
    if (!a) return false;
    const allowed = MAX_VALENCE[a.element];
    if (!allowed) return false;
    
    const bonded = Object.values(bonds).filter(b => b.source === atomId || b.target === atomId)
      .reduce((acc, b) => acc + (b.type === 'DOUBLE' ? 2 : b.type === 'TRIPLE' ? 3 : b.type === 'AROMATIC' ? 1.5 : 1), 0);
      
    const maxAllowed = Math.max(...allowed);
    return Math.ceil(bonded) > maxAllowed;
  }, [atoms, bonds]);

  const renderBond = (bond: typeof bonds[string]) => {
    const s = atoms[bond.source], t = atoms[bond.target];
    if (!s || !t) return null;
    const isHov = hoveredBond === bond.id;
    const isSel = selectedBonds.has(bond.id);
    const color = bond.color || (isHov ? '#c00' : '#1a1a1a');
    const sw = isHov ? BOND_WIDTH + 0.6 : BOND_WIDTH;

    const sHC = getImplicitHFor(bond.source, atoms, bonds);
    const tHC = getImplicitHFor(bond.target, atoms, bonds);
    const rS = getAtomRadius(s.element, sHC);
    const rT = getAtomRadius(t.element, tHC);
    const cs = clipEndpoint(t.x, t.y, s.x, s.y, rS);
    const ct = clipEndpoint(s.x, s.y, t.x, t.y, rT);
    const x1 = cs.x, y1 = cs.y, x2 = ct.x, y2 = ct.y;

    return (
      <g key={bond.id} data-bond-id={bond.id}
        onPointerEnter={() => setHoveredBond(bond.id)}
        onPointerLeave={() => setHoveredBond(null)}
        onPointerDown={(e) => onBondDown(e, bond.id)}
      >
        {isSel && (
          <line className="ui-element" x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#bfdbfe" strokeWidth={BOND_WIDTH + 8} strokeLinecap="round" pointerEvents="none" />
        )}
        <line className="ui-element" x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="transparent" strokeWidth="14" style={{ cursor: 'pointer' }} />
        {bond.type === 'WEDGE' && <WedgeBond x1={x1} y1={y1} x2={x2} y2={y2} color={color} />}
        {bond.type === 'HASH' && <HashBond x1={x1} y1={y1} x2={x2} y2={y2} color={color} />}
        {(bond.type === 'SINGLE' || bond.type === 'TRIPLE') && (
          <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={color} strokeWidth={sw} strokeLinecap="round" pointerEvents="none" />
        )}
        {bond.type === 'DOUBLE' && (() => {
          let ringPath: string[] | null = null;
          const queue: {id: string, path: string[]}[] = [{ id: bond.source, path: [bond.source] }];
          const visited = new Set<string>([bond.source]);
          while (queue.length > 0) {
            const curr = queue.shift()!;
            if (curr.id === bond.target && curr.path.length > 2) {
              ringPath = curr.path;
              break;
            }
            if (curr.path.length > 8) continue;
            Object.values(bonds).forEach(b => {
              if (b.id !== bond.id) {
                const nextId = b.source === curr.id ? b.target : (b.target === curr.id ? b.source : null);
                if (nextId && !visited.has(nextId)) {
                  visited.add(nextId);
                  queue.push({ id: nextId, path: [...curr.path, nextId] });
                }
              }
            });
            if (ringPath) break;
          }

          let offsetDir = 1;
          let isCentered = false;

          let degA = 0, degB = 0;
          Object.values(bonds).forEach(b => {
            if (b.source === bond.source || b.target === bond.source) degA++;
            if (b.source === bond.target || b.target === bond.target) degB++;
          });

          if (degA === 1 || degB === 1) {
            isCentered = true;
          } else if (ringPath) {
            let cx = 0, cy = 0;
            ringPath.forEach(id => { cx += atoms[id].x; cy += atoms[id].y; });
            cx /= ringPath.length; cy /= ringPath.length;
            const dx = x2 - x1, dy = y2 - y1;
            const nx = -dy, ny = dx;
            const dot = (cx - x1) * nx + (cy - y1) * ny;
            offsetDir = dot > 0 ? 1 : -1;
          } else {
            let cx = 0, cy = 0, count = 0;
            Object.values(bonds).forEach(b => {
              if (b.id !== bond.id) {
                if (b.source === bond.source || b.target === bond.source) {
                  const adj = b.source === bond.source ? b.target : b.source;
                  cx += atoms[adj].x; cy += atoms[adj].y; count++;
                }
                if (b.source === bond.target || b.target === bond.target) {
                  const adj = b.source === bond.target ? b.target : b.source;
                  cx += atoms[adj].x; cy += atoms[adj].y; count++;
                }
              }
            });
            if (count > 0) {
              cx /= count; cy /= count;
              const dx = x2 - x1, dy = y2 - y1;
              const nx = -dy, ny = dx;
              const dot = (cx - x1) * nx + (cy - y1) * ny;
              if (Math.abs(dot) < 5) isCentered = true;
              else offsetDir = dot > 0 ? 1 : -1;
            } else {
              isCentered = true;
            }
          }

          if (isCentered) {
            const p1 = parallelLine(x1, y1, x2, y2, DBL_OFFSET / 2, 0);
            const p2 = parallelLine(x1, y1, x2, y2, -DBL_OFFSET / 2, 0);
            return (
              <>
                <line x1={p1.x1} y1={p1.y1} x2={p1.x2} y2={p1.y2} stroke={color} strokeWidth={sw} strokeLinecap="round" pointerEvents="none" />
                <line x1={p2.x1} y1={p2.y1} x2={p2.x2} y2={p2.y2} stroke={color} strokeWidth={sw} strokeLinecap="round" pointerEvents="none" />
              </>
            );
          } else {
            // Trim by 11% at each end to perfectly fit a 120-degree internal ring angle
            const p = parallelLine(x1, y1, x2, y2, DBL_OFFSET * offsetDir, 0.11);
            return (
              <>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={sw} strokeLinecap="round" pointerEvents="none" />
                <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke={color} strokeWidth={sw} strokeLinecap="round" pointerEvents="none" />
              </>
            );
          }
        })()}
        {bond.type === 'TRIPLE' && (() => {
          const p1 = parallelLine(x1, y1, x2, y2, DBL_OFFSET + 1.5);
          const p2 = parallelLine(x1, y1, x2, y2, -(DBL_OFFSET + 1.5));
          return <>
            <line x1={p1.x1} y1={p1.y1} x2={p1.x2} y2={p1.y2} stroke={color} strokeWidth={sw} strokeLinecap="round" pointerEvents="none" />
            <line x1={p2.x1} y1={p2.y1} x2={p2.x2} y2={p2.y2} stroke={color} strokeWidth={sw} strokeLinecap="round" pointerEvents="none" />
          </>;
        })()}
      </g>
    );
  };

  const renderAtom = (atom: typeof atoms[string]) => {
    const isHov = hoveredAtom === atom.id;
    const isSel = selectedAtoms.has(atom.id);
    const isError = hasValenceError(atom.id);
    const showLabel = atom.element !== 'C' || isError;
    const color = isError ? '#ef4444' : (atom.color || (ELEMENT_COLORS[atom.element] ?? '#1a1a1a'));
    const hCount = getImplicitH(atom.id);

    return (
      <g key={atom.id} data-atom-id={atom.id}
        transform={`translate(${atom.x}, ${atom.y})`}
        onPointerEnter={() => setHoveredAtom(atom.id)}
        onPointerLeave={() => setHoveredAtom(null)}
        onPointerDown={(e) => onAtomDown(e, atom.id)}
        style={{ cursor: activeTool === 'PAN' ? 'grab' : activeTool === 'SELECT' ? 'grab' : activeTool === 'ERASER' ? 'pointer' : 'crosshair' }}
      >
        <circle className="ui-element" r={ATOM_HIT_R} fill="transparent" />
        {isSel && !isHov && (
          <circle className="ui-element" r={ATOM_HIT_R} fill="rgba(74, 144, 226, 0.2)" stroke="#4a90e2" strokeWidth={1} />
        )}
        {isHov && (
          <circle className="ui-element" r={ATOM_HIT_R + 4} fill="rgba(245, 158, 11, 0.35)" stroke="#f59e0b" strokeWidth={2} />
        )}
        {isError && (
          <circle className="ui-element" r={FONT_SIZE * 0.9} fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" />
        )}
        {showLabel && (
          <>
            <circle r={FONT_SIZE * 0.7} fill="white" />
            <text
              textAnchor="middle" dominantBaseline="central"
              fontSize={FONT_SIZE} fontWeight={getStyle().FONT_WEIGHT as any}
              fill={color}
              fontFamily={FONT_FAMILY}
              pointerEvents="none" letterSpacing="-0.3"
            >
              {atom.element}{hCount > 0 ? `H${hCount > 1 ? hCount : ''}` : ''}
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        id="molkanvas-svg"
        ref={svgRef} width="100%" height="100%"
        onPointerDown={onCanvasDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp} onWheel={onWheel} onContextMenu={onContextMenu}
        style={{ touchAction: 'none', display: 'block', cursor: activeTool === 'PAN' ? 'grab' : activeTool === 'SELECT' ? 'default' : 'crosshair' }}
      >
        <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
          {/* Images in background */}
          {Object.values(images).map(img => (
            <image
              key={img.id} data-image-id={img.id}
              href={img.src}
              x={img.x}
              y={img.y}
              width={img.width}
              height={img.height}
              onPointerDown={(e) => {
                if (activeTool === 'PAN' || e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey)) {
                  startPan(e); return;
                }
                e.stopPropagation();
                if (activeTool === 'ERASER') { snapshot(); removeImage(img.id); return; }
                if (activeTool === 'SELECT') {
                  const newSelImg = new Set(selectedImages);
                  if (e.shiftKey) { newSelImg.has(img.id) ? newSelImg.delete(img.id) : newSelImg.add(img.id); }
                  else if (!newSelImg.has(img.id)) { newSelImg.clear(); newSelImg.add(img.id); setSelectedAtoms(new Set()); setSelectedBonds(new Set()); }
                  setSelectedImages(newSelImg);
                  const { x, y } = getWorld(e);
                  snapshot();
                  setDraggingImgS({ id: img.id, lastX: x, lastY: y });
                  (e.currentTarget as Element).setPointerCapture(e.pointerId);
                }
              }}
              style={{ cursor: activeTool === 'ERASER' ? 'crosshair' : activeTool === 'SELECT' ? 'grab' : 'default' }}
            />
          ))}

          {/* Draw all bonds */}
          {Object.values(bonds).map(renderBond)}

          {/* Ghost bond */}
          {drawing && drawing.src !== '__pending__' && atoms[drawing.src] && (
            <line className="ui-element"
              x1={atoms[drawing.src].x} y1={atoms[drawing.src].y}
              x2={drawing.x} y2={drawing.y}
              stroke="#4a90d9" strokeWidth="1.5" strokeDasharray="5 3"
              pointerEvents="none"
            />
          )}
          {drawing && drawing.src === '__pending__' && (
            <line className="ui-element"
              x1={drawing.pendingX} y1={drawing.pendingY}
              x2={drawing.x} y2={drawing.y}
              stroke="#4a90d9" strokeWidth="1.5" strokeDasharray="5 3"
              pointerEvents="none"
            />
          )}

          {/* Selection box */}
          {selBox && (
            <rect className="ui-element"
              x={Math.min(selBox.ox, selBox.x)} y={Math.min(selBox.oy, selBox.y)}
              width={Math.abs(selBox.x - selBox.ox)} height={Math.abs(selBox.y - selBox.oy)}
              fill="rgba(74,144,217,0.08)" stroke="#4a90d9" strokeWidth={1 / zoom} strokeDasharray={`${4/zoom} ${2/zoom}`}
            />
          )}

          {/* Persistent Bounding Box & Resize Handles for current selection */}
          {(() => {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            let hasSel = false;
            
            selectedAtoms.forEach(id => {
              const a = atoms[id];
              if (a) {
                minX = Math.min(minX, a.x); minY = Math.min(minY, a.y);
                maxX = Math.max(maxX, a.x); maxY = Math.max(maxY, a.y);
                hasSel = true;
              }
            });
            selectedImages.forEach(id => {
              const img = images[id];
              if (img) {
                minX = Math.min(minX, img.x); minY = Math.min(minY, img.y);
                maxX = Math.max(maxX, img.x + img.width); maxY = Math.max(maxY, img.y + img.height);
                hasSel = true;
              }
            });

            if (hasSel && !selBox) {
              minX -= 20; minY -= 20; maxX += 20; maxY += 20;
              const w = maxX - minX, h = maxY - minY;
              const hr = 6 / zoom; // handle radius
              return (
                <g className="ui-element">
                  <rect x={minX} y={minY} width={w} height={h} fill="none" stroke="#4a90d9" strokeWidth={1 / zoom} strokeDasharray={`${4/zoom} ${4/zoom}`} pointerEvents="none" />
                  <circle cx={maxX} cy={maxY} r={hr} fill="white" stroke="#4a90d9" strokeWidth={1.5 / zoom} style={{ cursor: 'se-resize' }}
                    onPointerDown={(ev) => {
                      ev.stopPropagation();
                      snapshot();
                      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
                      const { x, y } = getWorld(ev);
                      const initialDist = Math.hypot(x - cx, y - cy) || 1;
                      const initialAngle = Math.atan2(y - cy, x - cx);
                      const atomsData: Record<string, {x:number, y:number}> = {};
                      const imagesData: Record<string, {x:number, y:number, width:number, height:number}> = {};
                      selectedAtoms.forEach(id => { if (atoms[id]) atomsData[id] = {x: atoms[id].x, y: atoms[id].y}; });
                      selectedImages.forEach(id => { if (images[id]) imagesData[id] = {x: images[id].x, y: images[id].y, width: images[id].width, height: images[id].height}; });
                      setScalingS({ initialDist, initialAngle, centroid: {x: cx, y: cy}, atomsData, imagesData });
                      (ev.currentTarget as Element).setPointerCapture(ev.pointerId);
                    }}
                  />
                </g>
              );
            }
            return null;
          })()}

          {Object.values(atoms).map(renderAtom)}

          {/* Stereo Labels */}
          {stereoLabels && stereoLabels.map(lbl => (
            <text
              key={lbl.id}
              x={lbl.x} y={lbl.y}
              fontSize={FONT_SIZE}
              fontFamily={FONT_FAMILY}
              fontWeight={getStyle().FONT_WEIGHT as any}
              fill="#e11d48"
              pointerEvents="none"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {lbl.text}
            </text>
          ))}
        </g>
      </svg>

      {editingText && (
        <div style={{
          position: 'absolute',
          left: editingText.x * zoom + panX - 50,
          top: editingText.y * zoom + panY - 15,
          width: 100,
          height: 30,
          zIndex: 100
        }}>
          <input
            autoFocus
            type="text"
            value={editingText.val}
            onChange={e => setEditingText({ ...editingText, val: e.target.value })}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const val = editingText.val.trim();
                if (val) {
                  snapshot();
                  if (editingText.id) store.setAtomElement(editingText.id, val);
                  else addAtom(editingText.x, editingText.y, val);
                }
                setEditingText(null);
                setActiveTool('SELECT');
              }
              if (e.key === 'Escape') setEditingText(null);
            }}
            onBlur={(e) => {
              if (Date.now() - editingTextCreatedAt.current < 200) {
                // Ignore immediate blur caused by browser focus stealing on mouseup
                setTimeout(() => e.target.focus(), 10);
                return;
              }
              const val = editingText.val.trim();
              if (val) {
                snapshot();
                if (editingText.id) store.setAtomElement(editingText.id, val);
                else addAtom(editingText.x, editingText.y, val);
              }
              setEditingText(null);
            }}
            style={{
              width: '100%',
              height: '100%',
              textAlign: 'center',
              border: '1.5px solid #2563eb',
              outline: 'none',
              borderRadius: 4,
              fontSize: '14px',
              fontFamily: 'sans-serif',
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          />
        </div>
      )}
    </div>
  );
}
