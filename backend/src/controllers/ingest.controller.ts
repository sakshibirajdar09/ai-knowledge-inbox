import { Request, Response, NextFunction } from 'express';
import { ingestNote, ingestUrl } from '../services/ingestion.service';
import { AppError } from '../middleware/error.middleware';

export const ingestContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, content, title } = req.body;

    if (!type || !content) {
      throw new AppError(400, 'INVALID_REQUEST', 'Type and content are required');
    }

    if (type !== 'note' && type !== 'url') {
      throw new AppError(400, 'INVALID_TYPE', 'Type must be note or url');
    }

    let itemId: string;

    if (type === 'note') {
      itemId = await ingestNote(content, title);
    } else {
      itemId = await ingestUrl(content);
    }

    res.status(201).json({
      id: itemId,
      type,
      message: 'Content ingested successfully',
    });
  } catch (error) {
    next(error);
  }
};
