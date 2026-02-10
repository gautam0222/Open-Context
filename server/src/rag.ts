import OpenAI from "openai";
import { searchSimilarChunks, SearchResult } from './search';
import { getDocumentById } from './database';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  reasoning_details?: any;
}

export interface ChatSource {
  documentId: string;
  documentTitle: string;
  chunkContent: string;
  similarity: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  model: string;
  reasoning?: string;
}

/**
 * RAG: Retrieve relevant chunks and generate answer using OpenRouter
 */
export async function chatWithContext(
  query: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  console.log(`💬 Chat query: "${query}"`);

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your-openrouter-key-here') {
    throw new Error('OPENROUTER_API_KEY not set in .env file');
  }

  // Step 1: Search for relevant chunks
  const searchResults = await searchSimilarChunks(query, 5);

  if (searchResults.length === 0) {
    return {
      answer: "I couldn't find any relevant information in your captured documents about that topic. Try capturing some articles related to your question first!",
      sources: [],
      model: 'arcee-ai/trinity-large-preview:free',
    };
  }

  // Step 2: Build context from chunks
  const context = searchResults
    .map((result: SearchResult, idx: number) => {
      const doc = getDocumentById(result.documentId);
      return `[Document ${idx + 1}: ${doc?.title || 'Untitled'}]\n${result.content}`;
    })
    .join('\n\n---\n\n');

  console.log(`📚 Using ${searchResults.length} relevant chunks`);

  // Step 3: Build system prompt
  const systemPrompt = `You are a helpful AI assistant that answers questions based ONLY on the user's captured documents.

CRITICAL RULES:
- Answer ONLY using information from the provided documents below
- If the documents don't contain the answer, say so clearly
- Cite which document number you're referencing (e.g., "According to Document 1...")
- Be concise but thorough
- If documents contradict each other, mention it
- Don't make up information or use external knowledge

Here are the relevant documents:

${context}`;

  // Step 4: Build messages array
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: systemPrompt + '\n\nNow answer this question: ' + query,
    },
    ...conversationHistory,
  ];

  // Step 5: Call OpenRouter API
  try {
    console.log('🤖 Calling OpenRouter API...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Open Context',
      },
      body: JSON.stringify({
        model: 'arcee-ai/trinity-large-preview:free',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          ...(msg.reasoning_details && { reasoning_details: msg.reasoning_details }),
        })),
        reasoning: { enabled: true },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.choices || result.choices.length === 0) {
      throw new Error('No response from OpenRouter API');
    }

    const assistantMessage = result.choices[0].message;
    const answer = assistantMessage.content || "I couldn't generate a response.";
    const reasoning = assistantMessage.reasoning_details?.reasoning || null;

    console.log('✅ OpenRouter response received');
    if (reasoning) {
      console.log('🧠 Reasoning used:', reasoning.substring(0, 100) + '...');
    }

    // Step 6: Format sources
    const sources: ChatSource[] = searchResults.map((result: SearchResult) => {
      const doc = getDocumentById(result.documentId);
      return {
        documentId: result.documentId,
        documentTitle: doc?.title || 'Untitled',
        chunkContent: result.content.substring(0, 200) + '...',
        similarity: result.similarity,
      };
    });

    return {
      answer,
      sources,
      model: 'arcee-ai/trinity-large-preview:free',
      reasoning: reasoning || undefined,
    };
  } catch (error) {
    console.error('❌ OpenRouter error:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to generate answer. Make sure OPENROUTER_API_KEY is set in your .env file.'
    );
  }
}

export default {
  chatWithContext,
};