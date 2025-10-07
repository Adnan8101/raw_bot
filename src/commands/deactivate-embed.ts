import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { prisma } from '../utils/prisma';
import { ADMIN_IDS } from '../config/config';

export const data = new SlashCommandBuilder()
  .setName('deactivate_embed')
  .setDescription('[ADMIN] Deactivate an event creator embed')
  .addStringOption((option) =>
    option
      .setName('embed_id')
      .setDescription('The message ID of the embed to deactivate')
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

    const embedId = interaction.options.getString('embed_id', true);

    // Find and update the embed
    const embed = await prisma.discord_active_embeds.findFirst({
      where: { embedMessageId: embedId },
    });

    if (!embed) {
      await interaction.reply({
        content: '❌ Embed not found in the database.',
        ephemeral: true,
      });
      return;
    }

    // Deactivate the embed
    await prisma.discord_active_embeds.update({
      where: { id: embed.id },
      data: {
        isActive: false,
      },
    });

    await interaction.reply({
      content: `✅ Embed \`${embedId}\` has been deactivated. Users can no longer create tickets from it.`,
      ephemeral: true,
    });
  } catch (error) {
    console.error('Error in deactivate_embed command:', error);
    await interaction.reply({
      content: '❌ An error occurred while deactivating the embed.',
      ephemeral: true,
    });
  }
}

export const deactivateEmbedCommand = { data, execute };
