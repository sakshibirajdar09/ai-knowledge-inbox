import { Request, Response, NextFunction } from 'express';
import { queryKnowledge } from '../services/rag.service';
import { AppError } from '../middleware/error.middleware';

export const handleQuery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      throw new AppError(400, 'INVALID_REQUEST', 'Question cannot be empty');
    }
    
    if (question.length > 500) {
      throw new AppError(400, 'INVALID_REQUEST', 'Question is too long');
    }

    const result = await queryKnowledge(question);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
