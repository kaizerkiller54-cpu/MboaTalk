import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { env } from './config/env';

export const setupSocket = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token || typeof token !== 'string') {
        return next(new Error('Authentification requise.'));
      }
      const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
      const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
      if (!user) {
        return next(new Error('Utilisateur introuvable.'));
      }
      socket.data.user = user;
      next();
    } catch {
      next(new Error('Session invalide ou expirée.'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as typeof users.$inferSelect;
    const room = `user:${user.id}`;
    socket.join(room);
    console.log(`[socket] connected: ${user.id} (${user.phone})`);

    socket.on('message:send', (payload) => {
      io.to(`chat:${payload?.chatId}`).emit('message:new', payload);
    });

    socket.on('typing:start', (payload) => {
      socket.to(`chat:${payload?.chatId}`).emit('typing:start', { userId: user.id, chatId: payload?.chatId });
    });

    socket.on('typing:stop', (payload) => {
      socket.to(`chat:${payload?.chatId}`).emit('typing:stop', { userId: user.id, chatId: payload?.chatId });
    });

    socket.on('disconnect', () => {
      console.log(`[socket] disconnected: ${user.id}`);
    });
  });

  return io;
};
