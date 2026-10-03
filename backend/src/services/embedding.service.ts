import { pipeline } from '@xenova/transformers';
import { logger } from '../utils/logger';

class PipelineSingleton {
  static task = 'feature-extraction';
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance: any = null;

  static async getInstance() {
    if (this.instance === null) {
      // Lazy load pipeline so it doesn't block server start
      this.instance = await pipeline(this.task as any, this.model);
    }
    return this.instance;
  }
}

export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const embedder = await PipelineSingleton.getInstance();
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (error) {
    logger.error('Failed to generate local embedding', error);
    return [];
  }
};
