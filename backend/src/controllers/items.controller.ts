import { Request, Response, NextFunction } from 'express';
import { knowledgeRepository } from '../repositories/knowledge.repository';

export const getItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await knowledgeRepository.getAllItems();
    const formattedItems = items.map((item: any) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      sourceUrl: item.source_url,
      createdAt: item.created_at,
    }));
    res.status(200).json(formattedItems);
  } catch (error) {
    next(error);
  }
};

export const getItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await knowledgeRepository.getItemById(id as string);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.status(200).json({
      id: item.id,
      type: item.type,
      title: item.title,
      sourceUrl: item.source_url,
      rawContent: item.raw_content,
      createdAt: item.created_at,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await knowledgeRepository.deleteItem(id as string);
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
};
