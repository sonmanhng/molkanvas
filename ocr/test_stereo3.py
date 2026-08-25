import json
from rdkit import Chem
from rdkit.Geometry import Point3D

m = Chem.RWMol()
c1 = m.AddAtom(Chem.Atom(6))
c2 = m.AddAtom(Chem.Atom(6)) # chiral center
c3 = m.AddAtom(Chem.Atom(6))
o1 = m.AddAtom(Chem.Atom(8))
cl = m.AddAtom(Chem.Atom(17))

m.AddBond(c1, c2, Chem.BondType.SINGLE)
m.AddBond(c2, c3, Chem.BondType.SINGLE)
m.AddBond(c2, o1, Chem.BondType.SINGLE)
b_idx = m.AddBond(c2, cl, Chem.BondType.SINGLE)
b = m.GetBondWithIdx(b_idx - 1)
b.SetBondDir(Chem.BondDir.BEGINWEDGE)

conf = Chem.Conformer(m.GetNumAtoms())
conf.SetAtomPosition(c1, Point3D(0, 1.5, 0))
conf.SetAtomPosition(c2, Point3D(0, 0, 0))
conf.SetAtomPosition(c3, Point3D(0, -1.5, 0))
conf.SetAtomPosition(o1, Point3D(-1.5, 0, 0))
conf.SetAtomPosition(cl, Point3D(1.5, 0, 0))
m.AddConformer(conf)

Chem.SanitizeMol(m)
Chem.AssignStereochemistry(m, force=True, cleanIt=True)
Chem.AssignStereochemistryFrom3D(m)

for a in m.GetAtoms():
    if a.HasProp('_CIPCode'):
        print(f"Atom {a.GetIdx()} {a.GetSymbol()} is {a.GetProp('_CIPCode')}")
