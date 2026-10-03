import express from 'express';
import cors from 'cors';
import { errorMiddleware } from './middleware/error.middleware';
import { logger } from './utils/logger';

const app = express();

app.use(cors());
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

import itemsRoutes from './routes/items.routes';
import ingestRoutes from './routes/ingest.routes';
import queryRoutes from './routes/query.routes';

app.use('/items', itemsRoutes);
app.use('/ingest', ingestRoutes);
app.use('/query', queryRoutes);

// Middleware
app.use(errorMiddleware);

export default app;
