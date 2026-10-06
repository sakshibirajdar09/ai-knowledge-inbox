import { knowledgeRepository, Chunk } from '../repositories/knowledge.repository';
import { logger } from '../utils/logger';

// Calculate cosine similarity between two vectors
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must be of the same length');
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const searchSimilarChunks = async (
  queryEmbedding: number[], 
  limit: number = 5,
  threshold: number = 0.65
): Promise<{ chunk: Chunk; similarity: number }[]> => {
  try {
    const allChunks = await knowledgeRepository.getAllChunks();
    
    // Parse embeddings and calculate similarity
    const chunksWithSimilarity = allChunks.map(chunk => {
      const chunkEmbedding = JSON.parse(chunk.embedding) as number[];
      const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
      return { chunk, similarity };
    });
    
    // Filter by threshold to drop irrelevant garbage chunks
    const filteredChunks = chunksWithSimilarity.filter(c => c.similarity >= threshold);
    
    // Sort by similarity descending
    filteredChunks.sort((a, b) => b.similarity - a.similarity);
    
    // Return top K
    return filteredChunks.slice(0, limit);
  } catch (error) {
    logger.error('Error during vector search', error);
    throw error;
  }
};
