import { randomUUID } from 'crypto';
import { knowledgeRepository } from '../repositories/knowledge.repository';
import { chunkText } from './chunking.service';
import { generateEmbedding } from './embedding.service';
import { fetchUrlContent } from './url.service';
import { logger } from '../utils/logger';

export const ingestNote = async (content: string, title?: string): Promise<string> => {
  try {
    const itemId = randomUUID();
    
    const displayTitle = title || (content.length > 30 ? `${content.substring(0, 30)}...` : content);
    
    await knowledgeRepository.insertItem({
      id: itemId,
      type: 'note',
      title: displayTitle,
      raw_content: content,
    });
    
    logger.info(`Ingested note item: ${itemId}`);
    
    const chunks = chunkText(content);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = chunks[i];
      const embedding = await generateEmbedding(chunkContent);
      
      await knowledgeRepository.insertChunk({
        id: randomUUID(),
        item_id: itemId,
        content: chunkContent,
        embedding: JSON.stringify(embedding),
        chunk_index: i,
      });
    }
    
    logger.info(`Stored ${chunks.length} chunks for note: ${itemId}`);
    
    return itemId;
  } catch (error) {
    logger.error('Failed to ingest note', error);
    throw error;
  }
};

export const ingestUrl = async (url: string): Promise<string> => {
  try {
    const { title, text } = await fetchUrlContent(url);
    
    const itemId = randomUUID();
    
    await knowledgeRepository.insertItem({
      id: itemId,
      type: 'url',
      title: title,
      source_url: url,
      raw_content: text,
    });
    
    logger.info(`Ingested url item: ${itemId} (${url})`);
    
    const chunks = chunkText(text);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = chunks[i];
      const embedding = await generateEmbedding(chunkContent);
      
      await knowledgeRepository.insertChunk({
        id: randomUUID(),
        item_id: itemId,
        content: chunkContent,
        embedding: JSON.stringify(embedding),
        chunk_index: i,
      });
    }
    
    logger.info(`Stored ${chunks.length} chunks for url: ${itemId}`);
    
    return itemId;
  } catch (error) {
    logger.error('Failed to ingest URL', error);
    throw error;
  }
};
