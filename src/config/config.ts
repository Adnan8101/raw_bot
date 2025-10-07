import dotenv from 'dotenv';
dotenv.config();

// Admin Discord IDs (comma-separated in .env)
export const ADMIN_IDS = process.env.ADMIN_IDS?.split(',') || [];

// Discord Configuration
export const CLIENT_ID = process.env.CLIENT_ID || '';
export const GUILD_ID = process.env.GUILD_ID || '';
export const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';

// Webhook Configuration
export const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'raw-studio-webhook-secret';
export const WEBHOOK_PORT = parseInt(process.env.PORT || '3001');

// Website URL
export const WEBSITE_URL = process.env.WEBSITE_URL || 'https://raw-studio.vercel.app';

// JWT Secret for session tokens
export const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-this';

// Ticket Configuration
export const TICKET_CATEGORY_NAME = '🎫 Event Tickets';
export const STAFF_ROLE_NAMES = ['Staff', 'Admin', 'Moderator', 'Event Manager'];
export const SESSION_EXPIRY_MS = 60 * 60 * 1000;
