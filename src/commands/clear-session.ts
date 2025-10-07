import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { prisma } from '../utils/prisma';
import { ADMIN_IDS } from '../config/config';

export const data = new SlashCommandBuilder()
  .setName('clear-session')
  .setDescription('[ADMIN] Clear all tickets and sessions for a user')
  .addUserOption((option) =>
    option
      .setName('user')
      .setDescription('The user to clear sessions for')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    // Admin check
    if (!ADMIN_IDS.includes(interaction.user.id)) {
      await interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
      return;
    }

    const user = interaction.options.getUser('user', true);

    // Find all tickets for the user
    const tickets = await prisma.discord_tickets.findMany({
      where: { discordUserId: user.id },
    });

    if (tickets.length === 0) {
      await interaction.reply({
        content: `📭 No tickets found for ${user.tag}.`,
        ephemeral: true,
      });
      return;
    }

    // Delete all session tokens for the user
    const deletedTokens = await prisma.discord_session_tokens.deleteMany({
      where: { discordUserId: user.id },
    });

    // Close all open tickets
    const closedTickets = await prisma.discord_tickets.updateMany({
      where: {
        discordUserId: user.id,
        status: 'open',
      },
      data: {
        status: 'closed',
        closedAt: new Date(),
      },
    });

    // Delete ticket channels
    for (const ticket of tickets) {
      try {
        const channel = await interaction.guild?.channels.fetch(ticket.ticketChannelId);
        if (channel) {
          await channel.delete('Admin cleared user session');
        }
      } catch (error) {
        console.error(`Failed to delete channel ${ticket.ticketChannelId}:`, error);
      }
    }

    await interaction.reply({
      content: 
        `✅ **Session cleared for ${user.tag}**\n\n` +
        `📋 Tickets closed: ${closedTickets.count}\n` +
        `🔑 Tokens deleted: ${deletedTokens.count}\n` +
        `🗑️ Channels deleted: ${tickets.length}`,
      ephemeral: true,
    });

  } catch (error) {
    console.error('Error in clear-session command:', error);
    await interaction.reply({
      content: '❌ An error occurred while clearing the session.',
      ephemeral: true,
    });
  }
}

export const clearSessionCommand = { data, execute };
