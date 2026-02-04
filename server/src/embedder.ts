import { spawn } from 'child_process';
import path from 'path';

const PYTHON_SCRIPT = path.join(__dirname, '../../scripts/generate_embeddings.py');
const PYTHON_VENV = path.join(__dirname, '../../scripts/venv/Scripts/python.exe');

export interface EmbeddingResult {
  success: boolean;
  embedding?: number[];
  embeddings?: number[][];
  dimension?: number;
  error?: string;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  return new Promise((resolve, reject) => {
    const python = spawn(PYTHON_VENV, [PYTHON_SCRIPT]);

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
      // Log Python's stderr (progress messages)
      if (stderr.includes('Loading') || stderr.includes('Model')) {
        console.log(stderr.trim());
        stderr = '';
      }
    });

    python.on('close', (code) => {
      if (code !== 0) {
        console.error('Python stderr:', stderr);
        resolve({
          success: false,
          error: `Python process exited with code ${code}: ${stderr}`,
        });
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (error) {
        resolve({
          success: false,
          error: `Failed to parse Python output: ${error}`,
        });
      }
    });

    python.on('error', (error) => {
      resolve({
        success: false,
        error: `Failed to spawn Python: ${error.message}`,
      });
    });

    // Send input to Python
    const input = JSON.stringify({
      type: 'single',
      text: text,
    });
    python.stdin.write(input);
    python.stdin.end();
  });
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<EmbeddingResult> {
  return new Promise((resolve, reject) => {
    console.log(`🤖 Generating embeddings for ${texts.length} chunks...`);
    
    const python = spawn(PYTHON_VENV, [PYTHON_SCRIPT]);

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      const msg = data.toString();
      console.log('  ', msg.trim());
      stderr += msg;
    });

    python.on('close', (code) => {
      if (code !== 0) {
        console.error('Python stderr:', stderr);
        resolve({
          success: false,
          error: `Python process exited with code ${code}`,
        });
        return;
      }

      try {
        const result = JSON.parse(stdout);
        console.log(`✅ Generated ${result.count} embeddings (${result.dimension}D)`);
        resolve(result);
      } catch (error) {
        resolve({
          success: false,
          error: `Failed to parse Python output: ${error}`,
        });
      }
    });

    python.on('error', (error) => {
      resolve({
        success: false,
        error: `Failed to spawn Python: ${error.message}`,
      });
    });

    // Send input to Python
    const input = JSON.stringify({
      type: 'batch',
      texts: texts,
    });
    python.stdin.write(input);
    python.stdin.end();
  });
}

export default {
  generateEmbedding,
  generateEmbeddingsBatch,
};