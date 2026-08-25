from rdkit import Chem
from rdkit.Chem import AllChem

# Test peptide
mol = Chem.MolFromSequence("Ala-Gly-Ser")
if mol:
    AllChem.Compute2DCoords(mol)
    print("Peptide Ala-Gly-Ser parsed successfully! Atoms:", mol.GetNumAtoms())

mol2 = Chem.MolFromFASTA(">seq\nAGS")
if mol2:
    AllChem.Compute2DCoords(mol2)
    print("FASTA parsed successfully! Atoms:", mol2.GetNumAtoms())
    
# Try DNA/RNA
# RDKit doesn't have direct MolFromDNAFASTA maybe?
try:
    mol3 = Chem.MolFromHELM("PEPTIDE1{A.G.S}$$$$")
    if mol3:
        print("HELM parsed successfully! Atoms:", mol3.GetNumAtoms())
except Exception as e:
    print("HELM error:", e)
