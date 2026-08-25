from rdkit import Chem
from rdkit.Geometry import Point3D

m = Chem.RWMol()
c1 = m.AddAtom(Chem.Atom(6))
c2 = m.AddAtom(Chem.Atom(6)) 
c3 = m.AddAtom(Chem.Atom(6))

m.AddBond(c1, c2, Chem.BondType.SINGLE)
m.AddBond(c2, c3, Chem.BondType.SINGLE)

conf = Chem.Conformer(m.GetNumAtoms())
conf.Set3D(False)
conf.SetAtomPosition(c1, Point3D(0, 1.5, 0))
conf.SetAtomPosition(c2, Point3D(0, 0, 0))
conf.SetAtomPosition(c3, Point3D(0, -1.5, 0))
m.AddConformer(conf)

mb = Chem.MolToMolBlock(m)
m2 = Chem.MolFromMolBlock(mb)

for i in range(m.GetNumAtoms()):
    print(f"Original {i} -> New {m2.GetAtomWithIdx(i).GetSymbol()} {m2.GetAtomWithIdx(i).GetIdx()}")
