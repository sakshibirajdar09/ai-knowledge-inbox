import { Request, Response, NextFunction } from 'express';
import { queryKnowledgeStream } from '../services/rag.service';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export const handleQuery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      throw new AppError(400, 'INVALID_REQUEST', 'Question cannot be empty');
    }
    
    if (question.length > 500) {
      throw new AppError(400, 'INVALID_REQUEST', 'Question is too long');
    }

    const { sources, stream } = await queryKnowledgeStream(question);

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send sources immediately as the first event
    res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);

    if (!stream) {
      res.write(`data: ${JSON.stringify({ type: 'answer', text: "The saved knowledge does not contain enough information to answer this question." })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // Stream the chunks from Gemini
    try {
      for await (const chunk of stream.stream) {
        const chunkText = chunk.text();
        res.write(`data: ${JSON.stringify({ type: 'answer', text: chunkText })}\n\n`);
      }
    } catch (err) {
      logger.error('Error during streaming', err);
      res.write(`data: ${JSON.stringify({ type: 'error', text: "\n\n[Error streaming answer]" })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    next(error);
  }
};
