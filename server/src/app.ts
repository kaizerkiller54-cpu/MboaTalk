import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { env } from './config/env';
import { authRouter } from './routes/auth.routes';
import { stateRouter } from './routes/state.routes';
import { chatRouter } from './routes/chat.routes';
import { groupRouter } from './routes/group.routes';
import { storyRouter, channelRouter } from './routes/story.routes';
import { walletRouter } from './routes/wallet.routes';
import { notificationRouter, profileRouter } from './routes/notification.routes';
import { mediaRouter } from './routes/media.routes';
import { errorHandler, notFoundHandler } from './middleware/error';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = (): Application => {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true
    })
  );
  app.use(express.json({ limit: env.BODY_LIMIT }));
  app.use(express.urlencoded({ limit: env.BODY_LIMIT, extended: true }));

  app.use('/uploads', express.static(path.resolve(__dirname, '..', '..', 'uploads')));

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1', stateRouter);
  app.use('/api/v1', chatRouter);
  app.use('/api/v1', groupRouter);
  app.use('/api/v1', storyRouter);
  app.use('/api/v1', channelRouter);
  app.use('/api/v1', walletRouter);
  app.use('/api/v1', notificationRouter);
  app.use('/api/v1', profileRouter);
  app.use('/api/v1', mediaRouter);

  // Serve built frontend (production) + SPA fallback
  const distDir = path.resolve(__dirname, '..', '..', 'dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      return res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
};
