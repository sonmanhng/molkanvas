import sys
import json
from rdkit import Chem
from rdkit.Chem import rdDepictor

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing input file path"}))
        sys.exit(1)
        
    file_path = sys.argv[1]
    with open(file_path, 'r') as f:
        data = json.load(f)
        
    m = Chem.RWMol()
    id_map = {}
    
    atoms = data.get('atoms', [])
    bonds = data.get('bonds', [])
    
    if not atoms:
        print(json.dumps({"error": "Empty graph"}))
        return
        
    # Build graph
    for a in atoms:
        atom = Chem.Atom(a['element'])
        idx = m.AddAtom(atom)
        id_map[a['id']] = idx
        
    for b in bonds:
        src = id_map.get(b.get('source'))
        tgt = id_map.get(b.get('target'))
        if src is None or tgt is None:
            continue
        btype = Chem.BondType.SINGLE
        if b['type'] == 'DOUBLE': btype = Chem.BondType.DOUBLE
        elif b['type'] == 'TRIPLE': btype = Chem.BondType.TRIPLE
        m.AddBond(src, tgt, btype)
        
    try:
        m.UpdatePropertyCache(strict=False)
        Chem.SanitizeMol(m, sanitizeOps=Chem.SANITIZE_ALL ^ Chem.SANITIZE_KEKULIZE ^ Chem.SANITIZE_SETAROMATICITY)
    except:
        pass
        
    # Recompute coordinates
    rdDepictor.Compute2DCoords(m)
    
    SCALE = 50.0
    conf = m.GetConformer()
    
    # Update original atoms array
    for a in atoms:
        idx = id_map.get(a['id'])
        if idx is not None:
            pos = conf.GetAtomPosition(idx)
            a['x'] = float(pos.x) * SCALE
            a['y'] = float(-pos.y) * SCALE
            
    # Center the molecule
    min_x = min(a['x'] for a in atoms)
    max_x = max(a['x'] for a in atoms)
    min_y = min(a['y'] for a in atoms)
    max_y = max(a['y'] for a in atoms)
    
    center_x = (min_x + max_x) / 2
    center_y = (min_y + max_y) / 2
    
    offset_x = 400 - center_x
    offset_y = 300 - center_y
    
    atoms_dict = {}
    for a in atoms:
        a['x'] += offset_x
        a['y'] += offset_y
        atoms_dict[a['id']] = a
        
    # Convert bonds array to object
    bonds_dict = {b['id']: b for b in bonds}
        
    print(json.dumps({
        "atoms": atoms_dict,
        "bonds": bonds_dict
    }))

if __name__ == '__main__':
    main()
