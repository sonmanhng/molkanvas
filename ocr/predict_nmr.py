import sys
import json
import math
from rdkit import Chem
from rdkit.Chem import rdMolDescriptors

def generate_spectrum(peaks, max_ppm=12.0, min_ppm=0.0, resolution=0.01, line_width=0.03):
    """Generates continuous spectrum from discrete peaks using Lorentzian curves."""
    num_points = int((max_ppm - min_ppm) / resolution)
    x = [max_ppm - i * resolution for i in range(num_points)]
    y = [0.0] * num_points
    
    for peak in peaks:
        shift = peak['shift']
        intensity = peak['intensity']
        for i, current_x in enumerate(x):
            # Lorentzian line shape
            y[i] += intensity * (line_width / 2) / (math.pi * ((current_x - shift)**2 + (line_width / 2)**2))
            
    # Normalize
    max_y = max(y) if len(y) > 0 and max(y) > 0 else 1.0
    y = [val / max_y * 100 for val in y]
    
    return [{"x": round(x[i], 2), "y": round(y[i], 2)} for i in range(num_points)]

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing JSON input"}))
        sys.exit(1)

    file_path = sys.argv[1]
    with open(file_path, 'r') as f:
        data = json.load(f)

    atoms = data.get('atoms', [])
    bonds = data.get('bonds', [])
    
    if not atoms:
        print(json.dumps({"error": "Empty structure"}))
        sys.exit(0)

    m = Chem.RWMol()
    id_map = {}
    
    for a in atoms:
        idx = m.AddAtom(Chem.Atom(a['element']))
        id_map[a['id']] = idx
        
    for b in bonds:
        src = id_map.get(b.get('source'))
        tgt = id_map.get(b.get('target'))
        if src is None or tgt is None: continue
        
        btype = Chem.BondType.SINGLE
        if b['type'] == 'DOUBLE' or b['type'] == 'BOND_DOUBLE': btype = Chem.BondType.DOUBLE
        elif b['type'] == 'TRIPLE' or b['type'] == 'BOND_TRIPLE': btype = Chem.BondType.TRIPLE
        elif b['type'] == 'AROMATIC' or b['type'] == 'BOND_AROMATIC': btype = Chem.BondType.AROMATIC
        m.AddBond(src, tgt, btype)

    Chem.SanitizeMol(m, catchErrors=True)
    m = Chem.AddHs(m)

    peaks = []
    
    # Very simple heuristic 1H NMR predictor based on atom environment
    for atom in m.GetAtoms():
        if atom.GetSymbol() != 'H':
            continue
            
        neighbors = atom.GetNeighbors()
        if not neighbors: continue
            
        parent = neighbors[0]
        parent_sym = parent.GetSymbol()
        parent_idx = parent.GetIdx()
        
        shift = 1.0 # default aliphatic
        
        if parent_sym == 'C':
            is_aromatic = parent.GetIsAromatic()
            if is_aromatic:
                shift = 7.3
            else:
                hybridization = parent.GetHybridization()
                if hybridization == Chem.HybridizationType.SP2:
                    shift = 5.5
                elif hybridization == Chem.HybridizationType.SP:
                    shift = 2.5
                else:
                    has_o = any(n.GetSymbol() == 'O' for n in parent.GetNeighbors() if n.GetIdx() != atom.GetIdx())
                    has_n = any(n.GetSymbol() == 'N' for n in parent.GetNeighbors() if n.GetIdx() != atom.GetIdx())
                    if has_o: shift = 3.8
                    elif has_n: shift = 2.8
                    else:
                        carbon_neighbors = sum(1 for n in parent.GetNeighbors() if n.GetSymbol() == 'C')
                        if carbon_neighbors == 1: shift = 0.9 # CH3
                        elif carbon_neighbors == 2: shift = 1.3 # CH2
                        elif carbon_neighbors == 3: shift = 1.6 # CH
                        
            # Check for aldehyde
            if not is_aromatic and parent.GetHybridization() == Chem.HybridizationType.SP2:
                has_double_o = any(n.GetSymbol() == 'O' and m.GetBondBetweenAtoms(parent.GetIdx(), n.GetIdx()).GetBondType() == Chem.BondType.DOUBLE for n in parent.GetNeighbors())
                if has_double_o: shift = 9.8

        elif parent_sym == 'O':
            has_c_double_o = False
            for n in parent.GetNeighbors():
                if n.GetSymbol() == 'C':
                    if any(nn.GetSymbol() == 'O' and m.GetBondBetweenAtoms(n.GetIdx(), nn.GetIdx()).GetBondType() == Chem.BondType.DOUBLE for nn in n.GetNeighbors()):
                        has_c_double_o = True
            if has_c_double_o: shift = 11.5
            else: shift = 4.0 
                
        elif parent_sym == 'N':
            shift = 8.0 
            
        # Add a tiny bit of noise based on atom idx to simulate different environments slightly separating
        shift += (parent_idx % 10) * 0.05
        
        # Get the original frontend ID of the parent heavy atom so we can highlight it
        frontend_parent_id = None
        for a in atoms:
            if id_map.get(a['id']) == parent_idx:
                frontend_parent_id = a['id']
                break
                
        peaks.append({
            "shift": round(shift, 2),
            "intensity": 1.0,
            "parent_id": frontend_parent_id
        })

    # Group peaks by shift to simulate multiplets/integration
    grouped_peaks = []
    for peak in peaks:
        found = False
        for gp in grouped_peaks:
            if abs(gp['shift'] - peak['shift']) < 0.1 and gp['parent_id'] == peak['parent_id']:
                gp['intensity'] += 1.0
                found = True
                break
        if not found:
            grouped_peaks.append(peak)

    spectrum = generate_spectrum(grouped_peaks)
    
    num_h = sum(1 for a in m.GetAtoms() if a.GetSymbol() == 'H')
    
    print(json.dumps({
        "peaks": grouped_peaks,
        "spectrum": spectrum,
        "formula": Chem.rdMolDescriptors.CalcMolFormula(m),
        "total_protons": num_h
    }))

if __name__ == '__main__':
    main()
