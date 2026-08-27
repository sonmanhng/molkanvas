import sys
import json
import uuid
from rdkit import Chem
from rdkit.Chem import rdDepictor

def parse_sequence(seq, seq_type):
    seq = seq.strip()
    mol = None
    
    try:
        if seq_type == 'fasta':
            if not seq.startswith('>'):
                seq = ">seq\n" + seq
            mol = Chem.MolFromFASTA(seq)
        elif seq_type == 'helm':
            mol = Chem.MolFromHELM(seq)
        else:
            mol = Chem.MolFromSequence(seq)
            
        if mol is None:
            return {"error": "Failed to parse sequence."}
            
        rdDepictor.Compute2DCoords(mol)
        
        atoms_dict = {}
        bonds_dict = {}
        SCALE = 50.0
        
        idx_to_id = {}
        conf = mol.GetConformer()
        for atom in mol.GetAtoms():
            idx = atom.GetIdx()
            pos = conf.GetAtomPosition(idx)
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
            
        for bond in mol.GetBonds():
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
            
        if atoms_dict:
            min_x = min(a['x'] for a in atoms_dict.values())
            max_x = max(a['x'] for a in atoms_dict.values())
            min_y = min(a['y'] for a in atoms_dict.values())
            max_y = max(a['y'] for a in atoms_dict.values())
            
            center_x = (min_x + max_x) / 2
            center_y = (min_y + max_y) / 2
            
            offset_x = 400 - center_x
            offset_y = 300 - center_y
            
            for a in atoms_dict.values():
                a['x'] += offset_x
                a['y'] += offset_y
                
        return {"atoms": atoms_dict, "bonds": bonds_dict}
        
    except Exception as e:
        return {"error": str(e)}

def main():
    try:
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        seq = data.get('sequence', '')
        seq_type = data.get('type', 'peptide')
        
        result = parse_sequence(seq, seq_type)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
