# Python NLP Scripts

This directory contains Python scripts for NLP and embedding tasks.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Scripts

### Phase 1 (Coming Soon):
- `embeddings.py` - Generate text embeddings using sentence-transformers
- `extract_content.py` - Extract clean text from web pages
- `chunking.py` - Split text into chunks for embedding

### Phase 4 (Coming Soon):
- `concept_extraction.py` - Extract concepts using NER and keyword extraction
- `graph_builder.py` - Build knowledge graph from documents

## Usage

Scripts will be called from the Node.js server using child processes.

Example:
```python
python scripts/embeddings.py --text "Your text here"
```