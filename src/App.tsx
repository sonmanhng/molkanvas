import React from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { Viewer3D } from './components/Viewer3D';
import { TLCGenerator } from './components/TLCGenerator';
import { BioBuilder } from './components/BioBuilder';
import { TEMPLATES } from './components/TemplateSidebar';
import { SHAPE_TEMPLATES } from './components/ShapeLibrary';
import { ChemblResult } from './components/ChemblResult';
import { SpectraViewer } from './components/SpectraViewer';
import { ConformerViewer } from './components/ConformerViewer';
import { useGraphStore } from './store/graphStore';
import './index.css';

// ── Tiny SVG icons ───────────────────────────────────────────────────────────
const Ico = ({ d }: { d: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

const icons = {
  new: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></>,
  open: <><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></>,
  save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
  cut: <><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="13.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="10.12" x2="12" y2="14"/></>,
  copy: <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
  paste: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></>,
  undo: <><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></>,
  redo: <><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></>,
  zoomin: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></>,
  zoomout: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></>,
  ocr: <><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 8h8"/><path d="M7 12h10"/><path d="M7 16h6"/></>,
  d3: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
  view3d: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
  database: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>,
  nmr: <><path d="M4 22h16"/><path d="M4 15s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2"/><path d="M4 8s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2"/><path d="M2 2v20"/></>,
  wand: <><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8l1.4 1.4"/><path d="M17.8 6.2l1.4-1.4"/><path d="M12.2 6.2l-1.4-1.4"/><path d="M2 22l10-10"/></>,
  template: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
  shapes: <><polygon points="12 2 2 22 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></>,
  stereo: <><circle cx="12" cy="12" r="10"/><text x="12" y="16" fontSize="10" fontWeight="bold" textAnchor="middle" fill="currentColor">R/S</text></>,
  sidebar: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="15" y1="3" x2="15" y2="21"/></>,
  tlc: <><rect x="5" y="2" width="14" height="20" rx="1"/><line x1="5" y1="18" x2="19" y2="18" strokeDasharray="2 1"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="8" r="1.5"/></>,
  bio: <><path d="M 6 4 C 18 10, 18 20, 6 26 M 26 4 C 14 10, 14 20, 26 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="10" y1="9" x2="22" y2="9" stroke="currentColor" strokeWidth="2"/><line x1="13" y1="15" x2="19" y2="15" stroke="currentColor" strokeWidth="2"/><line x1="10" y1="21" x2="22" y2="21" stroke="currentColor" strokeWidth="2"/></>
};

function App() {
  const { atoms, bonds, activeTool, zoom } = useGraphStore();
  const atomCount = Object.keys(atoms).length;
  const bondCount = Object.keys(bonds).length;
  const [statusMsg, setStatusMsg] = React.useState('');
  
  const [propsData, setPropsData] = React.useState<any>(null);
  const [smilesInput, setSmilesInput] = React.useState('');
  
  // IUPAC states
  const [iupacInput, setIupacInput] = React.useState('');
  const [fetchedIupac, setFetchedIupac] = React.useState('');
  const [isFetchingIupac, setIsFetchingIupac] = React.useState(false);
  const [showRightPanel, setShowRightPanel] = React.useState(true);
  const [showTLCModal, setShowTLCModal] = React.useState(false);
  const [showBioModal, setShowBioModal] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      const state = useGraphStore.getState();
      const payload = JSON.stringify({ atoms: Object.values(state.atoms), bonds: Object.values(state.bonds) });
      try {
        const res = await (window as any).electronAPI.calculateProperties(payload);
        setPropsData(res);
      } catch (e) {
        console.error(e);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [atoms, bonds]);

  const handleNew = () => useGraphStore.getState().clear();
  
  const [saveMenuOpen, setSaveMenuOpen] = React.useState(false);
  const [copyMenuOpen, setCopyMenuOpen] = React.useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = React.useState(false);
  const [shapeMenuOpen, setShapeMenuOpen] = React.useState(false);
  const [show3D, setShow3D] = React.useState(false);
  const [sdfData, setSdfData] = React.useState<string | null>(null);
  
  const [showConformer, setShowConformer] = React.useState(false);
  const [conformerData, setConformerData] = React.useState<any[] | null>(null);
  const [isAnalyzingConformer, setIsAnalyzingConformer] = React.useState(false);
  
  const [showChembl, setShowChembl] = React.useState(false);
  const [chemblData, setChemblData] = React.useState<any>(null);
  const [chemblFetching, setChemblFetching] = React.useState(false);

  const [showNmr, setShowNmr] = React.useState(false);
  const [nmrData, setNmrData] = React.useState<any>(null);
  const [nmrFetching, setNmrFetching] = React.useState(false);

  const [docStyleMenuOpen, setDocStyleMenuOpen] = React.useState(false);

  const handleOpen = async () => {
    try {
      const result = await (window as any).electronAPI.openFile({
        filters: [{ name: 'MolKanvas Project', extensions: ['molk', 'json'] }]
      });
      if (result) {
        const data = JSON.parse(result.content);
        if (data.atoms && data.bonds) {
          useGraphStore.getState().loadGraph(data.atoms, data.bonds);
        }
      }
    } catch (err) {
      alert('Lỗi mở file: ' + err);
    }
  };

  const handleSaveProject = async () => {
    setSaveMenuOpen(false);
    try {
      const st = useGraphStore.getState();
      const content = JSON.stringify({ atoms: st.atoms, bonds: st.bonds });
      await (window as any).electronAPI.saveFile(content, {
        title: 'Save Project',
        defaultPath: 'project.molk',
        filters: [{ name: 'MolKanvas Project', extensions: ['molk', 'json'] }]
      });
    } catch (err) {
      alert('Lỗi lưu file: ' + err);
    }
  };

  const handleSave2DMol = async () => {
    setSaveMenuOpen(false);
    try {
      const st = useGraphStore.getState();
      const atomKeys = Object.keys(st.atoms);
      if (atomKeys.length === 0) {
        alert("Bản vẽ trống!");
        return;
      }
      
      const payloadAtoms: any[] = [];
      const idMap = new Map();
      const atomsToExport = st.selectedAtoms.size > 0 ? Array.from(st.selectedAtoms) : atomKeys;
      
      atomsToExport.forEach((id, idx) => {
        const a = st.atoms[id];
        payloadAtoms.push({ id: a.id, element: a.element, x: a.x, y: a.y });
        idMap.set(a.id, idx);
      });
      
      const payloadBonds = Object.values(st.bonds).filter(b => 
        idMap.has(b.source) && idMap.has(b.target)
      );

      const payload = JSON.stringify({ atoms: payloadAtoms, bonds: payloadBonds });
      const mol2d = await (window as any).electronAPI.generate2DMol(payload);
      
      await (window as any).electronAPI.saveFile(mol2d, {
        title: 'Save 2D MOL',
        defaultPath: 'structure_2d.mol',
        filters: [{ name: 'MOL File', extensions: ['mol'] }]
      });
    } catch (err) {
      alert('Lỗi lưu 2D MOL: ' + err);
    }
  };

  const handleExportHighRes = async () => {
    setSaveMenuOpen(false);
    try {
      const state = useGraphStore.getState();
      const allAtoms = Object.values(state.atoms);
      const allImages = Object.values(state.images);
      if (allAtoms.length === 0 && allImages.length === 0) {
        alert("Bản vẽ trống!");
        return;
      }

      const hasSelection = state.selectedAtoms.size > 0 || state.selectedImages.size > 0;
      const atoms = hasSelection 
        ? allAtoms.filter(a => state.selectedAtoms.has(a.id))
        : allAtoms;
      const images = hasSelection
        ? allImages.filter(img => state.selectedImages.has(img.id))
        : allImages;

      if (atoms.length === 0 && images.length === 0) {
        alert("Bạn chưa chọn đối tượng nào (hoặc bản vẽ trống)!");
        return;
      }
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      atoms.forEach(a => {
        minX = Math.min(minX, a.x); minY = Math.min(minY, a.y);
        maxX = Math.max(maxX, a.x); maxY = Math.max(maxY, a.y);
      });
      images.forEach(img => {
        minX = Math.min(minX, img.x); minY = Math.min(minY, img.y);
        maxX = Math.max(maxX, img.x + img.width); maxY = Math.max(maxY, img.y + img.height);
      });
      
      const PADDING = 40;
      minX -= PADDING; minY -= PADDING; maxX += PADDING; maxY += PADDING;
      
      const width = maxX - minX;
      const height = maxY - minY;

      const svgNode = document.getElementById('molkanvas-svg');
      if (!svgNode) {
        alert('Không tìm thấy SVG để xuất!');
        return;
      }
      
      const clone = svgNode.cloneNode(true) as SVGSVGElement;
      
      // Xoá các UI elements
      const uiElements = clone.querySelectorAll('.ui-element');
      uiElements.forEach(el => el.remove());

      // Xoá các element không được chọn
      if (hasSelection) {
        clone.querySelectorAll('[data-atom-id]').forEach(el => {
          if (!state.selectedAtoms.has(el.getAttribute('data-atom-id')!)) el.remove();
        });
        clone.querySelectorAll('[data-image-id]').forEach(el => {
          if (!state.selectedImages.has(el.getAttribute('data-image-id')!)) el.remove();
        });
        // Đối với liên kết, chỉ xuất các liên kết mà cả 2 đầu nguyên tử đều được chọn
        clone.querySelectorAll('[data-bond-id]').forEach(el => {
          const bondId = el.getAttribute('data-bond-id')!;
          const bond = state.bonds[bondId];
          if (!bond || !state.selectedAtoms.has(bond.source) || !state.selectedAtoms.has(bond.target)) {
            el.remove();
          }
        });
      }
      
      clone.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
      clone.setAttribute('width', `${width}`);
      clone.setAttribute('height', `${height}`);
      clone.style.background = 'transparent';
      
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clone);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = async () => {
        const SCALE = 12.5; // 1200 DPI
        const canvas = document.createElement('canvas');
        canvas.width = width * SCALE;
        canvas.height = height * SCALE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        
        await (window as any).electronAPI.saveFile(dataUrl, {
          title: 'Export High-Res PNG (1200 DPI)',
          defaultPath: 'structure_1200dpi.png',
          filters: [{ name: 'PNG Image', extensions: ['png'] }]
        });
      };
      img.onerror = () => {
        alert('Có lỗi khi vẽ SVG sang Canvas.');
      };
      img.src = url;
    } catch (err) {
      alert('Lỗi xuất ảnh: ' + err);
    }
  };

  const handleGenerate3D = async () => {
    try {
      const state = useGraphStore.getState();
      
      let targetAtoms = Object.values(state.atoms);
      let targetBonds = Object.values(state.bonds);
      
      if (state.selectedAtoms.size > 0) {
        targetAtoms = targetAtoms.filter(a => state.selectedAtoms.has(a.id));
        targetBonds = targetBonds.filter(b => state.selectedAtoms.has(b.source) && state.selectedAtoms.has(b.target));
      }

      if (targetAtoms.length === 0) {
        alert('Vui lòng vẽ hoặc bôi đen cấu trúc để xem 3D!');
        return;
      }

      const payload = JSON.stringify({
        atoms: targetAtoms,
        bonds: targetBonds
      });
      const sdf = await (window as any).electronAPI.generate3D(payload);
      setSdfData(sdf);
      setShow3D(true);
    } catch (err: any) {
      alert('3D Generation failed: ' + err);
    }
  };

  const handleAnalyzeConformers = async () => {
    try {
      const state = useGraphStore.getState();
      
      let targetAtoms = Object.values(state.atoms);
      let targetBonds = Object.values(state.bonds);
      
      if (state.selectedAtoms.size > 0) {
        targetAtoms = targetAtoms.filter(a => state.selectedAtoms.has(a.id));
        targetBonds = targetBonds.filter(b => state.selectedAtoms.has(b.source) && state.selectedAtoms.has(b.target));
      }

      if (targetAtoms.length === 0) {
        alert('Vui lòng vẽ hoặc bôi đen cấu trúc để phân tích!');
        return;
      }

      const payload = JSON.stringify({
        atoms: targetAtoms,
        bonds: targetBonds
      });

      setIsAnalyzingConformer(true);
      
      // Get SMILES first
      const props = await (window as any).electronAPI.calculateProperties(payload);
      if (props.error) throw new Error(props.error);
      if (!props.smiles) throw new Error("Could not generate SMILES for analysis.");

      // Analyze conformers
      const result = await (window as any).electronAPI.analyzeConformers(props.smiles);
      if (result.error) throw new Error(result.error);
      
      setConformerData(result.conformers);
      setShowConformer(true);
    } catch (err: any) {
      alert('Conformer Analysis failed: ' + err);
    } finally {
      setIsAnalyzingConformer(false);
    }
  };

  const handleCleanGraph = async () => {
    try {
      const state = useGraphStore.getState();
      const payload = JSON.stringify({ atoms: Object.values(state.atoms), bonds: Object.values(state.bonds) });
      const res = await (window as any).electronAPI.cleanGraph(payload);
      if (res && res.atoms && res.bonds) {
        state.snapshot();
        state.loadGraph(res.atoms, res.bonds);
      }
    } catch (err) {
      alert('Lỗi Clean Structure: ' + err);
    }
  };

  const handleAnalyzeStereo = async () => {
    try {
      const state = useGraphStore.getState();
      const payload = JSON.stringify({ atoms: Object.values(state.atoms), bonds: Object.values(state.bonds) });
      const res = await (window as any).electronAPI.analyzeStereo(payload);
      if (res && res.labels) {
        state.setStereoLabels(res.labels);
      }
    } catch (err) {
      alert('Lỗi Analyze Stereo: ' + err);
    }
  };

  const handleSmilesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smilesInput.trim()) return;
    try {
      const res = await (window as any).electronAPI.smilesToGraph(smilesInput.trim());
      if (res.error) {
        alert(res.error);
        return;
      }
      if (res && res.atoms && res.bonds) {
        const state = useGraphStore.getState();
        state.snapshot();
        state.loadGraph(res.atoms, res.bonds);
        setSmilesInput('');
      }
    } catch (err) {
      alert(err);
    }
  };

  const handleChemblSearch = async () => {
    try {
      const state = useGraphStore.getState();
      
      let targetAtoms = Object.values(state.atoms);
      let targetBonds = Object.values(state.bonds);
      
      if (state.selectedAtoms.size > 0) {
        targetAtoms = targetAtoms.filter(a => state.selectedAtoms.has(a.id));
        targetBonds = targetBonds.filter(b => state.selectedAtoms.has(b.source) && state.selectedAtoms.has(b.target));
      }

      if (targetAtoms.length === 0) {
        alert('Vui lòng vẽ hoặc bôi đen cấu trúc để tra cứu ChEMBL!');
        return;
      }

      setChemblFetching(true);

      const payload = JSON.stringify({
        atoms: targetAtoms,
        bonds: targetBonds
      });

      // 1. Get SMILES via calculateProperties endpoint which returns smiles too
      const props = await (window as any).electronAPI.calculateProperties(payload);
      if (props.error) throw new Error(props.error);
      if (!props.smiles) throw new Error("Could not generate SMILES for the selected structure.");

      // 2. Search ChEMBL
      const result = await (window as any).electronAPI.chemblSearch(props.smiles);
      if (!result) throw new Error("Kết quả từ Python trả về trống (undefined). Có thể do lỗi cài đặt Python.");
      if (result.error) throw new Error(result.error);
      
      setChemblData(result);
      setShowChembl(true);
    } catch (err: any) {
      alert('ChEMBL Search failed: ' + err.message);
    } finally {
      setChemblFetching(false);
    }
  };

  const handlePredictNmr = async () => {
    try {
      const state = useGraphStore.getState();
      
      let targetAtoms = Object.values(state.atoms);
      let targetBonds = Object.values(state.bonds);
      
      if (state.selectedAtoms.size > 0) {
        targetAtoms = targetAtoms.filter(a => state.selectedAtoms.has(a.id));
        targetBonds = targetBonds.filter(b => state.selectedAtoms.has(b.source) && state.selectedAtoms.has(b.target));
      }

      if (targetAtoms.length === 0) {
        alert('Vui lòng vẽ hoặc bôi đen cấu trúc để dự đoán phổ NMR!');
        return;
      }

      setNmrFetching(true);
      const payload = JSON.stringify({
        atoms: targetAtoms,
        bonds: targetBonds
      });

      if (!(window as any).electronAPI) {
          alert('Lỗi: Bạn đang mở ứng dụng trong trình duyệt web thông thường (Chrome/Edge). Các tính năng dự đoán Phổ, 3D, OCR yêu cầu chạy qua ứng dụng Electron (chạy file start.bat và đợi cửa sổ ứng dụng tự hiện lên).');
          return;
        }
        const result = await (window as any).electronAPI.predictNmr(payload);
      if (!result) throw new Error("Result from IPC is undefined or null");
      if (result.error) throw new Error(result.error);
      
      setNmrData(result);
      setShowNmr(true);
    } catch (err: any) {
      alert('Lỗi dự đoán phổ: ' + (err.message || JSON.stringify(err)));
      console.error(err);
    } finally {
      setNmrFetching(false);
    }
  };

  const handleIupacToStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iupacInput.trim()) return;
    try {
      const res = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(iupacInput.trim())}/property/IsomericSMILES/JSON`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      const smiles = data.PropertyTable?.Properties?.[0]?.IsomericSMILES;
      if (smiles) {
        const structRes = await (window as any).electronAPI.smilesToGraph(smiles);
        if (structRes && structRes.atoms) {
          const state = useGraphStore.getState();
          state.snapshot();
          state.loadGraph(structRes.atoms, structRes.bonds);
          setIupacInput('');
        }
      }
    } catch (err) {
      alert('Could not find structure for this IUPAC name in PubChem.');
    }
  };

  const handleFetchIupac = async () => {
    if (!propsData?.smiles) return;
    setIsFetchingIupac(true);
    setFetchedIupac('');
    try {
      const res = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(propsData.smiles)}/property/IUPACName/JSON`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      const iupac = data.PropertyTable?.Properties?.[0]?.IUPACName;
      setFetchedIupac(iupac || 'Unknown');
    } catch (err) {
      setFetchedIupac('Not found in PubChem (Novel compound)');
    } finally {
      setIsFetchingIupac(false);
    }
  };


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
        setTemplateMenuOpen(false);
      }
    } catch (err) {
      alert('Error loading template: ' + err);
    }
  };

  const handleShapeClick = (shape: typeof SHAPE_TEMPLATES[0]) => {
    const state = useGraphStore.getState();
    state.snapshot();
    const vpX = -state.panX + 300;
    const vpY = -state.panY + 200;
    state.addImage(shape.svgDataUrl, vpX - shape.width / 2, vpY - shape.height / 2, shape.width, shape.height);
    setShapeMenuOpen(false);
  };

  const handleOCR = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          setStatusMsg('Running AI OCR (DECIMER)... Please wait.');
          // electronAPI is exposed in preload.cjs
          const smiles = await (window as any).electronAPI.recognizeImage(arrayBuffer, file.name);
          if (smiles) {
            import('./utils/smilesParser').then(module => {
              const success = module.parseSmilesToStore(smiles);
              if (!success) alert("Failed to parse SMILES: " + smiles);
            });
          } else {
            alert("No SMILES returned from OCR.");
          }
        } catch (err) {
          alert('OCR failed: ' + err);
        } finally {
          setStatusMsg('');
        }
      }
    };
    input.click();
  };

  const handleInsertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const src = event.target?.result as string;
          const img = new Image();
          img.onload = () => {
            const state = useGraphStore.getState();
            state.snapshot();
            // Center in viewport roughly:
            const vpX = -state.panX + 300;
            const vpY = -state.panY + 200;
            state.addImage(src, vpX - img.width / 2, vpY - img.height / 2, img.width, img.height);
          };
          img.src = src;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleCopy = () => {
    setCopyMenuOpen(false);
    const st = useGraphStore.getState();
    const atomList = st.selectedAtoms.size > 0 ? Array.from(st.selectedAtoms) : Object.keys(st.atoms);
    const subAtoms: any = {};
    atomList.forEach(id => subAtoms[id] = st.atoms[id]);
    const subBonds: any = {};
    Object.values(st.bonds).forEach(b => {
      if (subAtoms[b.source] && subAtoms[b.target]) subBonds[b.id] = b;
    });
    navigator.clipboard.writeText(JSON.stringify({ atoms: subAtoms, bonds: subBonds }));
  };

  const handleCopyAsSmiles = async () => {
    setCopyMenuOpen(false);
    const st = useGraphStore.getState();
    const atomList = st.selectedAtoms.size > 0 ? Array.from(st.selectedAtoms) : Object.keys(st.atoms);
    if (atomList.length === 0) {
      alert("Bản vẽ trống!");
      return;
    }
    const subAtoms: any = {};
    atomList.forEach(id => subAtoms[id] = st.atoms[id]);
    const subBonds: any = {};
    Object.values(st.bonds).forEach(b => {
      if (subAtoms[b.source] && subAtoms[b.target]) subBonds[b.id] = b;
    });
    
    const payload = JSON.stringify({ atoms: Object.values(subAtoms), bonds: Object.values(subBonds) });
    try {
      const props = await (window as any).electronAPI.calculateProperties(payload);
      if (props.error) throw new Error(props.error);
      if (!props.smiles) throw new Error("Could not generate SMILES");
      await navigator.clipboard.writeText(props.smiles);
      alert("Đã copy SMILES vào Clipboard!");
    } catch (err: any) {
      alert("Lỗi tạo SMILES: " + err.message);
    }
  };

  const handleCopyAsImage = async () => {
    setCopyMenuOpen(false);
    try {
      const state = useGraphStore.getState();
      const allAtoms = Object.values(state.atoms);
      const allImages = Object.values(state.images);
      if (allAtoms.length === 0 && allImages.length === 0) {
        alert("Bản vẽ trống!");
        return;
      }

      const hasSelection = state.selectedAtoms.size > 0 || state.selectedImages.size > 0;
      const atoms = hasSelection 
        ? allAtoms.filter(a => state.selectedAtoms.has(a.id))
        : allAtoms;
      const images = hasSelection
        ? allImages.filter(img => state.selectedImages.has(img.id))
        : allImages;

      if (atoms.length === 0 && images.length === 0) {
        alert("Bạn chưa chọn đối tượng nào (hoặc bản vẽ trống)!");
        return;
      }
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      atoms.forEach(a => {
        minX = Math.min(minX, a.x); minY = Math.min(minY, a.y);
        maxX = Math.max(maxX, a.x); maxY = Math.max(maxY, a.y);
      });
      images.forEach(img => {
        minX = Math.min(minX, img.x); minY = Math.min(minY, img.y);
        maxX = Math.max(maxX, img.x + img.width); maxY = Math.max(maxY, img.y + img.height);
      });
      
      const PADDING = 40;
      minX -= PADDING; minY -= PADDING; maxX += PADDING; maxY += PADDING;
      
      const width = maxX - minX;
      const height = maxY - minY;

      const svgNode = document.getElementById('molkanvas-svg');
      if (!svgNode) return;
      
      const clone = svgNode.cloneNode(true) as SVGSVGElement;
      
      const uiElements = clone.querySelectorAll('.ui-element');
      uiElements.forEach(el => el.remove());

      if (hasSelection) {
        clone.querySelectorAll('[data-atom-id]').forEach(el => {
          if (!state.selectedAtoms.has(el.getAttribute('data-atom-id')!)) el.remove();
        });
        clone.querySelectorAll('[data-image-id]').forEach(el => {
          if (!state.selectedImages.has(el.getAttribute('data-image-id')!)) el.remove();
        });
        clone.querySelectorAll('[data-bond-id]').forEach(el => {
          const bondId = el.getAttribute('data-bond-id')!;
          const bond = state.bonds[bondId];
          if (!bond || !state.selectedAtoms.has(bond.source) || !state.selectedAtoms.has(bond.target)) {
            el.remove();
          }
        });
      }
      
      clone.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
      clone.setAttribute('width', `${width}`);
      clone.setAttribute('height', `${height}`);
      
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clone);
      
      const SCALE = 12.5; // 1200 DPI approx
      const canvas = document.createElement('canvas');
      canvas.width = width * SCALE;
      canvas.height = height * SCALE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const img = new Image();
      const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = async () => {
        ctx.drawImage(img, 0, 0, width * SCALE, height * SCALE);
        URL.revokeObjectURL(url);
        
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            alert("Đã copy hình ảnh chất lượng cao vào Clipboard!");
          } catch (e) {
            alert("Lỗi copy ảnh: " + e);
          }
        }, 'image/png');
      };
      img.src = url;
    } catch (err) {
      alert('Lỗi copy ảnh: ' + err);
    }
  };


  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);
      if (!data.atoms || !data.bonds) return;
      const st = useGraphStore.getState();
      st.snapshot();
      const idMap: Record<string, string> = {};
      // Offset pasted structure
      Object.values(data.atoms).forEach((a: any) => {
        const newId = st.addAtom(a.x + 20, a.y + 20, a.element);
        idMap[a.id] = newId;
      });
      Object.values(data.bonds).forEach((b: any) => {
        if (idMap[b.source] && idMap[b.target]) {
          st.addBond(idMap[b.source], idMap[b.target], b.type);
        }
      });
    } catch(e) {}
  };

  const handleCut = () => {
    handleCopy();
    const st = useGraphStore.getState();
    st.snapshot();
    Array.from(st.selectedAtoms).forEach(id => st.removeAtom(id));
    st.selectedAtoms.clear();
  };

  return (
    <div className="app-window">
      {/* ── Title Bar ── */}
      <div className="title-bar">
        <div className="title-bar__name">Untitled — MolKanvas</div>
      </div>

      {/* ── Icon Toolbar ── */}
      <div className="icon-toolbar">
        <button className="icon-btn" title="New" onClick={handleNew}><Ico d={icons.new} /></button>
        <button className="icon-btn" title="Open" onClick={handleOpen}><Ico d={icons.open} /></button>
        <div style={{ position: 'relative', display: 'flex' }}>
          <button className="icon-btn" title="Save/Export" onClick={() => setSaveMenuOpen(!saveMenuOpen)}><Ico d={icons.save} /></button>
          {saveMenuOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={handleSaveProject}>
                Save Project (.molk)
              </button>
              <button className="dropdown-item" onClick={handleSave2DMol}>
                Export 2D (.mol)
              </button>
              <div className="dropdown-sep"></div>
              <button className="dropdown-item primary" onClick={handleExportHighRes}>
                Export Image (1200 DPI)
              </button>
            </div>
          )}
        </div>
        <div className="icon-toolbar__sep" />
        <button className="icon-btn" title="Cut" onClick={handleCut}><Ico d={icons.cut} /></button>
        <div style={{ position: 'relative', display: 'flex' }}>
          <button className="icon-btn" title="Copy" onClick={() => setCopyMenuOpen(!copyMenuOpen)}><Ico d={icons.copy} /></button>
          {copyMenuOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={handleCopy}>
                Copy Structure (JSON)
              </button>
              <button className="dropdown-item" onClick={handleCopyAsSmiles}>
                Copy as SMILES
              </button>
              <div className="dropdown-sep"></div>
              <button className="dropdown-item primary" onClick={handleCopyAsImage}>
                Copy as Image (High Res)
              </button>
            </div>
          )}
        </div>
        <button className="icon-btn" title="Paste" onClick={handlePaste}><Ico d={icons.paste} /></button>
        <div className="icon-toolbar__sep" />
        <button className="icon-btn" title="Undo (⌘Z)" onClick={() => useGraphStore.getState().undo()}>
          <Ico d={icons.undo} />
        </button>
        <button className="icon-btn" title="Redo (⌘⇧Z)" onClick={() => useGraphStore.getState().redo()}>
          <Ico d={icons.redo} />
        </button>
        <div className="icon-toolbar__sep" />
        <button className="icon-btn" title="Zoom In"
          onClick={() => {
            const s = useGraphStore.getState();
            s.setViewport(s.zoom * 1.25, s.panX, s.panY);
          }}>
          <Ico d={icons.zoomin} />
        </button>
        <button className="icon-btn" title="Zoom Out"
          onClick={() => {
            const s = useGraphStore.getState();
            s.setViewport(s.zoom * 0.8, s.panX, s.panY);
          }}>
          <Ico d={icons.zoomout} />
        </button>
        <div className="icon-toolbar__sep" />
        <button className="icon-btn" title="BioDraw Studio" onClick={() => setShowBioModal(true)} style={{ color: '#ec4899' }}>
          <Ico d={icons.bio} />
        </button>
        <button className="icon-btn" title="TLC Studio" onClick={() => setShowTLCModal(true)} style={{ color: '#8b5cf6' }}>
          <Ico d={icons.tlc} />
        </button>
        <button className="icon-btn" title="Image OCR (Extract Structure)" onClick={handleOCR} style={{ color: '#2563eb' }}>
          <Ico d={icons.ocr} />
        </button>
        <button className="icon-btn" title="Insert Image" onClick={handleInsertImage} style={{ color: '#0284c7' }}>
          <Ico d={icons.image} />
        </button>
        <button className="icon-btn" title="Clean Up Structure" onClick={handleCleanGraph} style={{ color: '#8b5cf6' }}>
          <Ico d={icons.wand} />
        </button>
        <button className="icon-btn" title="Analyze Stereochemistry (R/S & E/Z)" onClick={handleAnalyzeStereo} style={{ color: '#e11d48' }}>
          <Ico d={icons.stereo} />
        </button>
        <div style={{ position: 'relative', display: 'flex' }}>
          <button className="icon-btn" title="Templates" onClick={() => setTemplateMenuOpen(!templateMenuOpen)} style={{ color: '#ea580c' }}>
            <Ico d={icons.template} />
          </button>
          {templateMenuOpen && (
            <div className="dropdown-menu" style={{ minWidth: '200px', maxHeight: '400px', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '12px', margin: '4px 8px 8px 8px', color: '#64748b' }}>Templates</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', padding: '0 4px' }}>
                {TEMPLATES.map(t => (
                  <button key={t.name}
                    className="dropdown-item"
                    style={{ padding: '4px 8px', justifyContent: 'center' }}
                    onClick={() => {
                      handleTemplateClick(t.smiles);
                      setTemplateMenuOpen(false);
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ position: 'relative', display: 'flex' }}>
          <button className="icon-btn" title="Shapes / Apparatus" onClick={() => setShapeMenuOpen(!shapeMenuOpen)} style={{ color: '#10b981' }}>
            <Ico d={icons.shapes} />
          </button>
          {shapeMenuOpen && (
            <div className="dropdown-menu" style={{ minWidth: '220px', maxHeight: '400px', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '12px', margin: '4px 8px 8px 8px', color: '#64748b' }}>Apparatus & Shapes</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', padding: '0 4px' }}>
                {SHAPE_TEMPLATES.map(s => (
                  <button key={s.name}
                    className="dropdown-item"
                    style={{ padding: '4px', flexDirection: 'column', alignItems: 'center' }}
                    title={s.name}
                    onClick={() => {
                      handleShapeClick(s);
                      setShapeMenuOpen(false);
                    }}
                  >
                    <img src={s.svgDataUrl} alt={s.name} style={{ width: '40px', height: '40px', objectFit: 'contain', marginBottom: '4px' }} />
                    <span style={{ fontSize: '10px' }}>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button className="icon-btn" title="Generate 3D Structure" onClick={handleGenerate3D} style={{ color: '#059669' }}>
          <Ico d={icons.view3d} />
        </button>
        <button className="icon-btn" title={isAnalyzingConformer ? "Analyzing Conformers..." : "Analyze Conformers (Energy Landscape)"} onClick={handleAnalyzeConformers} style={{ color: isAnalyzingConformer ? '#94a3b8' : '#8b5cf6' }} disabled={isAnalyzingConformer}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M3 3v18h18v-2H5V3H3zm16.5 4.5l-4.5 4.5-3-3-4.5 4.5 1.5 1.5 3-3 3 3 6-6-1.5-1.5z"/>
          </svg>
        </button>
        <button className="icon-btn" title={chemblFetching ? "Searching Database..." : "ChEMBL Bioactivity Search"} onClick={handleChemblSearch} style={{ color: chemblFetching ? '#94a3b8' : '#ef4444' }} disabled={chemblFetching}>
          <Ico d={icons.database} />
        </button>
        <button className="icon-btn" title={nmrFetching ? "Predicting NMR..." : "Predict 1H-NMR Spectrum"} onClick={handlePredictNmr} style={{ color: nmrFetching ? '#94a3b8' : '#f59e0b' }} disabled={nmrFetching}>
          <Ico d={icons.nmr} />
        </button>
        <div className="icon-toolbar__sep" />
        <div style={{ position: 'relative', display: 'flex' }}>
          <button className="icon-btn" title="Document Settings (Style)" onClick={() => setDocStyleMenuOpen(!docStyleMenuOpen)} style={{ color: '#475569', fontSize: 10, fontWeight: 700, width: 36 }}>
            Doc
          </button>
          {docStyleMenuOpen && (
            <div className="dropdown-menu" style={{ right: 0, left: 'auto' }}>
              <h3 style={{ fontSize: '11px', margin: '4px 8px', color: '#64748b', textTransform: 'uppercase' }}>Document Style</h3>
              <button 
                className="dropdown-item"
                style={{ background: useGraphStore.getState().documentStyle === 'DEFAULT' ? '#eff6ff' : 'transparent', color: useGraphStore.getState().documentStyle === 'DEFAULT' ? '#2563eb' : 'inherit' }}
                onClick={() => { useGraphStore.getState().setDocumentStyle('DEFAULT'); setDocStyleMenuOpen(false); }}
              >
                Default Style
              </button>
              <button 
                className="dropdown-item"
                style={{ background: useGraphStore.getState().documentStyle === 'ACS_1996' ? '#eff6ff' : 'transparent', color: useGraphStore.getState().documentStyle === 'ACS_1996' ? '#2563eb' : 'inherit' }}
                onClick={() => { useGraphStore.getState().setDocumentStyle('ACS_1996'); setDocStyleMenuOpen(false); }}
              >
                ACS Document 1996
              </button>
            </div>
          )}
        </div>
        <div className="icon-toolbar__sep" />
        <button className="icon-btn" title="Toggle Properties Panel" onClick={() => setShowRightPanel(!showRightPanel)} style={{ color: showRightPanel ? '#2563eb' : '#64748b' }}>
          <Ico d={icons.sidebar} />
        </button>
        <div className="icon-toolbar__sep" />
        <button className="icon-btn" title="Reset Zoom"
          onClick={() => useGraphStore.getState().setViewport(1, 0, 0)}
          style={{ fontSize: 10, fontFamily: 'Inter', fontWeight: 700, width: 36, letterSpacing: -0.5 }}>
          {Math.round(zoom * 100)}%
        </button>
      </div>

      {/* ── Main Area ── */}
      <div className="main-row">
        <Toolbar />
        <div className="canvas-area" style={{ position: 'relative' }}>
          <div className="canvas-paper" style={showNmr && nmrData ? { bottom: '254px' } : {}}>
            <Canvas />
          </div>
          {showNmr && nmrData && (
            <SpectraViewer
              data1H={nmrData}
              onClose={() => setShowNmr(false)}
              getMolPayload={() => {
                const state = useGraphStore.getState();
                let targetAtoms = Object.values(state.atoms);
                let targetBonds = Object.values(state.bonds);
                if (state.selectedAtoms.size > 0) {
                  targetAtoms = targetAtoms.filter(a => state.selectedAtoms.has(a.id));
                  targetBonds = targetBonds.filter(b => state.selectedAtoms.has(b.source) && state.selectedAtoms.has(b.target));
                }
                return JSON.stringify({ atoms: targetAtoms, bonds: targetBonds });
              }}
            />
          )}
        </div>
        
        {showRightPanel && (
          <div className="right-sidebar">
            <div className="props-card" style={{ marginBottom: '12px' }}>
              <h3>Identifiers</h3>
              <form onSubmit={handleSmilesSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>SMILES TO STRUCTURE</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input 
                    type="text" 
                    value={smilesInput}
                    onChange={e => setSmilesInput(e.target.value)}
                    placeholder="Paste SMILES here..."
                    style={{ flex: 1, minWidth: 0, padding: '4px 6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                  <button type="submit" style={{ flexShrink: 0, padding: '4px 8px', fontSize: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Render</button>
                </div>
              </form>
              <form onSubmit={handleIupacToStructure} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>IUPAC TO STRUCTURE</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input 
                    type="text" 
                    value={iupacInput}
                    onChange={e => setIupacInput(e.target.value)}
                    placeholder="e.g. 1,3,7-Trimethylpurine-2,6-dione"
                    style={{ flex: 1, minWidth: 0, padding: '4px 6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                  <button type="submit" style={{ flexShrink: 0, padding: '4px 8px', fontSize: '12px', background: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Fetch</button>
                </div>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>CURRENT SMILES</label>
                <div style={{ padding: '6px', background: '#f1f5f9', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all', minHeight: '24px' }}>
                  {propsData?.smiles || '...'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>IUPAC NAME</label>
                  <button 
                    onClick={handleFetchIupac}
                    disabled={!propsData?.smiles || isFetchingIupac}
                    style={{ padding: '2px 6px', fontSize: '10px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    {isFetchingIupac ? 'Fetching...' : 'Fetch IUPAC'}
                  </button>
                </div>
                {fetchedIupac && (
                  <div style={{ padding: '6px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontSize: '11px', fontWeight: 500, wordBreak: 'break-word', minHeight: '24px' }}>
                    {fetchedIupac}
                  </div>
                )}
              </div>
            </div>

            <div className="props-card">
              <h3>Properties</h3>
              {propsData ? (
                propsData.error ? (
                  <div style={{color: 'red', fontSize: '12px'}}>{propsData.error}</div>
                ) : (
                  <>
                    <div className="prop-row">
                      <span className="prop-label">Mol. Weight</span>
                      <span className="prop-value">{propsData.mw}</span>
                    </div>
                    <div className="prop-row">
                      <span className="prop-label">LogP</span>
                      <span className="prop-value">{propsData.logp}</span>
                    </div>
                    <div className="prop-row">
                      <span className="prop-label">TPSA</span>
                      <span className="prop-value">{propsData.tpsa}</span>
                    </div>
                    <div className="prop-row">
                      <span className="prop-label">H-Donors</span>
                      <span className="prop-value">{propsData.hbd}</span>
                    </div>
                    <div className="prop-row">
                      <span className="prop-label">H-Acceptors</span>
                      <span className="prop-value">{propsData.hba}</span>
                    </div>
                    <div className="prop-row">
                      <span className="prop-label">Rotatable Bonds</span>
                      <span className="prop-value">{propsData.rotb}</span>
                    </div>
                    <div className="prop-row" style={{ marginTop: '12px', borderTop: '2px solid #e2e8f0', paddingTop: '12px' }}>
                      <span className="prop-label">Lipinski Violations</span>
                      <span className={`prop-value ${propsData.lipinski_violations > 0 ? 'danger' : ''}`}>
                        {propsData.lipinski_violations}
                      </span>
                    </div>
                  </>
                )
              ) : (
                <div style={{color: '#94a3b8', fontSize: '12px'}}>Vẽ cấu trúc để xem...</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Status Bar ── */}
      <div className="status-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {statusMsg ? (
            <span style={{ color: '#2563eb', fontWeight: 600 }}>{statusMsg}</span>
          ) : (
            <>
              <span>Atoms: {atomCount}</span>
              <div className="status-bar__sep" />
              <span>Bonds: {bondCount}</span>
              <div className="status-bar__sep" />
              <span>Tool: {activeTool.replace(/_/g, ' ')}</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.5, fontSize: '10px' }}>
          <span style={{ fontWeight: 600, color: '#334155' }}>MolKanvas v1.0</span>
          <div className="status-bar__sep" />
          <span>© Manh-Son Nguyen</span>
        </div>
      </div>
      {show3D && sdfData && (
        <Viewer3D sdfData={sdfData} onClose={() => setShow3D(false)} />
      )}
      {showConformer && conformerData && (
        <ConformerViewer conformers={conformerData} onClose={() => setShowConformer(false)} />
      )}
      {showChembl && chemblData && (
        <ChemblResult data={chemblData} onClose={() => setShowChembl(false)} />
      )}

      {showTLCModal && (
        <TLCGenerator onClose={() => setShowTLCModal(false)} />
      )}
      {showBioModal && (
        <BioBuilder onClose={() => setShowBioModal(false)} />
      )}
    </div>
  );
}

export default App;
