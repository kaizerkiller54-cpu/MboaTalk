import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { and, eq, gt, lt } from 'drizzle-orm';
import { db } from '../../db/client';
import { refreshTokens, users } from '../../db/schema';
import { env } from '../config/env';
import { AppError } from '../middleware/error';

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const signAccessToken = (userId: string) =>
  jwt.sign({}, env.JWT_SECRET, { subject: userId, expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'] });

const signRefreshToken = (userId: string) =>
  jwt.sign({}, env.JWT_REFRESH_SECRET, { subject: userId, expiresIn: env.JWT_REFRESH_EXPIRES as jwt.SignOptions['expiresIn'] });

const refreshExpiresMs = (() => {
  const m = /^(\d+)([smhd])$/.exec(env.JWT_REFRESH_EXPIRES);
  if (!m) return 7 * 24 * 3600 * 1000;
  const n = Number(m[1]);
  switch (m[2]) {
    case 's': return n * 1000;
    case 'm': return n * 60 * 1000;
    case 'h': return n * 3600 * 1000;
    case 'd': return n * 24 * 3600 * 1000;
    default: return 7 * 24 * 3600 * 1000;
  }
})();

const persistRefreshToken = async (userId: string, token: string) => {
  const expiresAt = new Date(Date.now() + refreshExpiresMs);
  await db.insert(refreshTokens).values({
    id: crypto.randomUUID(),
    userId,
    tokenHash: hashToken(token),
    expiresAt
  });
  return expiresAt;
};

const toPublicUser = (user: typeof users.$inferSelect) => ({
  id: user.id,
  phone: user.phone,
  email: user.email,
  name: user.name,
  balanceFcfa: user.balanceFcfa,
  hasReferred: user.hasReferred,
  referralCount: user.referralCount,
  referralEarnings: user.referralEarnings,
  avatarUrl: user.avatarUrl,
  statusText: user.statusText,
  isOnline: user.isOnline,
  createdAt: user.createdAt
});

const generateUniquePhone = async () => {
  const prefix = '+237 6';
  for (let i = 0; i < 100; i++) {
    const suffix = Math.floor(10000000 + Math.random() * 90000000).toString();
    const phone = `${prefix}${suffix.substring(0, 2)} ${suffix.substring(2, 5)} ${suffix.substring(5, 8)}`;
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.phone, phone)).limit(1);
    if (existing.length === 0) return phone;
  }
  throw new AppError('Impossible de générer un numéro unique.', 500);
};

export const authService = {
  async register(data: { email: string; password: string; name?: string }) {
    const email = data.email.trim().toLowerCase();
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      throw new AppError('Un compte avec cet email existe déjà.', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const pinHash = await bcrypt.hash('1234', 12);
    const phone = await generateUniquePhone();
    const name = data.name?.trim() || 'Utilisateur MboaTalk';

    const [user] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        phone,
        email,
        name,
        passwordHash,
        pinHash,
        balanceFcfa: 450
      })
      .returning();

    const refreshToken = signRefreshToken(user.id);
    await persistRefreshToken(user.id, refreshToken);
    const accessToken = signAccessToken(user.id);

    return { user: toPublicUser(user), accessToken, refreshToken };
  },

  async login(data: { email: string; password: string }) {
    const email = data.email.trim().toLowerCase();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      throw new AppError('Aucun compte trouvé avec cet email.', 401);
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      throw new AppError('Mot de passe incorrect.', 401);
    }

    const refreshToken = signRefreshToken(user.id);
    await persistRefreshToken(user.id, refreshToken);
    const accessToken = signAccessToken(user.id);

    return { user: toPublicUser(user), accessToken, refreshToken };
  },

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new AppError('Refresh token requis.', 401);
    }

    let payload: { sub: string };
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
    } catch {
      throw new AppError('Refresh token invalide ou expiré.', 401);
    }

    const [stored] = await db
      .select()
      .from(refreshTokens)
      .where(and(eq(refreshTokens.userId, payload.sub), eq(refreshTokens.tokenHash, hashToken(refreshToken))))
      .limit(1);

    if (!stored) {
      throw new AppError('Refresh token révoqué.', 401);
    }
    if (stored.expiresAt.getTime() < Date.now()) {
      await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));
      throw new AppError('Refresh token expiré.', 401);
    }

    const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!user) {
      throw new AppError('Utilisateur introuvable.', 401);
    }

    // Rotation: revoke old, issue new
    await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));
    const newRefreshToken = signRefreshToken(user.id);
    await persistRefreshToken(user.id, newRefreshToken);
    const accessToken = signAccessToken(user.id);

    return { user: toPublicUser(user), accessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken: string) {
    if (refreshToken) {
      await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.tokenHash, hashToken(refreshToken)))
        .catch(() => {});
    }
  },

  async changePin(userId: string, currentPin: string, newPin: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new AppError('Utilisateur introuvable.', 401);

    const valid = await bcrypt.compare(currentPin, user.pinHash);
    if (!valid) throw new AppError('PIN actuel incorrect.', 400);

    const pinHash = await bcrypt.hash(newPin, 12);
    await db.update(users).set({ pinHash }).where(eq(users.id, userId));
  },

  async verifyPin(userId: string, pin: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new AppError('Utilisateur introuvable.', 401);
    const valid = await bcrypt.compare(pin, user.pinHash);
    if (!valid) throw new AppError('PIN incorrect.', 400);
  },

  async purgeExpiredTokens() {
    await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, new Date())).catch(() => {});
  }
};
