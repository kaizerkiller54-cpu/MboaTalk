import crypto from 'crypto';
import { db } from '../../db/client';
import { media } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { AppError } from '../middleware/error';

export const MAX_MEDIA_BYTES = 2 * 1024 * 1024; // 2 MB

const extensionFromDataUrl = (dataUrl: string): string => {
  const match = /^data:([^;]+);/.exec(dataUrl);
  if (!match) return 'bin';
  const mime = match[1];
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/webm': 'weba',
    'application/pdf': 'pdf',
    'text/plain': 'txt'
  };
  return map[mime] || 'bin';
};

export const parseDataUrl = (dataUrl: string): { mimeType: string; buffer: Buffer } => {
  if (!dataUrl.startsWith('data:')) {
    throw new AppError('Donnée média invalide (base64 attendu).', 400);
  }
  const comma = dataUrl.indexOf(',');
  const meta = dataUrl.slice(5, comma);
  const mimeType = meta.split(';')[0] || 'application/octet-stream';
  const base64 = dataUrl.slice(comma + 1);
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > MAX_MEDIA_BYTES) {
    throw new AppError(
      `Média trop lourd (${(buffer.length / (1024 * 1024)).toFixed(1)} Mo). Maximum : 2 Mo.`,
      413
    );
  }
  return { mimeType, buffer };
};

export interface UploadResult {
  url: string;
  publicId: string;
  mimeType: string;
  sizeBytes: number;
}

export const mediaUrlFor = (mediaId: string): string => `/api/v1/media/${mediaId}`;

export const storageService = {
  async uploadBase64(dataUrl: string, folder: string, userId?: string): Promise<UploadResult> {
    const { mimeType, buffer } = parseDataUrl(dataUrl);
    const mediaId = `media_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    await db.insert(media).values({
      id: mediaId,
      userId: userId || 'system',
      fileName: `media.${extensionFromDataUrl(dataUrl)}`,
      mimeType,
      sizeBytes: buffer.length,
      data: buffer.toString('base64')
    });
    return {
      url: mediaUrlFor(mediaId),
      publicId: mediaId,
      mimeType,
      sizeBytes: buffer.length
    };
  },

  async uploadByUrl(url: string, folder: string, userId?: string): Promise<UploadResult> {
    if (url.startsWith('/api/v1/media/')) {
      return {
        url,
        publicId: url.replace('/api/v1/media/', ''),
        mimeType: 'application/octet-stream',
        sizeBytes: 0
      };
    }
    if (url.startsWith('data:')) {
      return this.uploadBase64(url, folder, userId);
    }
    const res = await fetch(url);
    if (!res.ok) {
      throw new AppError('Impossible de télécharger le média distant.', 400);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > MAX_MEDIA_BYTES) {
      throw new AppError(`Média trop lourd. Maximum : 2 Mo.`, 413);
    }
    const mimeType = res.headers.get('content-type') || 'application/octet-stream';
    const ext = url.includes('.') ? (url.split('?')[0].split('.').pop() || 'bin').toLowerCase() : 'bin';
    const mediaId = `media_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    await db.insert(media).values({
      id: mediaId,
      userId: userId || 'system',
      fileName: `media.${ext}`,
      mimeType,
      sizeBytes: buffer.length,
      data: buffer.toString('base64')
    });
    return { url: mediaUrlFor(mediaId), publicId: mediaId, mimeType, sizeBytes: buffer.length };
  },

  async get(mediaId: string): Promise<{ mimeType: string; buffer: Buffer } | null> {
    const rows: any[] = await db.select().from(media).where(eq(media.id, mediaId));
    const row = rows[0];
    if (!row) return null;
    return { mimeType: row.mimeType, buffer: Buffer.from(row.data, 'base64') };
  },

  async delete(mediaId: string): Promise<void> {
    if (!mediaId) return;
    await db.delete(media).where(eq(media.id, mediaId));
  }
};
