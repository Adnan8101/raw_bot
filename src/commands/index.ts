import { Client } from 'discord.js';
import { sendEmbedCommand } from './send-embed';
import { deactivateEmbedCommand } from './deactivate-embed';
import { listActiveEmbedsCommand } from './list-active-embeds';
import { closeTicketCommand } from './close-ticket';
import { setupCommand } from './setup';
import { clearSessionCommand } from './clear-session';
import { helpCommand } from './help';
import { botinfoCommand } from './botinfo';
import { Command } from '../types/discord';

export async function loadCommands(client: Client): Promise<Command[]> {
  const commands = [
    sendEmbedCommand,
    deactivateEmbedCommand,
    listActiveEmbedsCommand,
    closeTicketCommand,
    setupCommand,
    clearSessionCommand,
    helpCommand,
    botinfoCommand,
  ];

  commands.forEach(command => {
    client.commands.set(command.data.name, command);
  });

  return commands;
}
