import sys
import json
from rdkit import Chem
from rdkit.Geometry import Point3D

def main():
    if len(sys.argv) < 2:
        print("Missing JSON file path", file=sys.stderr)
        sys.exit(1)
        
    file_path = sys.argv[1]
    with open(file_path, 'r') as f:
        data = json.load(f)
        
    m = Chem.RWMol()
    id_map = {}
    
    # Create an empty conformer to store 2D coordinates
    conf = Chem.Conformer(len(data.get('atoms', [])))
    conf.Set3D(False)
    
    # Scale factor to convert pixels to Angstroms (approximate, usually ~30-40 pixels per Angstrom)
    scale = 1.0 / 40.0
    
    # 1. Add atoms
    for i, a in enumerate(data.get('atoms', [])):
        atom = Chem.Atom(a['element'])
        idx = m.AddAtom(atom)
        id_map[a['id']] = idx
        
        # Set 2D coordinates (invert Y because canvas is Y-down, chemistry is Y-up)
        # Default fallback to 0 if x/y are missing
        x = a.get('x', 0) * scale
        y = -a.get('y', 0) * scale 
        conf.SetAtomPosition(idx, Point3D(x, y, 0.0))
        
    # 2. Add bonds
    for b in data.get('bonds', []):
        src = id_map.get(b.get('source'))
        tgt = id_map.get(b.get('target'))
        if src is None or tgt is None:
            continue
            
        btype = Chem.BondType.SINGLE
        if b['type'] == 'DOUBLE':
            btype = Chem.BondType.DOUBLE
        elif b['type'] == 'TRIPLE':
            btype = Chem.BondType.TRIPLE
            
        idx = m.AddBond(src, tgt, btype)
        
        # Note: export_2d doesn't care much about 3D wedges, but we preserve it for rdkit semantics
        if b['type'] == 'WEDGE' or b['type'] == 'BOND_WEDGE':
            m.GetBondBetweenAtoms(src, tgt).SetBondDir(Chem.BondDir.BEGINWEDGE)
        elif b['type'] == 'HASH' or b['type'] == 'BOND_HASH':
            m.GetBondBetweenAtoms(src, tgt).SetBondDir(Chem.BondDir.BEGINDASH)

    try:
        m.AddConformer(conf)
        m.UpdatePropertyCache()
        Chem.SanitizeMol(m)
        
        sdf = Chem.MolToMolBlock(m)
        print(sdf)
    except Exception as e:
        print(f"Error generating 2D structure: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
