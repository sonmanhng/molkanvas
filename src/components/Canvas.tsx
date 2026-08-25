import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useGraphStore } from '../store/graphStore';
import type { AtomId, BondType } from '../store/graphStore';

export const BOND_LENGTH = 50;
const ATOM_HIT_R = 14;
const DBL_OFFSET = 3.5;
const FONT_SIZE = 12;
const BOND_WIDTH = 1.5;

const ELEMENT_COLORS: Record<string, string> = {
  C: '#1a1a1a', H: '#555', O: '#cc4400', N: '#0044cc',
  S: '#aa8800', P: '#cc6600', F: '#007700', Cl: '#007700',
  Br: '#993300', I: '#660099',
};

// Implicit hydrogen count for standard valence
const IMPLICIT_H: Record<string, number> = {
  C: 4, N: 3, O: 2, S: 2, P: 3, F: 1, Cl: 1, Br: 1, I: 1,
};

// Estimate the radius of an atom's visual label (for bond clipping)
function getAtomRadius(element: string, hCount: number): number {
  if (element === 'C') return 0; // C is invisible, bond goes to center
  const chars = element.length + (hCount > 0 ? 1 + (hCount > 1 ? 1 : 0) : 0);
  return Math.max(9, chars * 4.5);
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

function snapAngle(sx: number, sy: number, ex: number, ey: number, len = BOND_LENGTH) {
  const angle = Math.round(Math.atan2(ey - sy, ex - sx) / (Math.PI / 6)) * (Math.PI / 6);
  return { x: sx + Math.cos(angle) * len, y: sy + Math.sin(angle) * len };
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
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len * 3.5, ny = dx / len * 3.5;
  return <polygon
    points={`${x1},${y1} ${x2 + nx},${y2 + ny} ${x2 - nx},${y2 - ny}`}
    fill={color} stroke="none" pointerEvents="none"
  />;
}

// Hash bond (series of thin lines)
function HashBond({ x1, y1, x2, y2, color }: { x1:number; y1:number; x2:number; y2:number; color:string }) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const lines = [];
  const N = 6;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const cx = x1 + dx * t, cy = y1 + dy * t;
    const hw = 1 + t * 3.5;
    lines.push(<line key={i} x1={cx - nx*hw} y1={cy - ny*hw} x2={cx + nx*hw} y2={cy + ny*hw}
      stroke={color} strokeWidth="1.2" strokeLinecap="round" />);
  }
  return <>{lines}</>;
}

export function Canvas() {
  const store = useGraphStore();
  const {
    atoms, bonds, images, stereoLabels, activeTool, zoom, panX, panY, setViewport,
    addAtom, addBond, removeAtom, removeBond, removeImage, moveImage, snapshot,
    hoveredAtom, setHoveredAtom, hoveredBond, setHoveredBond,
    selectedAtoms, setSelectedAtoms, moveAtoms,
  } = store;

  const [drawing, setDrawingState] = useState<{ src: AtomId; x: number; y: number } | null>(null);
  // ref so pointerup always reads latest value (avoids stale closure on quick click)
  const drawingRef = useRef<{ src: AtomId; x: number; y: number } | null>(null);
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

  const [panning, setPanningState] = useState<{ lastX: number; lastY: number } | null>(null);
  const panningRef = useRef<typeof panning>(null);
  const panMovedRef = useRef<boolean>(false);
  const setPanning = (v: typeof panning) => { panningRef.current = v; setPanningState(v); };

  const svgRef = useRef<SVGSVGElement>(null);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (e.shiftKey) store.redo(); else store.undo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedAtoms.forEach(id => { snapshot(); removeAtom(id); });
        setSelectedAtoms(new Set());
      }
      if (e.key === 'Escape') { setSelectedAtoms(new Set()); }
      const toolKeys: Record<string, any> = {
        's': 'SELECT', 'b': 'BOND_SINGLE', 'd': 'BOND_DOUBLE', 'e': 'ERASER',
        '6': 'RING_CYCLOHEXANE', '5': 'RING_CYCLOPENTANE', 'z': undefined,
      };
      if (!e.metaKey && !e.ctrlKey && toolKeys[e.key]) store.setActiveTool(toolKeys[e.key]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedAtoms, store, snapshot, removeAtom, setSelectedAtoms]);

  // ── Coord helpers ────────────────────────────────────────────────────────────
  const svgPt = useCallback((e: { clientX: number; clientY: number }) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    return { x: (e.clientX - ctm.e) / ctm.a, y: (e.clientY - ctm.f) / ctm.d };
  }, []);

  // SVG → world (inverse of zoom+pan transform)
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
  }, []);

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

  // ── Zoom on scroll ───────────────────────────────────────────────────────────
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const { x: sx, y: sy } = svgPt(e);
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(8, Math.max(0.1, zoom * delta));
    // Keep the world point under cursor fixed
    const newPanX = sx - (sx - panX) * (newZoom / zoom);
    const newPanY = sy - (sy - panY) * (newZoom / zoom);
    setViewport(newZoom, newPanX, newPanY);
  };

  const startPan = (e: React.PointerEvent) => {
    panMovedRef.current = false;
    setPanning({ lastX: e.clientX, lastY: e.clientY });
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  // ── Pointer handlers ─────────────────────────────────────────────────────────
  const onCanvasDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey) || activeTool === 'PAN') {
      // Middle-click / Right-click / alt+click / PAN tool → pan
      startPan(e);
      return;
    }
    const { x, y } = getWorld(e);
    const hit = findAtomAt(x, y);

    if (activeTool === 'SELECT') {
      if (!hit) {
        setSelBoxS({ ox: x, oy: y, x, y });
        if (!e.shiftKey) setSelectedAtoms(new Set());
      }
      return;
    }
    if (activeTool.startsWith('BOND_')) {
      if (hit) {
        // Starting from an existing atom
        const src = hit;
        setDrawing({ src, x, y });
      } else {
        // Starting from empty space - store pending position, create atom on mouse up
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
    if (activeTool.startsWith('ATOM_')) {
      const el = activeTool.split('_').slice(1).join('');
      snapshot(); store.setAtomElement(id, el); return;
    }
    if (activeTool === 'SELECT') {
      const newSel = new Set(selectedAtoms);
      if (e.shiftKey) { newSel.has(id) ? newSel.delete(id) : newSel.add(id); }
      else if (!newSel.has(id)) { newSel.clear(); newSel.add(id); }
      setSelectedAtoms(newSel);
      snapshot();
      const dragIds = Array.from(newSel);
      setDraggingS({ ids: dragIds, lastX: x, lastY: y });
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      return;
    }
    // Ring tool on atom → anchor one vertex at this atom
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
      // Build ring: atom is at angle+π from center
      const startAngle = angle + Math.PI;
      const ids: AtomId[] = [];
      for (let i = 0; i < n; i++) {
        const a = startAngle + (2 * Math.PI * i) / n;
        const vx = cx + R * Math.cos(a);
        const vy = cy + R * Math.sin(a);
        const near = findAtomAt(vx, vy);
        if (i === 0) ids.push(id); // first vertex IS the clicked atom
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

  // ── Fuse a ring to bond (atomAId–atomBId as shared edge) ───────────────────
  const fuseRingToBond = (atomAId: AtomId, atomBId: AtomId, n: number, isBenzene: boolean) => {
    const st = useGraphStore.getState();
    const atomA = st.atoms[atomAId], atomB = st.atoms[atomBId];
    if (!atomA || !atomB) return;

    const L = Math.hypot(atomB.x - atomA.x, atomB.y - atomA.y) || BOND_LENGTH;
    const mx = (atomA.x + atomB.x) / 2, my = (atomA.y + atomB.y) / 2;
    const ux = (atomB.x - atomA.x) / L, uy = (atomB.y - atomA.y) / L; // unit along bond
    const px = -uy, py = ux; // perpendicular

    // Distance from midpoint of AB to ring center for regular n-gon with side L
    const distToCenter = L / (2 * Math.tan(Math.PI / n));

    // Two candidate centers — pick side with fewer atoms
    const c1 = { x: mx + px * distToCenter, y: my + py * distToCenter };
    const c2 = { x: mx - px * distToCenter, y: my - py * distToCenter };
    const atomCount = (c: {x:number;y:number}) =>
      Object.values(st.atoms).filter(a => Math.hypot(a.x - c.x, a.y - c.y) < L * 1.1).length;
    const center = atomCount(c1) <= atomCount(c2) ? c1 : c2;

    // Circumradius
    const R = L / (2 * Math.sin(Math.PI / n));
    const angleA = Math.atan2(atomA.y - center.y, atomA.x - center.x);

    // Which angular step goes from A AWAY from B (the long arc)?
    // B is adjacent to A: at angleA ± 2π/n. We pick the step that does NOT go to B in 1 step.
    const stepCW  = -2 * Math.PI / n; // clockwise step
    const stepCCW =  2 * Math.PI / n; // counter-clockwise step
    const bViaCW  = { x: center.x + R * Math.cos(angleA + stepCW),  y: center.y + R * Math.sin(angleA + stepCW) };
    const bViaCCW = { x: center.x + R * Math.cos(angleA + stepCCW), y: center.y + R * Math.sin(angleA + stepCCW) };
    const dCW  = Math.hypot(bViaCW.x  - atomB.x, bViaCW.y  - atomB.y);
    const dCCW = Math.hypot(bViaCCW.x - atomB.x, bViaCCW.y - atomB.y);
    // If going CW 1 step lands near B, then new atoms go CCW (and vice versa)
    const step = dCW < dCCW ? stepCCW : stepCW;

    // Build atom ids: [A, new_1, ..., new_(n-2), B]
    const ids: AtomId[] = [atomAId];
    for (let i = 1; i < n - 1; i++) {
      const angle = angleA + step * i;
      const vx = center.x + R * Math.cos(angle);
      const vy = center.y + R * Math.sin(angle);
      const near = findAtomAt(vx, vy);
      ids.push(near || st.addAtom(vx, vy, 'C'));
    }
    ids.push(atomBId);

    // Add bonds along the new arc (the shared A-B bond already exists)
    for (let i = 0; i < ids.length - 1; i++) {
      const bt: BondType = (isBenzene && i % 2 === 0) ? 'DOUBLE' : 'SINGLE';
      st.addBond(ids[i], ids[i + 1], bt);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (panningRef.current) {
      const dx = e.clientX - panningRef.current.lastX;
      const dy = e.clientY - panningRef.current.lastY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) panMovedRef.current = true;
      setViewport(zoom, panX + dx, panY + dy);
      setPanning({ lastX: e.clientX, lastY: e.clientY });
      return;
    }
    const { x, y } = getWorld(e);
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
      const sel = new Set<AtomId>(
        Object.values(atoms).filter(a => a.x >= minX && a.x <= maxX && a.y >= minY && a.y <= maxY).map(a => a.id)
      );
      setSelectedAtoms(sel);
      return;
    }
    if (drawingRef.current) {
      const d = drawingRef.current;
      if (d.src === '__pending__') {
        // Just update the cursor position for the preview line
        setDrawing({ ...d, x, y });
        return;
      }
      const src = useGraphStore.getState().atoms[d.src];
      if (!src) return;
      const hov = findAtomAt(x, y, d.src);
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
    if (draggingRef.current) { setDraggingS(null); return; }
    if (draggingImgRef.current) { setDraggingImgS(null); return; }
    if (selBoxRef.current) { setSelBoxS(null); return; }
    if (panningRef.current) { setPanning(null); return; }

    const d = drawingRef.current;
    if (d) {
      const { x, y } = getWorld(e);
      
      // Resolve the source atom (create it now if it was pending)
      let srcId = d.src;
      if (srcId === '__pending__') {
        const dist = Math.hypot(x - d.pendingX, y - d.pendingY);
        if (dist < 5) {
          // Pure click with no drag: place single atom with best-angle bond
          snapshot();
          const newSrc = addAtom(d.pendingX, d.pendingY, 'C');
          const state2 = useGraphStore.getState();
          const angle = getBestAngle(newSrc, state2.atoms, state2.bonds);
          const ex = d.pendingX + Math.cos(angle) * BOND_LENGTH;
          const ey = d.pendingY + Math.sin(angle) * BOND_LENGTH;
          const existingAt = findAtomAt(ex, ey, newSrc);
          const tgt2 = existingAt || addAtom(ex, ey, 'C');
          const bt2: BondType = activeTool === 'BOND_DOUBLE' ? 'DOUBLE' : activeTool === 'BOND_TRIPLE' ? 'TRIPLE' : activeTool === 'BOND_WEDGE' ? 'WEDGE' : activeTool === 'BOND_HASH' ? 'HASH' : 'SINGLE';
          addBond(newSrc, tgt2, bt2);
          setDrawing(null);
          return;
        }
        // Create source atom at original click position
        snapshot();
        srcId = addAtom(d.pendingX, d.pendingY, 'C');
      }

      const src = useGraphStore.getState().atoms[srcId];
      if (src) {
        let tgt = findAtomAt(x, y, srcId);
        const dist = Math.hypot(d.x - src.x, d.y - src.y);
        if (!tgt && dist < 5) {
          const state = useGraphStore.getState();
          const angle = getBestAngle(srcId, state.atoms, state.bonds);
          const ex = src.x + Math.cos(angle) * BOND_LENGTH;
          const ey = src.y + Math.sin(angle) * BOND_LENGTH;
          const existingAt = findAtomAt(ex, ey, srcId);
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
          addBond(srcId, tgt, bt);
        }
      }
      setDrawing(null);
    }
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // ── Implicit H helper ───────────────────────────────────────────────────────
  const getImplicitH = useCallback((atomId: AtomId) => {
    const a = atoms[atomId];
    if (!a || a.element === 'C') return 0; // C shown implicitly
    const maxH = IMPLICIT_H[a.element] ?? 0;
    const bonded = Object.values(bonds).filter(b => b.source === atomId || b.target === atomId)
      .reduce((acc, b) => acc + (b.type === 'DOUBLE' ? 2 : b.type === 'TRIPLE' ? 3 : 1), 0);
    return Math.max(0, maxH - bonded);
  }, [atoms, bonds]);

  // ── Bond rendering ──────────────────────────────────────────────────────────
  const renderBond = (bond: typeof bonds[string]) => {
    const s = atoms[bond.source], t = atoms[bond.target];
    if (!s || !t) return null;
    const isHov = hoveredBond === bond.id;
    const color = isHov ? '#c00' : '#1a1a1a';
    const sw = isHov ? BOND_WIDTH + 0.6 : BOND_WIDTH;

    // Clip bond endpoints at atom label boundaries
    const sHC = getImplicitHFor(bond.source, atoms, bonds);
    const tHC = getImplicitHFor(bond.target, atoms, bonds);
    const rS = getAtomRadius(s.element, sHC);
    const rT = getAtomRadius(t.element, tHC);
    const cs = clipEndpoint(t.x, t.y, s.x, s.y, rS);
    const ct = clipEndpoint(s.x, s.y, t.x, t.y, rT);
    const x1 = cs.x, y1 = cs.y, x2 = ct.x, y2 = ct.y;

    return (
      <g key={bond.id}
        onPointerEnter={() => setHoveredBond(bond.id)}
        onPointerLeave={() => setHoveredBond(null)}
        onPointerDown={(e) => onBondDown(e, bond.id)}
      >
        {/* Wide hit area (full length) */}
        <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="transparent" strokeWidth="14" style={{ cursor: 'pointer' }} />

        {bond.type === 'WEDGE' && <WedgeBond x1={x1} y1={y1} x2={x2} y2={y2} color={color} />}
        {bond.type === 'HASH' && <HashBond x1={x1} y1={y1} x2={x2} y2={y2} color={color} />}

        {(bond.type === 'SINGLE' || bond.type === 'DOUBLE' || bond.type === 'TRIPLE') && (
          <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={color} strokeWidth={sw} strokeLinecap="round" pointerEvents="none" />
        )}
        {bond.type === 'DOUBLE' && (() => {
          const p = parallelLine(x1, y1, x2, y2, DBL_OFFSET);
          return <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}
            stroke={color} strokeWidth={sw} strokeLinecap="round" pointerEvents="none" />;
        })()}
        {bond.type === 'TRIPLE' && (() => {
          const p1 = parallelLine(x1, y1, x2, y2, DBL_OFFSET + 1.5);
          const p2 = parallelLine(x1, y1, x2, y2, -(DBL_OFFSET + 1.5));
          return <>
            <line x1={p1.x1} y1={p1.y1} x2={p1.x2} y2={p1.y2} stroke={color} strokeWidth={sw} strokeLinecap="round" pointerEvents="none" />
            <line x1={p2.x1} y2={p2.y1} x2={p2.x2} y2={p2.y2} stroke={color} strokeWidth={sw} strokeLinecap="round" pointerEvents="none" />
          </>;
        })()}
      </g>
    );
  };

  // ── Atom rendering ──────────────────────────────────────────────────────────
  const renderAtom = (atom: typeof atoms[string]) => {
    const isHov = hoveredAtom === atom.id;
    const isSel = selectedAtoms.has(atom.id);
    const showLabel = atom.element !== 'C';
    const color = ELEMENT_COLORS[atom.element] ?? '#1a1a1a';
    const hCount = getImplicitH(atom.id);

    return (
      <g key={atom.id}
        transform={`translate(${atom.x},${atom.y})`}
        onPointerEnter={() => setHoveredAtom(atom.id)}
        onPointerLeave={() => setHoveredAtom(null)}
        onPointerDown={(e) => onAtomDown(e, atom.id)}
        style={{ cursor: activeTool === 'PAN' ? 'grab' : activeTool === 'SELECT' ? 'grab' : activeTool === 'ERASER' ? 'pointer' : 'crosshair' }}
      >
        {/* Permanent hit area */}
        <circle r={ATOM_HIT_R} fill="transparent" />

        {/* Selection / Hover ring */}
        {isSel && !isHov && (
          <circle r={ATOM_HIT_R} fill="rgba(74, 144, 226, 0.2)" stroke="#4a90e2" strokeWidth={1} />
        )}
        {isHov && (
          <circle r={ATOM_HIT_R + 4} fill="rgba(245, 158, 11, 0.35)" stroke="#f59e0b" strokeWidth={2} />
        )}

        {showLabel && (
          <>
            <circle r={10} fill="white" />
            <text
              textAnchor="middle" dominantBaseline="central"
              fontSize={FONT_SIZE} fontWeight="700"
              fill={color}
              fontFamily="Arial, Helvetica, sans-serif"
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
        ref={svgRef} width="100%" height="100%"
        onPointerDown={onCanvasDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp} onWheel={onWheel} onContextMenu={onContextMenu}
        style={{ touchAction: 'none', display: 'block', cursor: activeTool === 'PAN' ? 'grab' : activeTool === 'SELECT' ? 'default' : 'crosshair' }}
      >
        <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
          {/* Images in background */}
          {Object.values(images).map(img => (
            <image
              key={img.id}
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
            <line
              x1={atoms[drawing.src].x} y1={atoms[drawing.src].y}
              x2={drawing.x} y2={drawing.y}
              stroke="#4a90d9" strokeWidth="1.5" strokeDasharray="5 3"
              pointerEvents="none"
            />
          )}
          {drawing && drawing.src === '__pending__' && (
            <line
              x1={drawing.pendingX} y1={drawing.pendingY}
              x2={drawing.x} y2={drawing.y}
              stroke="#4a90d9" strokeWidth="1.5" strokeDasharray="5 3"
              pointerEvents="none"
            />
          )}

          {/* Selection box */}
          {selBox && (
            <rect
              x={Math.min(selBox.ox, selBox.x)} y={Math.min(selBox.oy, selBox.y)}
              width={Math.abs(selBox.x - selBox.ox)} height={Math.abs(selBox.y - selBox.oy)}
              fill="rgba(74,144,217,0.08)" stroke="#4a90d9" strokeWidth={1 / zoom} strokeDasharray={`${4/zoom} ${2/zoom}`}
            />
          )}

          {Object.values(atoms).map(renderAtom)}

          {/* Stereo Labels */}
          {stereoLabels && stereoLabels.map(lbl => (
            <text
              key={lbl.id}
              x={lbl.x} y={lbl.y}
              fontSize="12"
              fill="#e11d48"
              fontFamily="sans-serif"
              fontWeight="bold"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
              dominantBaseline="middle"
              textAnchor="middle"
            >
              {lbl.text}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}
