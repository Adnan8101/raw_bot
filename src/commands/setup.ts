import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
} from 'discord.js';
import { ADMIN_IDS } from '../config/config';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('[ADMIN] Setup and send Event Creator embed')
  .addChannelOption((option) =>
    option
      .setName('embed_channel')
      .setDescription('Channel where the embed will be sent')
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText)
  )
  .addChannelOption((option) =>
    option
      .setName('open_tickets_category')
      .setDescription('Category for open tickets')
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildCategory)
  )
  .addChannelOption((option) =>
    option
      .setName('closed_tickets_category')
      .setDescription('Category for closed tickets')
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildCategory)
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

    const embedChannel = interaction.options.getChannel('embed_channel', true);
    const openCategory = interaction.options.getChannel('open_tickets_category', true);
    const closedCategory = interaction.options.getChannel('closed_tickets_category', true);

    // Store these in interaction for later use in modal submit
    const modal = new ModalBuilder()
      .setCustomId(`setup_modal:${embedChannel.id}:${openCategory.id}:${closedCategory.id}`)
      .setTitle('Event Creator Setup');

    const titleInput = new TextInputBuilder()
      .setCustomId('embed_title')
      .setLabel('Embed Title')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('🎉 Raw Studio Event Creator')
      .setRequired(true)
      .setMaxLength(100);

    const descriptionInput = new TextInputBuilder()
      .setCustomId('embed_description')
      .setLabel('Embed Description')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Plan your next event with us! Click below to start...')
      .setRequired(true)
      .setMaxLength(2000);

    const footerInput = new TextInputBuilder()
      .setCustomId('embed_footer')
      .setLabel('Embed Footer (Optional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Managed by Raw Studio by Rashika Agarwal')
      .setRequired(false)
      .setMaxLength(100);

    const thumbnailInput = new TextInputBuilder()
      .setCustomId('embed_thumbnail')
      .setLabel('Embed Thumbnail URL (Optional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('https://example.com/image.png')
      .setRequired(false)
      .setMaxLength(500);

    const row1 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(titleInput);
    const row2 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(descriptionInput);
    const row3 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(footerInput);
    const row4 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(thumbnailInput);

    modal.addComponents(row1, row2, row3, row4);

    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error in setup command:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ An error occurred while showing the setup modal.',
        ephemeral: true,
      });
    }
  }
}

export const setupCommand = { data, execute };
