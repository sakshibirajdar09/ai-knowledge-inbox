import { Router } from 'express';
import { ingestContent } from '../controllers/ingest.controller';

const router = Router();

router.post('/', ingestContent);

export default router;
