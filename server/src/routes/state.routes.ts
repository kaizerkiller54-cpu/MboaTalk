import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { buildBundle } from '../services/bundle.service';
import { AppError } from '../middleware/error';

export const stateRouter = Router();

stateRouter.get('/state', requireAuth, async (req, res, next) => {
  try {
    const user = await buildBundle(req.user!.id);
    return res.json({ success: true, user });
  } catch (err) {
    next(err instanceof AppError ? err : new AppError('Erreur lors de la récupération de la session.', 500));
  }
});
