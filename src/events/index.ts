import { Client } from 'discord.js';
import { handleReady } from './ready';
import { handleInteractionCreate } from './interactionCreate';
import { handleMessageCreate } from './messageCreate';

export function registerEventHandlers(client: Client) {
  client.once('clientReady', handleReady);
  client.on('interactionCreate', handleInteractionCreate);
  client.on('messageCreate', handleMessageCreate);
}
