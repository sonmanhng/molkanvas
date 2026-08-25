import sys
import json
import uuid
from rdkit import Chem
from rdkit.Chem import rdDepictor

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing input file path"}))
        sys.exit(1)
        
    file_path = sys.argv[1]
    with open(file_path, 'r') as f:
        smiles = f.read().strip()
        
    m = Chem.MolFromSmiles(smiles)
    if not m:
        print(json.dumps({"error": "Invalid SMILES string"}))
        sys.exit(1)
        
    # Generate 2D Coordinates
    rdDepictor.Compute2DCoords(m)
    
    atoms_dict = {}
    bonds_dict = {}
    
    # Scale coordinates appropriately for UI (RDKit coords are around 1.5 distance)
    # UI uses much larger scale (e.g. 50-100 pixels per bond)
    SCALE = 50.0
    
    # Process atoms
    idx_to_id = {}
    conf = m.GetConformer()
    for atom in m.GetAtoms():
        idx = atom.GetIdx()
        pos = conf.GetAtomPosition(idx)
        # RDKit Y is flipped compared to canvas
        x = float(pos.x) * SCALE
        y = float(-pos.y) * SCALE 
        
        atom_id = str(uuid.uuid4())
        idx_to_id[idx] = atom_id
        
        atoms_dict[atom_id] = {
            "id": atom_id,
            "element": atom.GetSymbol(),
            "x": x,
            "y": y
        }
        
    # Process bonds
    for bond in m.GetBonds():
        src_id = idx_to_id[bond.GetBeginAtomIdx()]
        tgt_id = idx_to_id[bond.GetEndAtomIdx()]
        
        btype = "SINGLE"
        t = bond.GetBondType()
        if t == Chem.BondType.DOUBLE:
            btype = "DOUBLE"
        elif t == Chem.BondType.TRIPLE:
            btype = "TRIPLE"
            
        bond_id = str(uuid.uuid4())
        bonds_dict[bond_id] = {
            "id": bond_id,
            "source": src_id,
            "target": tgt_id,
            "type": btype
        }
        
    # Center the molecule
    if atoms_dict:
        min_x = min(a['x'] for a in atoms_dict.values())
        max_x = max(a['x'] for a in atoms_dict.values())
        min_y = min(a['y'] for a in atoms_dict.values())
        max_y = max(a['y'] for a in atoms_dict.values())
        
        center_x = (min_x + max_x) / 2
        center_y = (min_y + max_y) / 2
        
        # Move to (400, 300) assuming a general canvas size
        offset_x = 400 - center_x
        offset_y = 300 - center_y
        
        for a in atoms_dict.values():
            a['x'] += offset_x
            a['y'] += offset_y
            
    print(json.dumps({
        "atoms": atoms_dict,
        "bonds": bonds_dict
    }))

if __name__ == '__main__':
    main()
