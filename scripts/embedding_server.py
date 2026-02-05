from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import sys

app = Flask(__name__)
CORS(app)

# Load model on startup
print("🤖 Loading embedding model...", file=sys.stderr)
model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ Model loaded and ready!", file=sys.stderr)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'model': 'all-MiniLM-L6-v2'})

@app.route('/embed', methods=['POST'])
def embed():
    try:
        data = request.get_json()
        
        if 'text' in data:
            # Single embedding
            text = data['text']
            embedding = model.encode(text, convert_to_tensor=False)
            return jsonify({
                'success': True,
                'embedding': embedding.tolist(),
                'dimension': len(embedding)
            })
        
        elif 'texts' in data:
            # Batch embedding
            texts = data['texts']
            print(f"📊 Generating embeddings for {len(texts)} texts...", file=sys.stderr)
            embeddings = model.encode(texts, convert_to_tensor=False, show_progress_bar=False)
            print(f"✅ Generated {len(embeddings)} embeddings", file=sys.stderr)
            return jsonify({
                'success': True,
                'embeddings': embeddings.tolist(),
                'count': len(embeddings),
                'dimension': len(embeddings[0])
            })
        
        else:
            return jsonify({
                'success': False,
                'error': 'Missing "text" or "texts" field'
            }), 400
            
    except Exception as e:
        print(f"❌ Error: {str(e)}", file=sys.stderr)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting embedding server on http://localhost:5000", file=sys.stderr)
    app.run(host='0.0.0.0', port=5000, debug=False)