import { Request, Response } from 'express';
import { EmbedBuilder } from 'discord.js';
import { prisma } from '../index';
import { client } from '../index';
import { verifySessionToken } from '../utils/token';
import { EMBED_COLORS, EMOJIS, PACKAGES } from '../config/constants';

interface PackageSelectionPayload {
  token: string;
  discordId: string;
  ticketChannelId: string;
  packageName: string;
  packagePrice?: string;
  eventDateTime: string;
  serverLink: string;
  customRequests?: string;
}

export async function handlePackageSelection(req: Request, res: Response) {
  try {
    // Verify webhook secret
    const webhookSecret = req.headers['x-webhook-secret'];
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload: PackageSelectionPayload = req.body;

    // Verify session token
    const tokenPayload = verifySessionToken(payload.token);
    if (!tokenPayload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Verify token matches payload
    if (tokenPayload.discordId !== payload.discordId || tokenPayload.ticketChannelId !== payload.ticketChannelId) {
      return res.status(403).json({ error: 'Token mismatch' });
    }

    // Get ticket
    const ticket = await prisma.discord_tickets.findUnique({
      where: { ticketChannelId: payload.ticketChannelId },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Save package selection
    const packageSelection = await prisma.discord_package_selections.create({
      data: {
        ticketId: ticket.id,
        discordUserId: payload.discordId,
        packageName: payload.packageName,
        eventDateTime: new Date(payload.eventDateTime),
        serverLink: payload.serverLink,
        customRequests: payload.customRequests,
        selectionStatus: 'pending',
      },
    });

    // Update ticket status
    await prisma.discord_tickets.update({
      where: { id: ticket.id },
      data: { status: 'AWAITING_RESPONSE' },
    });

    // Send embed to ticket channel
    const channel = await client.channels.fetch(payload.ticketChannelId);
    if (!channel || !channel.isTextBased()) {
      return res.status(500).json({ error: 'Invalid channel' });
    }

    // Delete the welcome message if it exists
    if (ticket.welcomeMessageId && channel?.isTextBased() && 'messages' in channel) {
      try {
        const welcomeMessage = await channel.messages.fetch(ticket.welcomeMessageId);
        await welcomeMessage.delete();
        console.log(`✅ Deleted welcome message ${ticket.welcomeMessageId}`);
      } catch (error) {
        console.log(`⚠️ Could not delete welcome message: ${error}`);
        // Continue even if message deletion fails
      }
    }

    // Find package details
    const packageInfo = PACKAGES.find(pkg => pkg.name === payload.packageName);

    const embed = new EmbedBuilder()
      .setColor('#FF69B4')
      .setTitle(' Package Selected')
      .addFields(
        { name: ' User', value: `<@${payload.discordId}>`, inline: true },
        { name: ' Package', value: payload.packageName, inline: true },
        { name: '\u200B', value: '\u200B', inline: true }
      );

    // Add package details if found
    if (packageInfo) {
      embed.addFields(
        { name: '💰 Price', value: packageInfo.price, inline: true },
        { name: '🎤 Hosts', value: packageInfo.hosts, inline: true },
        { name: '🎵 Artists', value: packageInfo.artists, inline: true },
        { name: '⏱️ Duration', value: packageInfo.duration, inline: false },
        { name: '✨ Features', value: packageInfo.features.map(f => `• ${f}`).join('\n'), inline: false }
      );
    }

    // Add event details
    embed.addFields(
      { name: ' Event Date & Time', value: new Date(payload.eventDateTime).toLocaleString('en-US', { 
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
      }), inline: false },
      { name: '🔗 Server Link', value: payload.serverLink, inline: false }
    );

    if (payload.customRequests && payload.customRequests.trim()) {
      embed.addFields({ name: '📝 Additional Notes', value: payload.customRequests, inline: false });
    }

    embed
      .setFooter({ text: 'Our team will review and respond shortly' })
      .setTimestamp();

    if (channel?.isTextBased() && 'send' in channel) {
      await channel.send({
        content: `<@929297205796417597><@565240656994238484> Package selection received! Let's make the event memorable!`,
        embeds: [embed],
      });
    }

    res.json({
      success: true,
      message: 'Package selection received',
      selectionId: packageSelection.id,
    });

  } catch (error) {
    console.error('Error handling package selection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
