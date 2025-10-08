import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import { ADMIN_IDS } from '../config/config';
import { prisma } from '../index';

export const data = new SlashCommandBuilder()
  .setName('list_tokens')
  .setDescription('[ADMIN] List all active session tokens with their users')
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

    await interaction.deferReply({ ephemeral: true });

    // Get all active tokens (not expired and not used)
    const activeTokens = await prisma.discord_session_tokens.findMany({
      where: {
        expiresAt: {
          gt: new Date(), // Not expired
        },
        usedAt: null, // Not used yet
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 25, // Limit to 25 to avoid embed limits
    });

    if (activeTokens.length === 0) {
      await interaction.editReply({
        content: '📋 No active session tokens found.',
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🔑 Active Session Tokens')
      .setColor('#00D4AA')
      .setDescription(`Found ${activeTokens.length} active session tokens`)
      .setTimestamp();

    // Group tokens by user for better display
    const tokensByUser: { [userId: string]: typeof activeTokens } = {};
    
    for (const token of activeTokens) {
      if (!tokensByUser[token.discordUserId]) {
        tokensByUser[token.discordUserId] = [];
      }
      tokensByUser[token.discordUserId].push(token);
    }

    // Add fields for each user
    let fieldCount = 0;
    for (const [userId, userTokens] of Object.entries(tokensByUser)) {
      if (fieldCount >= 25) break; // Discord embed field limit

      // Try to get user info for better display
      let userDisplay = `User ID: ${userId}`;
      try {
        const user = await interaction.client.users.fetch(userId);
        userDisplay = `${user.username} (${user.displayName || user.globalName || user.username})`;
      } catch (error) {
        console.log(`Could not fetch user ${userId}:`, error);
      }

      const tokenList = userTokens.map(token => {
        const expiresIn = Math.floor((token.expiresAt.getTime() - Date.now()) / (1000 * 60)); // minutes
        const channelMention = `<#${token.ticketChannelId}>`;
        return `• **Token:** \`${token.token}\`\n• **Channel:** ${channelMention}\n• **Expires in:** ${expiresIn}m\n• **Created:** <t:${Math.floor(token.createdAt.getTime() / 1000)}:R>`;
      }).join('\n\n');

      embed.addFields({
        name: `👤 ${userDisplay} (${userTokens.length} token${userTokens.length > 1 ? 's' : ''})`,
        value: tokenList.length > 1024 ? tokenList.substring(0, 1020) + '...' : tokenList,
        inline: false,
      });

      fieldCount++;
    }

    // Add summary footer
    const totalUsers = Object.keys(tokensByUser).length;
    embed.setFooter({ 
      text: `${totalUsers} user${totalUsers > 1 ? 's' : ''} • ${activeTokens.length} total tokens` 
    });

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error in list-tokens command:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ An error occurred while fetching token information.',
        ephemeral: true,
      });
    } else {
      await interaction.editReply('❌ An error occurred while fetching token information.');
    }
  }
}

export const listTokensCommand = { data, execute };
