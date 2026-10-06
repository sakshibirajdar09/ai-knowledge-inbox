import { logger } from '../utils/logger';

class PipelineSingleton {
  static task = 'feature-extraction';
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance: any = null;

  static async getInstance() {
    if (this.instance === null) {
      // Lazy load pipeline so it doesn't block server start
      // Use new Function to prevent TypeScript from transpiling import() into require()
      const transformers = await new Function("return import('@xenova/transformers')")();
      const { pipeline, env } = transformers;
      env.cacheDir = './.cache';
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
  } catch (error: any) {
    logger.error('Failed to generate local embedding', error);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
};
