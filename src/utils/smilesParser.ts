// @ts-ignore
import { Molecule } from 'openchemlib';
import { useGraphStore } from '../store/graphStore';
import { BOND_LENGTH } from '../components/Canvas';

export function parseSmilesToStore(smiles: string) {
  try {
    const mol = Molecule.fromSmiles(smiles);
    mol.inventCoordinates();

    const st = useGraphStore.getState();
    st.snapshot();

    const offset = { x: 50, y: 50 };

    const atomCount = mol.getAllAtoms();
    const bondCount = mol.getAllBonds();

    const idMap: Record<number, string> = {};

    let totalLen = 0;
    for (let i = 0; i < bondCount; i++) {
      const a1 = mol.getBondAtom(0, i);
      const a2 = mol.getBondAtom(1, i);
      const dx = mol.getAtomX(a1) - mol.getAtomX(a2);
      const dy = mol.getAtomY(a1) - mol.getAtomY(a2);
      totalLen += Math.hypot(dx, dy);
    }
    const avgOclLength = bondCount > 0 ? totalLen / bondCount : 1.5;
    const scale = BOND_LENGTH / avgOclLength;

    for (let i = 0; i < atomCount; i++) {
      const symbol = mol.getAtomLabel(i);
      const x = offset.x + mol.getAtomX(i) * scale;
      const y = offset.y + mol.getAtomY(i) * scale;
      
      const newId = st.addAtom(x, y, symbol);
      idMap[i] = newId;
    }

    for (let i = 0; i < bondCount; i++) {
      const a1 = mol.getBondAtom(0, i);
      const a2 = mol.getBondAtom(1, i);
      const order = mol.getBondOrder(i);
      
      let type: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'WEDGE' | 'HASH' = 'SINGLE';
      if (order === 2) type = 'DOUBLE';
      if (order === 3) type = 'TRIPLE';

      if (idMap[a1] && idMap[a2]) {
        st.addBond(idMap[a1], idMap[a2], type);
      }
    }

    return true;
  } catch (error) {
    console.error("Error parsing SMILES:", error);
    return false;
  }
}
