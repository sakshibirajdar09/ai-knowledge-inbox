import { Router } from 'express';
import { getItems, getItem, deleteItem } from '../controllers/items.controller';

const router = Router();

router.get('/', getItems);
router.get('/:id', getItem);
router.delete('/:id', deleteItem);

export default router;
