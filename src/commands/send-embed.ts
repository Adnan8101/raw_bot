import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
} from 'discord.js';
import { prisma } from '../utils/prisma';
import { ADMIN_IDS } from '../config/config';

export const data = new SlashCommandBuilder()
  .setName('send_embed')
  .setDescription('[ADMIN] Send Event Creator embed to a channel')
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('The channel to send the embed to')
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText)
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

    const channel = interaction.options.getChannel('channel', true) as TextChannel;

    // Create the Event Creator embed
    const embed = new EmbedBuilder()
      .setTitle('🎉 Raw Studio Event Creator')
      .setDescription(
        '> Plan your next event with us! Click below to start your private event ticket.\n' +
        '> You\'ll get a secure link to view all Raw Studio packages and select the perfect option for your event.'
      )
      .setColor('#FF69B4')
      .setFooter({ text: 'Managed by Raw Studio by Rashika Agarwal' })
      .setTimestamp();

    // Create the button
    const button = new ButtonBuilder()
      .setCustomId('start_event_setup')
      .setLabel('🪄 Start Event Setup')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    // Send the embed
    const message = await channel.send({
      embeds: [embed],
      components: [row],
    });

    // Save to database as active embed
    await prisma.discord_active_embeds.create({
      data: {
        embedMessageId: message.id,
        channelId: channel.id,
        guildId: interaction.guildId || '',
        createdBy: interaction.user.id,
        isActive: true,
      },
    });

    // Confirm to admin
    await interaction.reply({
      content: `✅ Event Creator embed sent to ${channel} and activated!`,
      ephemeral: true,
    });
  } catch (error) {
    console.error('Error in send_embed command:', error);
    await interaction.reply({
      content: '❌ An error occurred while sending the embed.',
      ephemeral: true,
    });
  }
}

export const sendEmbedCommand = { data, execute };
