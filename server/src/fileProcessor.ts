import * as pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';

export interface ProcessedFile {
  title: string;
  content: string;
  excerpt: string;
  wordCount: number;
  fileType: string;
  fileName: string;
}

/**
 * Process PDF file - extract text
 */
export async function processPDF(buffer: Buffer, fileName: string): Promise<ProcessedFile> {
  try {
    console.log(`📄 Processing PDF: ${fileName}`);
    
    const data = await (pdfParse as any)(buffer);
    const content = data.text.trim();
    
    if (!content || content.length < 50) {
      // Might be a scanned PDF, try OCR
      console.log('⚠️ PDF appears to be scanned or has minimal text, trying OCR...');
      return await processPDFWithOCR(buffer, fileName);
    }

    const wordCount = content.split(/\s+/).length;
    const excerpt = content.substring(0, 300).trim() + '...';
    const title = fileName.replace('.pdf', '').replace(/[-_]/g, ' ');

    console.log(`✅ Extracted ${wordCount} words from PDF`);

    return {
      title,
      content,
      excerpt,
      wordCount,
      fileType: 'pdf',
      fileName,
    };
  } catch (error) {
    console.error('❌ PDF processing error:', error);
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process scanned PDF with OCR
 */
async function processPDFWithOCR(buffer: Buffer, fileName: string): Promise<ProcessedFile> {
  try {
    console.log('🔍 Running OCR on PDF...');
    
    const worker = await createWorker('eng');
    const { data } = await worker.recognize(buffer);
    await worker.terminate();

    const content = data.text.trim();
    const wordCount = content.split(/\s+/).length;
    const excerpt = content.substring(0, 300).trim() + '...';
    const title = fileName.replace('.pdf', '').replace(/[-_]/g, ' ');

    console.log(`✅ OCR extracted ${wordCount} words`);

    return {
      title,
      content,
      excerpt,
      wordCount,
      fileType: 'pdf-ocr',
      fileName,
    };
  } catch (error) {
    console.error('❌ OCR error:', error);
    throw new Error('OCR processing failed');
  }
}

/**
 * Process DOCX file - extract text
 */
export async function processDOCX(buffer: Buffer, fileName: string): Promise<ProcessedFile> {
  try {
    console.log(`📝 Processing DOCX: ${fileName}`);
    
    const result = await mammoth.extractRawText({ buffer });
    const content = result.value.trim();

    if (!content) {
      throw new Error('No text content found in DOCX');
    }

    const wordCount = content.split(/\s+/).length;
    const excerpt = content.substring(0, 300).trim() + '...';
    const title = fileName.replace('.docx', '').replace(/[-_]/g, ' ');

    console.log(`✅ Extracted ${wordCount} words from DOCX`);

    return {
      title,
      content,
      excerpt,
      wordCount,
      fileType: 'docx',
      fileName,
    };
  } catch (error) {
    console.error('❌ DOCX processing error:', error);
    throw new Error(`Failed to process DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process plain text file
 */
export function processTextFile(buffer: Buffer, fileName: string): ProcessedFile {
  try {
    console.log(`📃 Processing text file: ${fileName}`);
    
    const content = buffer.toString('utf-8').trim();

    if (!content) {
      throw new Error('File is empty');
    }

    const wordCount = content.split(/\s+/).length;
    const excerpt = content.substring(0, 300).trim() + '...';
    
    // Try to extract title from first line or use filename
    const firstLine = content.split('\n')[0].trim();
    const title = firstLine.length > 0 && firstLine.length < 100 
      ? firstLine 
      : fileName.replace(/\.(txt|md)$/, '').replace(/[-_]/g, ' ');

    console.log(`✅ Processed ${wordCount} words from text file`);

    return {
      title,
      content,
      excerpt,
      wordCount,
      fileType: fileName.endsWith('.md') ? 'markdown' : 'text',
      fileName,
    };
  } catch (error) {
    console.error('❌ Text file processing error:', error);
    throw new Error(`Failed to process text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Detect file type and process accordingly
 */
export async function processFile(buffer: Buffer, fileName: string): Promise<ProcessedFile> {
  const fileExt = fileName.toLowerCase().split('.').pop();

  switch (fileExt) {
    case 'pdf':
      return await processPDF(buffer, fileName);
    
    case 'docx':
      return await processDOCX(buffer, fileName);
    
    case 'txt':
    case 'md':
      return processTextFile(buffer, fileName);
    
    default:
      throw new Error(`Unsupported file type: ${fileExt}`);
  }
}

export default {
  processPDF,
  processDOCX,
  processTextFile,
  processFile,
};