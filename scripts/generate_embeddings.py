import sys
import json
from sentence_transformers import SentenceTransformer
import numpy as np

# Load the model (this will download it first time, ~80MB)
print("Loading embedding model...", file=sys.stderr)
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded!", file=sys.stderr)

def generate_embedding(text):
    """Generate embedding for a single text"""
    embedding = model.encode(text, convert_to_tensor=False)
    return embedding.tolist()

def generate_embeddings_batch(texts):
    """Generate embeddings for multiple texts"""
    
    # Ensure texts is a list
    if not isinstance(texts, list):
        raise ValueError("texts must be a list of strings")

    # Clean and validate inputs
    cleaned_texts = []
    for t in texts:
        if t is None:
            cleaned_texts.append("")
        elif not isinstance(t, str):
            cleaned_texts.append(str(t))
        else:
            cleaned_texts.append(t.strip())

    embeddings = model.encode(
        cleaned_texts,
        convert_to_tensor=False,
        show_progress_bar=True
    )
    return embeddings.tolist()


if __name__ == "__main__":
    # Read input from stdin
    input_data = sys.stdin.read()
    
    try:
        data = json.loads(input_data)
        
        if data.get('type') == 'single':
            # Single text embedding
            text = data.get('text', '')
            embedding = generate_embedding(text)
            result = {
                'success': True,
                'embedding': embedding,
                'dimension': len(embedding)
            }
            print(json.dumps(result))
            
        elif data.get('type') == 'batch':
            texts = data.get('texts', [])

            if not isinstance(texts, list):
                raise ValueError("Batch input must be a list")

            print(f"Generating embeddings for {len(texts)} texts...", file=sys.stderr)

            embeddings = generate_embeddings_batch(texts)

            result = {
                'success': True,
                'embeddings': embeddings,
                'count': len(embeddings),
                'dimension': len(embeddings[0]) if embeddings else 0
            }

            print(json.dumps(result))
        else:
            result = {
                'success': False,
                'error': 'Invalid type. Use "single" or "batch"'
            }
            print(json.dumps(result))
            
    except Exception as e:
        result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(result), file=sys.stderr)
        sys.exit(1)