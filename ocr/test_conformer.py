from rdkit import Chem
from rdkit.Chem import AllChem

smiles = "CC1=CC(=O)C=C(C)C1"
m = Chem.AddHs(Chem.MolFromSmiles(smiles))
res = AllChem.EmbedMultipleConfs(m, numConfs=10, randomSeed=42, useExpTorsionAnglePrefs=True, useBasicKnowledge=True)
opt_res = AllChem.MMFFOptimizeMoleculeConfs(m, maxIters=500)

for conf_id, opt in enumerate(opt_res):
    not_converged, energy = opt
    print(f"Conf {conf_id}: Energy = {energy}")
