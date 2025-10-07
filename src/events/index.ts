import { Client } from 'discord.js';
import { handleReady } from './ready';
import { handleInteractionCreate } from './interactionCreate';

export function registerEventHandlers(client: Client) {
  client.once('clientReady', handleReady);
  client.on('interactionCreate', handleInteractionCreate);
}
