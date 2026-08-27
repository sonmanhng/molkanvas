import sys
import json
from rdkit import Chem
from rdkit.Chem import AllChem

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing SMILES"}))
        sys.exit(1)
        
    smiles = sys.argv[1]
    
    try:
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            raise ValueError("Invalid SMILES")
            
        mol = Chem.AddHs(mol)
        
        # Generate conformers
        num_confs = 50
        res = AllChem.EmbedMultipleConfs(mol, numConfs=num_confs, pruneRmsThresh=0.5, randomSeed=42)
        
        if not res:
            raise ValueError("Could not generate conformers")
            
        # Optimize conformers
        try:
            if AllChem.MMFFHasAllMoleculeParams(mol):
                opt_res = AllChem.MMFFOptimizeMoleculeConfs(mol, maxIters=1000)
            else:
                opt_res = AllChem.UFFOptimizeMoleculeConfs(mol, maxIters=1000)
        except Exception as e:
            raise ValueError(f"Force field optimization failed: {str(e)}")

        conformers_data = []
        for i, conf_id in enumerate(res):
            not_converged, energy = opt_res[i]
            
            # Get SDF block for this conformer
            sdf_block = Chem.MolToMolBlock(mol, confId=conf_id)
            
            conformers_data.append({
                "id": conf_id,
                "energy": energy,
                "sdf": sdf_block
            })
            
        # Sort by energy
        conformers_data.sort(key=lambda x: x["energy"])
        
        # Calculate relative energy (kcal/mol)
        min_energy = conformers_data[0]["energy"]
        for conf in conformers_data:
            conf["rel_energy"] = conf["energy"] - min_energy
            
        print(json.dumps({"conformers": conformers_data}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
