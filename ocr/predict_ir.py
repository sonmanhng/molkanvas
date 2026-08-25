#!/usr/bin/env python3
"""
Predict IR spectrum from molecular graph using heuristic functional group detection.
Outputs a JSON spectrum with wavenumber (cm-1) vs transmittance.
"""
import sys, json, math, random
from rdkit import Chem
from rdkit.Chem import AllChem

def build_mol_from_graph(atoms, bonds):
    try:
        rw = Chem.RWMol()
        idx_map = {}
        for a in atoms:
            idx = rw.AddAtom(Chem.Atom(a['element']))
            idx_map[a['id']] = idx
        bond_type_map = {
            'SINGLE': Chem.BondType.SINGLE,
            'DOUBLE': Chem.BondType.DOUBLE,
            'TRIPLE': Chem.BondType.TRIPLE,
            'WEDGE':  Chem.BondType.SINGLE,
            'HASH':   Chem.BondType.SINGLE,
        }
        for b in bonds:
            s, t = idx_map.get(b['source']), idx_map.get(b['target'])
            if s is not None and t is not None:
                rw.AddBond(s, t, bond_type_map.get(b['type'], Chem.BondType.SINGLE))
        mol = rw.GetMol()
        Chem.SanitizeMol(mol, catchErrors=True)
        return mol
    except:
        return None

def detect_functional_groups(mol):
    """Returns list of (wavenumber_center, intensity, width, label)."""
    if mol is None:
        return []

    groups = []
    rng = random.Random(42)

    # --- SMARTS-based detection ---
    def has(smarts):
        try:
            return mol.HasSubstructMatch(Chem.MolFromSmarts(smarts))
        except:
            return False

    def count(smarts):
        try:
            return len(mol.GetSubstructMatches(Chem.MolFromSmarts(smarts)))
        except:
            return 0

    atoms = [a.GetSymbol() for a in mol.GetAtoms()]
    has_C = 'C' in atoms
    has_O = 'O' in atoms
    has_N = 'N' in atoms
    has_S = 'S' in atoms
    has_Cl = 'Cl' in atoms
    has_Br = 'Br' in atoms

    # --- Aliphatic C–H stretch (almost always present) ---
    if has(('[CH3,CH2,CH]')):
        groups.append((2960, 85, 30, 'C–H stretch (alkyl)'))  # asym
        groups.append((2870, 70, 25, 'C–H stretch (alkyl)'))  # sym

    # --- Aromatic C–H ---
    if has('c'):
        groups.append((3030, 60, 20, 'C–H stretch (aromatic)'))
        groups.append((1600, 70, 20, 'C=C stretch (aromatic)'))
        groups.append((1500, 65, 20, 'C=C stretch (aromatic)'))
        groups.append((750,  80, 40, 'C–H oop bend (aromatic)'))

    # --- Carboxylic acid O–H (very broad) ---
    if has('[CX3](=O)[OX2H]'):
        groups.append((3000, 90, 300, 'O–H stretch (COOH, broad)'))
        groups.append((1710, 95, 30, 'C=O stretch (carboxylic acid)'))
        groups.append((1320, 60, 25, 'C–O stretch (COOH)'))

    # --- Ester ---
    elif has('[CX3](=O)[OX2][CX4]'):
        groups.append((1735, 95, 25, 'C=O stretch (ester)'))
        groups.append((1250, 70, 30, 'C–O stretch (ester)'))

    # --- Aldehyde ---
    elif has('[CX3H](=O)'):
        groups.append((2820, 75, 15, 'C–H aldehyde'))
        groups.append((2720, 65, 15, 'C–H aldehyde (overtone)'))
        groups.append((1725, 95, 25, 'C=O stretch (aldehyde)'))

    # --- Ketone ---
    elif has('[CX3](=O)[#6]'):
        groups.append((1715, 95, 25, 'C=O stretch (ketone)'))

    # --- Amide ---
    if has('[CX3](=O)[NX3]'):
        groups.append((3350, 75, 40, 'N–H stretch (amide)'))
        groups.append((1650, 95, 30, 'C=O stretch (amide, Amide I)'))
        groups.append((1550, 70, 30, 'N–H bend (Amide II)'))

    # --- Primary amine ---
    elif has('[NX3H2]'):
        groups.append((3400, 70, 35, 'N–H stretch (prim. amine, asym)'))
        groups.append((3300, 65, 35, 'N–H stretch (prim. amine, sym)'))
        groups.append((1600, 55, 25, 'N–H bend'))

    # --- Secondary amine ---
    elif has('[NX3H1]'):
        groups.append((3300, 60, 30, 'N–H stretch (sec. amine)'))

    # --- Alcohol O–H ---
    if has('[OX2H]') and not has('[CX3](=O)[OX2H]'):
        groups.append((3350, 85, 60, 'O–H stretch (alcohol, broad)'))
        groups.append((1050, 80, 30, 'C–O stretch (alcohol)'))

    # --- Nitrile ---
    if has('[CX2]#[NX1]'):
        groups.append((2250, 90, 20, 'C≡N stretch (nitrile)'))

    # --- Alkyne ---
    if has('[CX2]#[CX2]'):
        groups.append((3300, 75, 15, '≡C–H stretch'))
        groups.append((2150, 80, 25, 'C≡C stretch'))

    # --- Alkene ---
    if has('[CX3]=[CX3]') and not has('c'):
        groups.append((3080, 55, 20, '=C–H stretch'))
        groups.append((1640, 75, 30, 'C=C stretch (alkene)'))
        groups.append((910, 70, 25, '=C–H oop bend'))

    # --- Nitro group ---
    if has('[N+](=O)[O-]') or has('[NX3](=O)=O'):
        groups.append((1550, 90, 30, 'N=O asym stretch (nitro)'))
        groups.append((1370, 85, 30, 'N=O sym stretch (nitro)'))

    # --- C–Cl ---
    if has_Cl:
        groups.append((750, 80, 40, 'C–Cl stretch'))

    # --- C–Br ---
    if has_Br:
        groups.append((600, 75, 50, 'C–Br stretch'))

    # --- C–S ---
    if has_S:
        groups.append((700, 55, 40, 'C–S stretch'))
        if has('[SX2H]'):
            groups.append((2580, 60, 20, 'S–H stretch'))

    # --- Fingerprint region (generic C–C skeleton) ---
    groups.append((1460, 50, 20, 'C–H bend (methyl/methylene)'))
    groups.append((1380, 45, 20, 'C–H bend (methyl sym)'))

    return groups

def build_ir_spectrum(groups, wn_min=400, wn_max=4000, n_points=1800):
    """Build a Gaussian-convolved IR spectrum (transmittance %)."""
    wns = [wn_min + (wn_max - wn_min) * i / (n_points - 1) for i in range(n_points)]
    absorbance = [0.0] * n_points

    for center, height, width, _ in groups:
        sigma = width / 2.355  # FWHM -> sigma
        h_norm = height / 100.0
        for i, wn in enumerate(wns):
            absorbance[i] += h_norm * math.exp(-0.5 * ((wn - center) / sigma) ** 2)

    # Transmittance: T = 100 * exp(-A)
    spectrum = []
    for i, wn in enumerate(wns):
        t = 100.0 * math.exp(-absorbance[i] * 2.5)
        t = max(0.0, min(100.0, t))
        spectrum.append({'x': round(wn, 1), 'y': round(t, 2)})

    return spectrum

def predict_13c(mol, atoms_data):
    """Predict 13C NMR chemical shifts."""
    if mol is None:
        return [], []

    peaks = []
    spectrum_pts = {}

    # Reference shifts per hybridization + substituents
    for atom in mol.GetAtoms():
        if atom.GetSymbol() != 'C':
            continue

        idx = atom.GetIdx()
        hyb = atom.GetHybridization()
        neighbors = [n.GetSymbol() for n in atom.GetNeighbors()]

        shift = 20.0  # default alkyl

        # Aromatic carbon
        if hyb == Chem.rdchem.HybridizationType.SP2:
            # Check if in ring
            if atom.IsInRing():
                shift = 128.0  # benzene-like
                # Substituent effects on aromatic
                for nb in atom.GetNeighbors():
                    sym = nb.GetSymbol()
                    if sym == 'O': shift += 30 if hyb == Chem.rdchem.HybridizationType.SP2 else 0
                    if sym == 'N': shift -= 15
                    if sym in ('Cl','Br','I'): shift += 5
            else:
                # Alkene C
                shift = 125.0
                for nb in atom.GetNeighbors():
                    if nb.GetSymbol() in ('O', 'N'): shift += 20

        elif hyb == Chem.rdchem.HybridizationType.SP:
            # Alkyne / nitrile
            for b in atom.GetBonds():
                if b.GetBondType() == Chem.BondType.TRIPLE:
                    other = b.GetOtherAtom(atom)
                    shift = 115.0 if other.GetSymbol() == 'N' else 70.0
                    break

        else:
            # SP3 alkyl
            shift = 20.0
            n_oxygen = sum(1 for n in atom.GetNeighbors() if n.GetSymbol() == 'O')
            n_nitrogen = sum(1 for n in atom.GetNeighbors() if n.GetSymbol() == 'N')
            n_carbon = sum(1 for n in atom.GetNeighbors() if n.GetSymbol() == 'C')

            # Carbonyl
            for b in atom.GetBonds():
                if b.GetBondType() == Chem.BondType.DOUBLE:
                    other = b.GetOtherAtom(atom)
                    if other.GetSymbol() == 'O':
                        shift = 170.0  # ester/acid/amide
                        for nb in atom.GetNeighbors():
                            if nb.GetSymbol() == 'C' and not any(
                                b2.GetBondType() == Chem.BondType.DOUBLE
                                for b2 in nb.GetBonds()
                            ):
                                shift = 200.0  # ketone/aldehyde
                        break

            if shift == 20.0:
                shift += n_oxygen * 50  # C–O very deshielded
                shift += n_nitrogen * 20
                shift += n_carbon * 5   # branching
                # Noise for realism
                shift += (hash(str(idx)) % 10) - 5

        # Clamp
        shift = max(0, min(220, shift))

        # Find the original atom id
        orig_id = None
        for a_data in atoms_data:
            if a_data['element'] == 'C':
                # Use index order (approximate)
                break
        # Use atom index as proxy
        parent_id = atoms_data[idx]['id'] if idx < len(atoms_data) else None

        peaks.append({'shift': round(shift, 1), 'parent_id': parent_id})

    # Build spectrum: stick plot convolved with Lorentzian
    if not peaks:
        return [], []

    wn_min, wn_max = 0, 220
    n_pts = 440
    xs = [wn_min + (wn_max - wn_min) * i / (n_pts - 1) for i in range(n_pts)]
    ys = [0.0] * n_pts
    for p in peaks:
        for i, x in enumerate(xs):
            gamma = 0.8
            ys[i] += 100 / (1 + ((x - p['shift']) / gamma) ** 2)

    # Normalize
    max_y = max(ys) if ys else 1.0
    spectrum = [{'x': round(xs[i], 2), 'y': round(ys[i] / max_y * 100, 2)} for i in range(n_pts)]

    return spectrum, peaks

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No input file'}))
        return

    mode = sys.argv[2] if len(sys.argv) > 2 else '1H'  # '1H', '13C', 'IR'

    with open(sys.argv[1]) as f:
        data = json.load(f)

    atoms = data.get('atoms', [])
    bonds = data.get('bonds', [])
    mol = build_mol_from_graph(atoms, bonds)

    formula = ''
    if mol:
        from rdkit.Chem import rdMolDescriptors
        formula = rdMolDescriptors.CalcMolFormula(mol)

    if mode == 'IR':
        groups = detect_functional_groups(mol)
        spectrum = build_ir_spectrum(groups)
        band_list = [{'wavenumber': g[0], 'intensity': g[1], 'label': g[3]} for g in groups]
        print(json.dumps({
            'mode': 'IR',
            'formula': formula,
            'spectrum': spectrum,
            'bands': sorted(band_list, key=lambda x: -x['intensity'])
        }))

    elif mode == '13C':
        spectrum, peaks = predict_13c(mol, atoms)
        print(json.dumps({
            'mode': '13C',
            'formula': formula,
            'spectrum': spectrum,
            'peaks': peaks
        }))

if __name__ == '__main__':
    main()
