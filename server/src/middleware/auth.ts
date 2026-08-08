import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../../db/client';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { env } from '../config/env';
import { AppError } from './error';

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('Authentification requise.', 401);
    }

    const token = header.slice(7);
    let payload: { sub: string };
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    } catch {
      throw new AppError('Session invalide ou expirée.', 401);
    }

    const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!user) {
      throw new AppError('Utilisateur introuvable.', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
