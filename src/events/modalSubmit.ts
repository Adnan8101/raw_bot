import {
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
} from 'discord.js';
import { prisma } from '../utils/prisma';

export async function handleModalSubmit(interaction: ModalSubmitInteraction) {
  try {
    if (interaction.customId.startsWith('setup_modal:')) {
      await handleSetupModal(interaction);
    }
  } catch (error) {
    console.error('Error handling modal submit:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ An error occurred while processing your submission.',
        ephemeral: true,
      });
    }
  }
}

async function handleSetupModal(interaction: ModalSubmitInteraction) {
  try {
    // Reply immediately to avoid timeout
    await interaction.reply({ 
      content: '⏳ Setting up your event embed...', 
      ephemeral: true 
    });

    // Parse the custom ID to get channel IDs
    const [, embedChannelId, openCategoryId, closedCategoryId] = interaction.customId.split(':');

    // Get the values from the modal
    const title = interaction.fields.getTextInputValue('embed_title');
    const description = interaction.fields.getTextInputValue('embed_description');
    const footer = interaction.fields.getTextInputValue('embed_footer');
    const thumbnail = interaction.fields.getTextInputValue('embed_thumbnail');

    // Get the channel
    const channel = await interaction.guild?.channels.fetch(embedChannelId) as TextChannel;

    if (!channel) {
      await interaction.editReply('❌ Could not find the specified channel.');
      return;
    }

    // Create the embed
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor('#FF69B4')
      .setTimestamp();

    // Add footer if provided
    if (footer && footer.trim()) {
      embed.setFooter({ text: footer.trim() });
    } else {
      embed.setFooter({ text: 'Managed by Raw Studio by Rashika Agarwal' });
    }

    // Add thumbnail if provided and valid URL
    if (thumbnail && thumbnail.trim()) {
      try {
        new URL(thumbnail.trim()); // Validate URL
        embed.setThumbnail(thumbnail.trim());
      } catch (error) {
        console.log('Invalid thumbnail URL provided, skipping thumbnail');
      }
    }

    // Create the button
    const button = new ButtonBuilder()
      .setCustomId(`start_event_setup:${openCategoryId}:${closedCategoryId}`)
      .setLabel('🪄 Make your event memorable')
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
    await interaction.editReply(
      `✅ Event Creator embed sent to ${channel}!\n\n` +
      `📂 Open Tickets Category: <#${openCategoryId}>\n` +
      `🔒 Closed Tickets Category: <#${closedCategoryId}>\n\n` +
      `The embed is now active and ready to accept ticket requests.`
    );
  } catch (error) {
    console.error('Error in setup modal handler:', error);
    await interaction.editReply('❌ An error occurred while setting up the embed.');
  }
}
