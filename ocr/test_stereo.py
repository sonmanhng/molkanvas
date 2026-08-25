import json
from rdkit import Chem
from rdkit.Geometry import Point3D

data = {
    "atoms": {
        "a1": {"id": "a1", "x": 100, "y": 100, "element": "C"},
        "a2": {"id": "a2", "x": 100, "y": 50, "element": "C"},
        "a3": {"id": "a3", "x": 50, "y": 120, "element": "C"},
        "a4": {"id": "a4", "x": 150, "y": 120, "element": "C"},
        "a5": {"id": "a5", "x": 100, "y": 150, "element": "O"}
    },
    "bonds": {
        "b1": {"id": "b1", "source": "a1", "target": "a2", "type": "SINGLE"},
        "b2": {"id": "b2", "source": "a1", "target": "a3", "type": "SINGLE"},
        "b3": {"id": "b3", "source": "a1", "target": "a4", "type": "WEDGE"},
        "b4": {"id": "b4", "source": "a1", "target": "a5", "type": "HASH"}
    }
}

m = Chem.RWMol()
id_map = {}
atoms_list = list(data["atoms"].values())
bonds_list = list(data["bonds"].values())

conf = Chem.Conformer(len(atoms_list))

for i, a in enumerate(atoms_list):
    atom = Chem.Atom(a['element'])
    idx = m.AddAtom(atom)
    id_map[a['id']] = idx
    conf.SetAtomPosition(idx, Point3D(a['x'], -a['y'], 0.0))
    
for b in bonds_list:
    src = id_map.get(b['source'])
    tgt = id_map.get(b['target'])
    
    btype = Chem.BondType.SINGLE
    if b['type'] == 'DOUBLE': btype = Chem.BondType.DOUBLE
    elif b['type'] == 'TRIPLE': btype = Chem.BondType.TRIPLE
    
    bond_idx = m.AddBond(src, tgt, btype)
    bond = m.GetBondWithIdx(bond_idx - 1)
    
    if b['type'] == 'WEDGE':
        bond.SetBondDir(Chem.BondDir.BEGINWEDGE)
    elif b['type'] == 'HASH':
        bond.SetBondDir(Chem.BondDir.BEGINDASH)

m.AddConformer(conf)
Chem.SanitizeMol(m)

Chem.AssignStereochemistry(m, force=True, cleanIt=True)

for atom in m.GetAtoms():
    if atom.HasProp('_CIPCode'):
        print(f"Atom {atom.GetIdx()} is {atom.GetProp('_CIPCode')}")
