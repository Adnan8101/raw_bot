import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import express from 'express';
import path from 'path';
import { startWebhookServer } from './webhook/server';
import { loadCommands } from './commands';
import { registerEventHandlers } from './events';
import { startTicketReminderSystem } from './utils/ticketReminder';

// Load environment variables from the bot directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Verify required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in environment variables');
  process.exit(1);
}

if (!process.env.DISCORD_BOT_TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

// Initialize Prisma
export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Initialize Discord Client
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

// Command collection
client.commands = new Collection();

async function main() {
  try {
    console.log('🚀 Starting Raw Studio Bot...');

    // Load commands
    const commands = await loadCommands(client);
    console.log(`✅ Loaded ${commands.length} commands`);

    // Register slash commands with Discord
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);
    
    console.log('🔄 Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
      { body: commands.map(cmd => cmd.data.toJSON()) },
    );
    console.log('✅ Slash commands registered');

    // Register event handlers
    registerEventHandlers(client);
    console.log('✅ Event handlers registered');

    // Start webhook server
    startWebhookServer();
    console.log(`✅ Webhook server started on port ${process.env.PORT || 3001}`);

    // Login to Discord
    await client.login(process.env.DISCORD_BOT_TOKEN);
    console.log('✅ Bot logged in successfully');

    // Start ticket reminder system
    startTicketReminderSystem();
    console.log('✅ Ticket reminder system started');

  } catch (error) {
    console.error('❌ Error starting bot:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await prisma.$disconnect();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await prisma.$disconnect();
  client.destroy();
  process.exit(0);
});

main();
