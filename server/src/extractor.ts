import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';

export interface ExtractedContent {
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  byline: string | null;
  siteName: string | null;
  length: number;
  wordCount: number;
  url: string;
}

export interface ExtractionResult {
  success: boolean;
  data?: ExtractedContent;
  error?: string;
}

/**
 * Fetch and extract content from a URL
 */
export async function extractContent(url: string): Promise<ExtractionResult> {
  try {
    console.log('🌐 Fetching URL:', url);

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      // @ts-ignore - timeout is valid in node-fetch@2
      timeout: 10000,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();

    console.log('📄 Parsing HTML...');

    // Parse HTML with JSDOM
    const dom = new JSDOM(html, { url });

    // Extract metadata from meta tags
    const document = dom.window.document;
    const siteName = extractSiteName(document);

    // Use Readability to extract article content
    const reader = new Readability(document);
    const article = reader.parse();

    if (!article) {
      return {
        success: false,
        error: 'Could not extract readable content from page',
      };
    }

    console.log('✅ Content extracted successfully');

    // Calculate word count
    const safeTitle = article.title ?? '';
const safeContent = article.content ?? '';
const safeTextContent = article.textContent ?? '';
const safeExcerpt = article.excerpt ?? '';
const safeByline = article.byline ?? null;

const wordCount = countWords(safeTextContent);

return {
  success: true,
  data: {
    title: safeTitle,
    content: safeContent,
    textContent: safeTextContent,
    excerpt: safeExcerpt,
    byline: safeByline,
    siteName: siteName ?? null,
    length: article.length ?? 0,
    wordCount: wordCount,
    url: url,
  },
};

  } catch (error) {
    console.error('❌ Extraction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract site name from meta tags or domain
 */
function extractSiteName(document: Document): string | null {
  // Try og:site_name
  const ogSiteName = document.querySelector('meta[property="og:site_name"]');
  if (ogSiteName) {
    return ogSiteName.getAttribute('content');
  }

  // Try application-name
  const appName = document.querySelector('meta[name="application-name"]');
  if (appName) {
    return appName.getAttribute('content');
  }

  // Fallback to domain from URL
  try {
    const urlObj = new URL(document.URL);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

export default {
  extractContent,
};