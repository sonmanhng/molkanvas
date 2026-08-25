import json
from rdkit import Chem
from rdkit.Geometry import Point3D

data = {
    "atoms": {
        "a1": {"id": "a1", "x": 0, "y": 0, "element": "C"},
        "a2": {"id": "a2", "x": 0, "y": 150, "element": "F"},
        "a3": {"id": "a3", "x": 150, "y": 0, "element": "C"},
        "a4": {"id": "a4", "x": -150, "y": 0, "element": "O"},
        "a5": {"id": "a5", "x": 0, "y": -150, "element": "Cl"}
    },
    "bonds": {
        "b1": {"id": "b1", "source": "a1", "target": "a2", "type": "SINGLE"},
        "b2": {"id": "b2", "source": "a1", "target": "a3", "type": "SINGLE"},
        "b3": {"id": "b3", "source": "a1", "target": "a4", "type": "SINGLE"},
        "b4": {"id": "b4", "source": "a1", "target": "a5", "type": "WEDGE"}
    }
}

m = Chem.RWMol()
id_map = {}
for a in data["atoms"].values():
    idx = m.AddAtom(Chem.Atom(a['element']))
    id_map[a['id']] = idx

conf = Chem.Conformer(len(data["atoms"]))
conf.Set3D(False)
for a in data["atoms"].values():
    idx = id_map[a['id']]
    conf.SetAtomPosition(idx, Point3D(a['x'], -a['y'], 0.0))

for b in data["bonds"].values():
    src = id_map[b['source']]
    tgt = id_map[b['target']]
    b_idx = m.AddBond(src, tgt, Chem.BondType.SINGLE)
    bond = m.GetBondWithIdx(b_idx - 1)
    if b['type'] == 'WEDGE':
        bond.SetBondDir(Chem.BondDir.BEGINWEDGE)
    elif b['type'] == 'HASH':
        bond.SetBondDir(Chem.BondDir.BEGINDASH)

m.AddConformer(conf)
Chem.SanitizeMol(m)
# Let's see if AssignStereochemistry works without MolBlock
Chem.AssignStereochemistry(m, force=True, cleanIt=True)
for a in m.GetAtoms():
    if a.HasProp('_CIPCode'):
        print(f"Direct: Atom {a.GetIdx()} {a.GetSymbol()} is {a.GetProp('_CIPCode')}")

# Save as mol block and read back
molblock = Chem.MolToMolBlock(m)
m2 = Chem.MolFromMolBlock(molblock)
Chem.AssignStereochemistry(m2, force=True, cleanIt=True)
for a in m2.GetAtoms():
    if a.HasProp('_CIPCode'):
        print(f"From MolBlock: Atom {a.GetIdx()} {a.GetSymbol()} is {a.GetProp('_CIPCode')}")
