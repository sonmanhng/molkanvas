import sys
import json
from rdkit import Chem
from rdkit.Chem import Descriptors
from rdkit.Chem import Lipinski

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing JSON file path"}))
        sys.exit(1)
        
    file_path = sys.argv[1]
    with open(file_path, 'r') as f:
        data = json.load(f)
        
    m = Chem.RWMol()
    id_map = {}
    
    atoms = data.get('atoms', [])
    bonds = data.get('bonds', [])
    
    if not atoms:
        # Empty graph
        print(json.dumps({
            "mw": 0,
            "logp": 0,
            "tpsa": 0,
            "hbd": 0,
            "hba": 0,
            "lipinski_violations": 0
        }))
        return

    # 1. Add atoms
    for a in atoms:
        atom = Chem.Atom(a['element'])
        idx = m.AddAtom(atom)
        id_map[a['id']] = idx
        
    # 2. Add bonds
    for b in bonds:
        src = id_map.get(b.get('source'))
        tgt = id_map.get(b.get('target'))
        if src is None or tgt is None:
            continue
            
        btype = Chem.BondType.SINGLE
        if b['type'] == 'DOUBLE':
            btype = Chem.BondType.DOUBLE
        elif b['type'] == 'TRIPLE':
            btype = Chem.BondType.TRIPLE
            
        m.AddBond(src, tgt, btype)

    try:
        m.UpdatePropertyCache(strict=False)
        
        # Try full sanitization first
        res = Chem.SanitizeMol(m, catchErrors=True)
        
        if res != Chem.SANITIZE_NONE:
            # If it fails (e.g. valence error), try a very lenient sanitization
            Chem.SanitizeMol(m, sanitizeOps=Chem.SANITIZE_ALL ^ Chem.SANITIZE_PROPERTIES ^ Chem.SANITIZE_KEKULIZE ^ Chem.SANITIZE_SETAROMATICITY, catchErrors=True)

        mw = Descriptors.ExactMolWt(m)
        logp = Descriptors.MolLogP(m)
        tpsa = Descriptors.TPSA(m)
        hbd = Lipinski.NumHDonors(m)
        hba = Lipinski.NumHAcceptors(m)
        
        # Lipinski Rule of 5 Violations
        # 1. MW <= 500
        # 2. LogP <= 5
        # 3. HBD <= 5
        # 4. HBA <= 10
        violations = 0
        if mw > 500: violations += 1
        if logp > 5: violations += 1
        if hbd > 5: violations += 1
        if hba > 10: violations += 1
        
        result = {
            "smiles": Chem.MolToSmiles(m),
            "mw": round(mw, 2),
            "logp": round(logp, 2),
            "tpsa": round(tpsa, 2),
            "hbd": hbd,
            "hba": hba,
            "lipinski_violations": violations
        }
        
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
