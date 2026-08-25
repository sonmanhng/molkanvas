import json
from rdkit import Chem

m = Chem.RWMol()
a1 = m.AddAtom(Chem.Atom('C'))
a2 = m.AddAtom(Chem.Atom('C'))
a3 = m.AddAtom(Chem.Atom('C'))
m.AddBond(0, 1, Chem.BondType.DOUBLE)
m.AddBond(0, 2, Chem.BondType.DOUBLE)
m.AddBond(0, m.AddAtom(Chem.Atom('C')), Chem.BondType.DOUBLE)
# C0 now has 3 double bonds = 6 valence

m.UpdatePropertyCache(strict=False)
try:
    Chem.SanitizeMol(m)
except Exception as e:
    print("Strict Sanitize failed:", e)

# Lenient
Chem.SanitizeMol(m, sanitizeOps=Chem.SANITIZE_ALL ^ Chem.SANITIZE_PROPERTIES ^ Chem.SANITIZE_KEKULIZE ^ Chem.SANITIZE_SETAROMATICITY, catchErrors=True)
print("Lenient Sanitize ok")
try:
    smiles = Chem.MolToSmiles(m)
    print("SMILES:", smiles)
except Exception as e:
    print("MolToSmiles failed:", e)
