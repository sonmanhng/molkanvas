import json
from rdkit import Chem
from rdkit.Chem import rdDepictor
from rdkit.Geometry import Point3D

m = Chem.MolFromSmiles("C[C@H](O)Cl")
rdDepictor.Compute2DCoords(m)
for bond in m.GetBonds():
    print(f"Bond {bond.GetIdx()} {bond.GetBondType()} Dir: {bond.GetBondDir()}")
    
Chem.AssignStereochemistry(m, force=True, cleanIt=True)
for a in m.GetAtoms():
    if a.HasProp('_CIPCode'):
        print(f"Atom {a.GetIdx()} {a.GetSymbol()} is {a.GetProp('_CIPCode')}")
