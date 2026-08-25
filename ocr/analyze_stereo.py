import sys
import json
from rdkit import Chem
from rdkit.Geometry import Point3D

def main():
    try:
        input_data = sys.stdin.read()
        data = json.loads(input_data)
    except Exception as e:
        print(json.dumps({"error": "Failed to read from stdin: " + str(e)}))
        sys.exit(1)
        
    m = Chem.RWMol()
    id_map = {}
    
    atoms = data.get('atoms', {})
    bonds = data.get('bonds', {})
    
    # Input might be a dict if it came directly from store
    atoms_list = list(atoms.values()) if isinstance(atoms, dict) else atoms
    bonds_list = list(bonds.values()) if isinstance(bonds, dict) else bonds
    
    if not atoms_list:
        print(json.dumps({"labels": []}))
        return
        
    conf = Chem.Conformer(len(atoms_list))
    
    # Build graph and conformer
    for i, a in enumerate(atoms_list):
        atom = Chem.Atom(a['element'])
        idx = m.AddAtom(atom)
        id_map[a['id']] = idx
        # We negate Y because SVG Y goes down, but chemical Y goes up
        conf.SetAtomPosition(idx, Point3D(a['x'], -a['y'], 0.0))
        
    for b in bonds_list:
        src = id_map.get(b.get('source'))
        tgt = id_map.get(b.get('target'))
        if src is None or tgt is None:
            continue
        
        btype = Chem.BondType.SINGLE
        if b['type'] == 'DOUBLE': btype = Chem.BondType.DOUBLE
        elif b['type'] == 'TRIPLE': btype = Chem.BondType.TRIPLE
        
        b_idx = m.AddBond(src, tgt, btype)
        bond = m.GetBondWithIdx(b_idx - 1)
        
        if b['type'] == 'WEDGE':
            bond.SetBondDir(Chem.BondDir.BEGINWEDGE)
        elif b['type'] == 'HASH':
            bond.SetBondDir(Chem.BondDir.BEGINDASH)
        
    m.AddConformer(conf)
    
    try:
        m.UpdatePropertyCache(strict=False)
        Chem.SanitizeMol(m, sanitizeOps=Chem.SANITIZE_ALL ^ Chem.SANITIZE_KEKULIZE ^ Chem.SANITIZE_SETAROMATICITY)
    except:
        pass
        
    try:
        # Roundtrip through MolBlock to ensure RDKit perceives it as a proper 2D drawing with wedges
        molblock = Chem.MolToMolBlock(m)
        m = Chem.MolFromMolBlock(molblock)
        
        # Detect E/Z from 2D coords
        Chem.DetectBondStereochemistry(m, -1)
        # Assign R/S
        Chem.AssignStereochemistry(m, force=True, cleanIt=True)
    except Exception as e:
        # Ignore RDKit exceptions and just return what we have
        pass
        
    labels = []
    
    # Extract Atom Stereo (R/S)
    for a in atoms_list:
        idx = id_map.get(a['id'])
        if idx is not None:
            atom = m.GetAtomWithIdx(idx)
            if atom.HasProp('_CIPCode'):
                code = atom.GetProp('_CIPCode')
                labels.append({
                    "id": f"stereo_atom_{a['id']}",
                    "type": "atom",
                    "targetId": a['id'],
                    "text": f"({code})",
                    "x": a['x'] + 15,
                    "y": a['y'] - 15
                })
                
    # Extract Bond Stereo (E/Z)
    for b in bonds_list:
        src = id_map.get(b.get('source'))
        tgt = id_map.get(b.get('target'))
        if src is not None and tgt is not None:
            bond = m.GetBondBetweenAtoms(src, tgt)
            if bond is not None:
                stereo = bond.GetStereo()
                if stereo == Chem.BondStereo.STEREOE:
                    code = "E"
                elif stereo == Chem.BondStereo.STEREOZ:
                    code = "Z"
                else:
                    code = None
                    
                if code:
                    # Place label at the midpoint of the bond
                    src_a = atoms[b['source']] if isinstance(atoms, dict) else next((x for x in atoms_list if x['id'] == b['source']), None)
                    tgt_a = atoms[b['target']] if isinstance(atoms, dict) else next((x for x in atoms_list if x['id'] == b['target']), None)
                    if src_a and tgt_a:
                        mx = (src_a['x'] + tgt_a['x']) / 2
                        my = (src_a['y'] + tgt_a['y']) / 2
                        labels.append({
                            "id": f"stereo_bond_{b['id']}",
                            "type": "bond",
                            "targetId": b['id'],
                            "text": f"({code})",
                            "x": mx,
                            "y": my - 15
                        })
                        
    print(json.dumps({"labels": labels}))

if __name__ == '__main__':
    main()
