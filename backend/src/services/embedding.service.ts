import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Switch to Gemini's highly optimized embedding model
    // This completely fixes the 502 Bad Gateway / Out Of Memory errors on Render
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error: any) {
    logger.error('Failed to generate embedding via Gemini', error);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
};
