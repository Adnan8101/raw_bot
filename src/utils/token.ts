import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

interface SessionTokenPayload {
  discordId: string;
  ticketChannelId: string;
  ticketId: string;
  username: string;
}

export function generateSessionToken(payload: SessionTokenPayload): string {
  const jti = nanoid();
  
  return jwt.sign(
    {
      ...payload,
      jti,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '1h',
    }
  );
}

export function verifySessionToken(token: string): SessionTokenPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as SessionTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}
