import sys
import os

# Suppress TensorFlow logging to avoid polluting stdout
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

def main():
    if len(sys.argv) < 2:
        print("Error: Missing image file path", file=sys.stderr)
        sys.exit(1)
        
    image_path = sys.argv[1]
    
    try:
        from DECIMER import predict_SMILES
        
        # predict_SMILES returns a SMILES string
        smiles = predict_SMILES(image_path)
        print(smiles)
    except ImportError:
        print("Error: DECIMER package not installed. Please run 'pip install DECIMER tensorflow'", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
