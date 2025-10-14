import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('banner')
  .setDescription('Display user or server banner');

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('banner_global')
          .setLabel('Global Banner')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🌐'),
        new ButtonBuilder()
          .setCustomId('banner_server')
          .setLabel('Server Banner')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🏠')
      );

    const embed = new EmbedBuilder()
      .setTitle('Banner Selection')
      .setDescription('Choose which banner you want to view:')
      .setColor('#5865F2')
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  } catch (error) {
    console.error('Error executing banner command:', error);
    await interaction.reply({
      content: 'An error occurred while executing the command.',
      ephemeral: true,
    });
  }
}

export const bannerCommand = { data, execute };
