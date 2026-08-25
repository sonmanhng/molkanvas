from rdkit import Chem
mol1 = Chem.MolFromFASTA(">seq\nATGC")
print("Without flavor:", mol1.GetNumAtoms())

mol2 = Chem.MolFromFASTA(">seq\nATGC", flavor=3)
print("DNA flavor:", mol2.GetNumAtoms())
