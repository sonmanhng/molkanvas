import sys
import json
from rdkit import Chem
from rdkit.Chem import AllChem

def main():
    if len(sys.argv) < 2:
        print("Missing JSON file path", file=sys.stderr)
        sys.exit(1)
        
    file_path = sys.argv[1]
    with open(file_path, 'r') as f:
        data = json.load(f)
        
    m = Chem.RWMol()
    id_map = {}
    
    # 1. Add atoms
    for a in data.get('atoms', []):
        atom = Chem.Atom(a['element'])
        idx = m.AddAtom(atom)
        id_map[a['id']] = idx
        
    # 2. Add bonds
    for b in data.get('bonds', []):
        src = id_map.get(b.get('source'))
        tgt = id_map.get(b.get('target'))
        if src is None or tgt is None:
            continue
            
        btype = Chem.BondType.SINGLE
        if b['type'] == 'DOUBLE' or b['type'] == 'BOND_DOUBLE':
            btype = Chem.BondType.DOUBLE
        elif b['type'] == 'TRIPLE' or b['type'] == 'BOND_TRIPLE':
            btype = Chem.BondType.TRIPLE
        elif b['type'] == 'AROMATIC' or b['type'] == 'BOND_AROMATIC':
            btype = Chem.BondType.AROMATIC
            
        idx = m.AddBond(src, tgt, btype)
        
        # Optional: set stereo for wedge/hash
        if b['type'] == 'WEDGE' or b['type'] == 'BOND_WEDGE':
            m.GetBondBetweenAtoms(src, tgt).SetBondDir(Chem.BondDir.BEGINWEDGE)
        elif b['type'] == 'HASH' or b['type'] == 'BOND_HASH':
            m.GetBondBetweenAtoms(src, tgt).SetBondDir(Chem.BondDir.BEGINDASH)

    try:
        m.UpdatePropertyCache()
        Chem.SanitizeMol(m)
        
        m2 = Chem.AddHs(m)
        
        # Try standard ETKDGv3 first
        res = AllChem.EmbedMolecule(m2, AllChem.ETKDGv3())
        
        # Fallback for large/complex molecules (like peptides)
        if res == -1:
            ps = AllChem.ETKDGv2()
            ps.useRandomCoords = True
            ps.maxIterations = 1000
            res = AllChem.EmbedMolecule(m2, ps)
            
        # Final fallback
        if res == -1:
            res = AllChem.EmbedMolecule(m2, useRandomCoords=True, maxAttempts=5000)
            
        if res == -1:
            raise ValueError("RDKit failed to generate 3D coordinates for this complex molecule.")
            
        # Optimize structure using MMFF94 force field if possible, else fallback to UFF
        try:
            if AllChem.MMFFHasAllMoleculeParams(m2):
                AllChem.MMFFOptimizeMolecule(m2, maxIters=1000)
            else:
                AllChem.UFFOptimizeMolecule(m2, maxIters=1000)
        except Exception as opt_err:
            print(f"Optimization failed: {str(opt_err)}", file=sys.stderr)
            pass
        
        sdf = Chem.MolToMolBlock(m2)
        print(sdf)
    except Exception as e:
        print(f"Error generating 3D structure: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
