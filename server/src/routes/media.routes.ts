import { Router } from 'express';
import { storageService } from '../services/storage.service';
import { AppError } from '../middleware/error';

export const mediaRouter = Router();

mediaRouter.get('/media/:id', async (req, res, next) => {
  try {
    const file = await storageService.get(req.params.id);
    if (!file) throw new AppError('Média introuvable.', 404);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(file.buffer);
  } catch (err) {
    next(err);
  }
});
