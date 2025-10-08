import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import { ADMIN_IDS } from '../config/config';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('[ADMIN] List all available bot commands')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    // Admin check
    if (!ADMIN_IDS.includes(interaction.user.id)) {
      await interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('Bot Commands')
      .setColor('#5865F2')
      .setDescription('List of all available commands')
      .addFields(
        {
          name: '/setup',
          value: 'Setup and send Event Creator embed with ticket categories',
          inline: false,
        },
        {
          name: '/send_embed',
          value: 'Send a new Event Creator embed to a specific channel',
          inline: false,
        },
        {
          name: '/deactivate_embed',
          value: 'Deactivate an Event Creator embed',
          inline: false,
        },
        {
          name: '/list_active_embeds',
          value: 'List all active Event Creator embeds',
          inline: false,
        },
        {
          name: '/close_ticket',
          value: 'Close and move ticket to closed category',
          inline: false,
        },
        {
          name: '/clear_session',
          value: 'Clear user session for a ticket',
          inline: false,
        },
        {
          name: '/help',
          value: 'Display this help message',
          inline: false,
        },
        {
          name: '/botinfo',
          value: 'Display bot and system information',
          inline: false,
        },
        {
          name: '/list_tokens',
          value: 'List all active session tokens with their users',
          inline: false,
        }
      )
      .setFooter({ text: 'All commands are admin-only' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error('Error executing help command:', error);
    await interaction.reply({
      content: 'An error occurred while executing the command.',
      ephemeral: true,
    });
  }
}

export const helpCommand = { data, execute };
