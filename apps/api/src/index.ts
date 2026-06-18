import express, { type Express } from 'express';
import pinoHttp from 'pino-http';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import webhooksRouter from './routes/webhooks.js';
import usersRouter from './routes/users.js';
import templatesRouter from './routes/templates.js';
import billingRouter from './routes/billing.js';
import generateRouter from './routes/generate.js';
import cronRouter from './routes/cron.js';

const app: Express = express();

const allowedOrigins = [
  process.env['APP_BASE_URL'] ?? 'http://localhost:5173',
  'http://localhost:5173',
];

app.use((req, res, next) => {
  const origin = req.headers.origin ?? '';
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.use(pinoHttp({ logger }));

// Webhooks must be mounted BEFORE express.json() to receive raw body for signature verification
app.use('/api/webhooks', webhooksRouter);

app.use(express.json({ limit: '20mb' }));

app.use('/api/users', usersRouter);
app.use('/api/me', (req, res, next) => {
  req.url = '/me' + req.url;
  usersRouter(req, res, next);
});
app.use('/api/templates', templatesRouter);
app.use('/api/billing', billingRouter);
app.use('/api/generate', generateRouter);
app.use('/api/cron', cronRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use(errorHandler);

const PORT = process.env['PORT'] ?? 3001;
if (!process.env['VERCEL'] && process.env['NODE_ENV'] !== 'test') {
  app.listen(PORT, () => {
    logger.info(`API server running on port ${PORT}`);
  });
}

export default app;
