import { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { prisma } from '../utils/prisma';
import { generateSessionToken } from '../utils/token';
import { EMBED_COLORS, EMOJIS } from '../config/constants';
import { TICKET_CATEGORY_NAME, STAFF_ROLE_NAMES, WEBSITE_URL } from '../config/config';

export async function handleButtonInteraction(interaction: ButtonInteraction) {
  const { customId } = interaction;

  if (customId.startsWith('start_event_setup')) {
    await handleStartEventSetup(interaction);
  } else if (customId === 'view_packages') {
    await handleViewPackages(interaction);
  }
}

async function handleStartEventSetup(interaction: ButtonInteraction) {
  try {
    // Check if interaction is still valid before deferring
    if (interaction.replied || interaction.deferred) {
      console.log('Interaction already replied or deferred');
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Parse category IDs from customId
    const [, openCategoryId, closedCategoryId] = interaction.customId.split(':');

    // Check if the embed is still active
    const embed = await prisma.discord_active_embeds.findFirst({
      where: {
        embedMessageId: interaction.message.id,
        isActive: true,
      },
    });

    if (!embed) {
      await interaction.editReply('❌ This embed is no longer active. Please contact an administrator.');
      return;
    }

    // Check if user already has an open ticket
    const existingTicket = await prisma.discord_tickets.findFirst({
      where: {
        discordUserId: interaction.user.id,
        guildId: interaction.guildId!,
        status: 'open',
      },
    });

    if (existingTicket) {
      // Verify the channel still exists
      try {
        const existingChannel = await interaction.guild?.channels.fetch(existingTicket.ticketChannelId);
        if (existingChannel) {
          await interaction.editReply(
            `⚠️ You already have an open ticket: <#${existingTicket.ticketChannelId}>`
          );
          return;
        }
      } catch (error) {
        // Channel doesn't exist, close the ticket in database
        await prisma.discord_tickets.update({
          where: { id: existingTicket.id },
          data: { status: 'closed', closedAt: new Date() },
        });
      }
    }

    // Create ticket channel with ticket ID format
    const guild = interaction.guild!;
    
    // Generate a short ticket ID (last 6 chars of timestamp in base36)
    const shortId = Date.now().toString(36).slice(-6).toUpperCase();
    const ticketChannelName = `ticket-${shortId}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-_]/g, '-').slice(0, 100);
    
    // Get the open tickets category
    const ticketCategory = await guild.channels.fetch(openCategoryId);
    
    if (!ticketCategory || ticketCategory.type !== ChannelType.GuildCategory) {
      await interaction.editReply('❌ Invalid ticket category. Please contact an administrator.');
      return;
    }
    
    // Find staff roles
    const staffRoles = guild.roles.cache.filter(role => 
      STAFF_ROLE_NAMES.some(name => role.name.toLowerCase().includes(name.toLowerCase()))
    );
    
    const permissionOverwrites: any[] = [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ];
    
    // Add staff roles to permissions
    staffRoles.forEach(role => {
      permissionOverwrites.push({
        id: role.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
        ],
      });
    });
    
    const ticketChannel = await guild.channels.create({
      name: ticketChannelName,
      type: ChannelType.GuildText,
      parent: ticketCategory.id,
      permissionOverwrites,
    });

    // Create ticket in database first
    const ticket = await (prisma as any).discord_tickets.create({
      data: {
        discordUserId: interaction.user.id,
        discordUsername: interaction.user.tag,
        ticketChannelId: ticketChannel.id,
        createdFromEmbedId: interaction.message.id,
        guildId: interaction.guildId!,
        status: 'open',
      },
    });

    // Generate session token
    const sessionToken = generateSessionToken({
      discordId: interaction.user.id,
      ticketChannelId: ticketChannel.id,
      ticketId: ticket.id,
      username: interaction.user.tag,
    });
    
    // Store session token
    await (prisma as any).discord_session_tokens.create({
      data: {
        token: sessionToken,
        discordUserId: interaction.user.id,
        ticketChannelId: ticketChannel.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Send ticket intro message
    const welcomeEmbed = new EmbedBuilder()
      .setColor(EMBED_COLORS.PRIMARY)
      .setTitle(`${EMOJIS.MEMO} Welcome, ${interaction.user.username}!`)
      .setDescription(
        `Thank you for your interest in **Raw Studio**!\n\n` +
        `${EMOJIS.PACKAGE} Click the button below to view our event packages on the website.\n` +
        `Your Discord session will automatically link with the web session.\n\n` +
        `${EMOJIS.INFO} **What happens next?**\n` +
        `1. Browse our packages\n` +
        `2. Select your preferred package\n` +
        `3. Fill in event details\n` +
        `4. Our staff will follow up here\n\n` +
        `Have questions? Feel free to ask here!`
      )
      .setFooter({ text: 'Raw Studio by Rashika Agarwal' })
      .setTimestamp();

    const button = new ButtonBuilder()
      .setCustomId('view_packages')
      .setLabel('View Packages')
      .setStyle(ButtonStyle.Primary)
      .setEmoji(EMOJIS.WEB);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    const welcomeMessage = await ticketChannel.send({
      content: `<@${interaction.user.id}>`,
      embeds: [welcomeEmbed],
      components: [row],
    });

    // Store welcome message ID for deletion after package selection
    await prisma.discord_tickets.update({
      where: { id: ticket.id },
      data: { welcomeMessageId: welcomeMessage.id },
    });

    await interaction.editReply(
      `${EMOJIS.SUCCESS} Your ticket has been created: ${ticketChannel}\n` +
      `Please check the channel to continue!`
    );

  } catch (error: any) {
    console.error('Error creating ticket:', error);
    
    // Handle Discord API errors for expired interactions
    if (error.code === 10062 || error.message?.includes('Unknown interaction')) {
      console.log('Interaction expired - user likely clicked button after 15 minutes');
      return;
    }

    // Only try to reply if interaction hasn't been replied to yet
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({ content: '❌ An error occurred while creating your ticket. Please contact an administrator.', flags: MessageFlags.Ephemeral });
      } catch (replyError) {
        console.error('Could not send error message:', replyError);
      }
    } else {
      try {
        await interaction.editReply('❌ An error occurred while creating your ticket. Please contact an administrator.');
      } catch (editError) {
        console.error('Could not edit reply:', editError);
      }
    }
  }
}

async function handleViewPackages(interaction: ButtonInteraction) {
  try {
    // Check if interaction is still valid before deferring
    if (interaction.replied || interaction.deferred) {
      console.log('Interaction already replied or deferred');
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Get ticket
    const ticket = await prisma.discord_tickets.findUnique({
      where: { ticketChannelId: interaction.channelId! },
    });

    if (!ticket) {
      await interaction.editReply('❌ This is not a valid ticket channel.');
      return;
    }

    if (ticket.discordUserId !== interaction.user.id) {
      await interaction.editReply('❌ This ticket does not belong to you.');
      return;
    }

    // Check for existing valid token
    let sessionToken = await prisma.discord_session_tokens.findFirst({
      where: {
        ticketChannelId: ticket.ticketChannelId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Generate new token if expired or doesn't exist
    if (!sessionToken) {
      const newToken = generateSessionToken({
        discordId: ticket.discordUserId,
        ticketChannelId: ticket.ticketChannelId,
        ticketId: ticket.id,
        username: ticket.discordUsername,
      });

      sessionToken = await prisma.discord_session_tokens.create({
        data: {
          token: newToken,
          discordUserId: ticket.discordUserId,
          ticketChannelId: ticket.ticketChannelId,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
    }

    const packageUrl = `${process.env.WEBSITE_URL}/packages?token=${sessionToken.token}`;
    await interaction.editReply(
      `${EMOJIS.WEB} **Click here to view packages:**\n${packageUrl}\n\n` +
      `${EMOJIS.INFO} This link is valid for 1 hour and is unique to you.`
    );

  } catch (error: any) {
    console.error('Error generating package link:', error);
    
    // Handle Discord API errors for expired interactions
    if (error.code === 10062 || error.message?.includes('Unknown interaction')) {
      console.log('Interaction expired - user likely clicked button after 15 minutes');
      return;
    }

    // Only try to reply if interaction hasn't been replied to yet
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({ content: '❌ An error occurred. Please try again.', flags: MessageFlags.Ephemeral });
      } catch (replyError) {
        console.error('Could not send error message:', replyError);
      }
    } else {
      try {
        await interaction.editReply('❌ An error occurred. Please try again.');
      } catch (editError) {
        console.error('Could not edit reply:', editError);
      }
    }
  }
}
