import { generateEmbedding } from './embedding.service';
import { searchSimilarChunks } from './vector.service';
import { generateAnswerStream } from './llm.service';
import { knowledgeRepository } from '../repositories/knowledge.repository';
import { logger } from '../utils/logger';

export const queryKnowledgeStream = async (question: string) => {
  try {
    // 1. Generate question embedding
    const questionEmbedding = await generateEmbedding(question);
    
    // 2. Search for relevant chunks
    const topChunks = await searchSimilarChunks(questionEmbedding, 15);
    
    if (topChunks.length === 0) {
      return {
        stream: null,
        sources: []
      };
    }
    
    // 3. Get item titles for sources
    const allItems = await knowledgeRepository.getAllItems();
    const itemMap = new Map(allItems.map(item => [item.id, item]));
    
    // 4. Build context and format sources
    const sources = topChunks.map((match, index) => {
      const item = itemMap.get(match.chunk.item_id);
      return {
        citation_id: index + 1,
        itemId: match.chunk.item_id,
        title: item?.title || 'Unknown Source',
        snippet: match.chunk.content,
        similarity: match.similarity,
        sourceUrl: item?.source_url
      };
    });

    const context = sources.map(source => 
      `[Source ${source.citation_id}: ${source.title}]\n${source.snippet}`
    ).join('\n\n');
    
    // 5. Query LLM
    const stream = await generateAnswerStream(question, context);
    
    return {
      stream,
      sources
    };
  } catch (error) {
    logger.error('Failed to query knowledge', error);
    throw error;
  }
};
