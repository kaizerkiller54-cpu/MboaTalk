import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { validateBody } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { env } from '../config/env';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Trop de tentatives. Réessayez dans quelques minutes.'
});

const registerSchema = z.object({
  email: z.string().email('Email invalide.').min(5).max(255),
  password: z.string().min(4, 'Le mot de passe doit contenir au moins 4 caractères.').max(128),
  name: z.string().trim().min(1).max(100).optional()
});

const loginSchema = z.object({
  email: z.string().email('Email invalide.').min(5).max(255),
  password: z.string().min(1, 'Mot de passe requis.').max(128)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

const pinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'Le PIN doit contenir exactement 4 chiffres.')
});

const changePinSchema = z.object({
  currentPin: z.string().regex(/^\d{4}$/, 'Le PIN doit contenir exactement 4 chiffres.'),
  newPin: z.string().regex(/^\d{4}$/, 'Le PIN doit contenir exactement 4 chiffres.')
});

authRouter.post('/register', authLimiter, validateBody(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', authLimiter, validateBody(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/refresh', validateBody(refreshSchema), async (req, res, next) => {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    return res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', validateBody(refreshSchema), async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/verify-pin', requireAuth, validateBody(pinSchema), async (req, res, next) => {
  try {
    await authService.verifyPin(req.user!.id, req.body.pin);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/change-pin', requireAuth, validateBody(changePinSchema), async (req, res, next) => {
  try {
    await authService.changePin(req.user!.id, req.body.currentPin, req.body.newPin);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
