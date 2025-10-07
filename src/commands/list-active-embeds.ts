import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import { prisma } from '../utils/prisma';
import { ADMIN_IDS } from '../config/config';

export const data = new SlashCommandBuilder()
  .setName('list_active_embeds')
  .setDescription('[ADMIN] List all active event creator embeds')
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

    // Get all active embeds
    const embeds = await prisma.discord_active_embeds.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (embeds.length === 0) {
      await interaction.reply({
        content: '📭 No active embeds found.',
        ephemeral: true,
      });
      return;
    }

    // Create embed with list
    const listEmbed = new EmbedBuilder()
      .setTitle('📋 Active Event Creator Embeds')
      .setColor('#00FF00')
      .setDescription(
        embeds
          .map(
            (e: any, i: number) =>
              `**${i + 1}.** ID: \`${e.embedMessageId}\`\n` +
              `   Channel: <#${e.channelId}>\n` +
              `   Created by: <@${e.createdBy}>\n` +
              `   Created: <t:${Math.floor(e.createdAt.getTime() / 1000)}:R>`
          )
          .join('\n\n')
      )
      .setFooter({ text: `Total: ${embeds.length} active embed(s)` })
      .setTimestamp();

    await interaction.reply({
      embeds: [listEmbed],
      ephemeral: true,
    });
  } catch (error) {
    console.error('Error in list_active_embeds command:', error);
    await interaction.reply({
      content: '❌ An error occurred while fetching active embeds.',
      ephemeral: true,
    });
  }
}

export const listActiveEmbedsCommand = { data, execute };
