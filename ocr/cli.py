import sys
import importlib

import sys

def main():
    if len(sys.argv) < 2:
        print("Error: Missing command.", file=sys.stderr)
        sys.exit(1)
        
    command = sys.argv[1]
    
    # Shift sys.argv so that the module sees sys.argv[0] as its own script name
    sys.argv.pop(1)
    
    try:
        if command == 'worker':
            import worker as mod
        elif command == 'generate_3d':
            import generate_3d as mod
        elif command == 'calc_props':
            import calc_props as mod
        elif command == 'smiles_to_graph':
            import smiles_to_graph as mod
        elif command == 'clean_graph':
            import clean_graph as mod
        elif command == 'export_2d':
            import export_2d as mod
        elif command == 'predict_nmr':
            import predict_nmr as mod
        elif command == 'predict_ir':
            import predict_ir as mod
        elif command == 'conformer_analysis':
            import conformer_analysis as mod
        elif command == 'analyze_stereo':
            import analyze_stereo as mod
        elif command == 'bio_sequence':
            import bio_sequence as mod
        else:
            print(f"Error: Unknown command '{command}'", file=sys.stderr)
            sys.exit(1)
            
        # Call its main() function if it exists
        if hasattr(mod, 'main'):
            mod.main()
        else:
            print(f"Error: Module '{command}' does not have a main() function", file=sys.stderr)
            sys.exit(1)
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"CLI Execution Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
