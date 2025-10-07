import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { prisma } from '../index';
import { client } from '../index';
import { generateSessionToken } from './token';
import { EMBED_COLORS, EMOJIS } from '../config/constants';
import { WEBSITE_URL } from '../config/config';

const SIX_HOURS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_REMINDERS = 3; // Send 3 reminders (at 6h, 12h, 18h)

export async function startTicketReminderSystem() {
  console.log('🔔 Starting ticket reminder system...');
  
  // Run every hour
  setInterval(async () => {
    await checkAndSendReminders();
  }, 60 * 60 * 1000); // Every hour

  // Run immediately on startup
  await checkAndSendReminders();
}

async function checkAndSendReminders() {
  try {
    const now = new Date();

    // Find tickets that need reminders or deletion
    const tickets = await prisma.discord_tickets.findMany({
      where: {
        status: 'open',
      },
      include: {
        package_selections: true,
      },
    });

    for (const ticket of tickets) {
      // Skip if package already selected
      if (ticket.package_selections.length > 0) {
        continue;
      }

      const ticketAge = now.getTime() - ticket.createdAt.getTime();

      // Delete ticket if older than 24 hours and no package selected
      if (ticketAge >= TWENTY_FOUR_HOURS) {
        await deleteInactiveTicket(ticket);
        continue;
      }

      // Check if reminder is needed
      const timeSinceLastReminder = ticket.lastReminderAt
        ? now.getTime() - ticket.lastReminderAt.getTime()
        : ticketAge;

      // Send reminder every 6 hours, max 3 reminders
      if (
        timeSinceLastReminder >= SIX_HOURS &&
        ticket.reminderCount < MAX_REMINDERS
      ) {
        await sendReminder(ticket);
      }
    }
  } catch (error) {
    console.error('Error in ticket reminder system:', error);
  }
}

async function sendReminder(ticket: any) {
  try {
    const channel = await client.channels.fetch(ticket.ticketChannelId);
    if (!channel || !channel.isTextBased()) {
      console.log(`❌ Cannot send reminder: Channel ${ticket.ticketChannelId} not found or not text-based`);
      return;
    }

    // Generate fresh session token
    const sessionToken = generateSessionToken({
      discordId: ticket.discordUserId,
      ticketChannelId: ticket.ticketChannelId,
      ticketId: ticket.id,
      username: ticket.discordUsername,
    });

    // Store new session token
    await prisma.discord_session_tokens.create({
      data: {
        token: sessionToken,
        discordUserId: ticket.discordUserId,
        ticketChannelId: ticket.ticketChannelId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    const reminderNumber = ticket.reminderCount + 1;
    const hoursRemaining = Math.floor(
      (TWENTY_FOUR_HOURS - (Date.now() - ticket.createdAt.getTime())) / (60 * 60 * 1000)
    );

    const embed = new EmbedBuilder()
      .setColor(reminderNumber === MAX_REMINDERS ? '#FF0000' : '#FFA500')
      .setTitle(`${EMOJIS.WARNING} Reminder: Complete Your Package Selection`)
      .setDescription(
        `Hi <@${ticket.discordUserId}>!\n\n` +
        `We noticed you haven't completed your package selection yet.\n\n` +
        `${EMOJIS.INFO} **Important:**\n` +
        `• This ticket will be automatically deleted in **${hoursRemaining} hours** if no package is selected\n` +
        `• Click the button below to view our packages and complete your selection\n` +
        `• We've generated a fresh session link for you\n\n` +
        (reminderNumber === MAX_REMINDERS
          ? `⚠️ **This is your final reminder!** After this, the ticket will be closed automatically.\n\n`
          : '') +
        `Need help? Just ask here and our team will assist you!`
      )
      .setFooter({ text: `Reminder ${reminderNumber}/${MAX_REMINDERS} • Raw Studio` })
      .setTimestamp();

    const button = new ButtonBuilder()
      .setLabel('View Packages & Complete Selection')
      .setStyle(ButtonStyle.Link)
      .setURL(`${WEBSITE_URL}/packages?token=${sessionToken}`)
      .setEmoji(EMOJIS.PACKAGE);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    if ('send' in channel) {
      await channel.send({
        content: `<@${ticket.discordUserId}>`,
        embeds: [embed],
        components: [row],
      });
    }

    // Update ticket with reminder info
    await prisma.discord_tickets.update({
      where: { id: ticket.id },
      data: {
        lastReminderAt: new Date(),
        reminderCount: reminderNumber,
      },
    });

    console.log(
      `✅ Sent reminder ${reminderNumber}/${MAX_REMINDERS} to ticket ${ticket.ticketChannelId}`
    );
  } catch (error) {
    console.error(`Error sending reminder for ticket ${ticket.id}:`, error);
  }
}

async function deleteInactiveTicket(ticket: any) {
  try {
    const channel = await client.channels.fetch(ticket.ticketChannelId);
    
    if (channel && channel.isTextBased()) {
      // Send final message before deletion
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle(`${EMOJIS.ERROR} Ticket Auto-Closed`)
        .setDescription(
          `This ticket has been automatically closed due to inactivity.\n\n` +
          `**Reason:** No package selection within 24 hours\n\n` +
          `If you still need assistance, please create a new ticket.\n` +
          `This channel will be deleted in 10 seconds.`
        )
        .setFooter({ text: 'Raw Studio' })
        .setTimestamp();

      if ('send' in channel) {
        await channel.send({
          content: `<@${ticket.discordUserId}>`,
          embeds: [embed],
        });
      }

      // Wait 10 seconds then delete channel
      setTimeout(async () => {
        try {
          if (channel && 'delete' in channel) {
            await (channel as any).delete('Auto-closed due to inactivity');
          }
        } catch (error) {
          console.error(`Error deleting channel ${ticket.ticketChannelId}:`, error);
        }
      }, 10000);
    }

    // Update ticket status in database
    await prisma.discord_tickets.update({
      where: { id: ticket.id },
      data: {
        status: 'auto_closed',
        closedAt: new Date(),
      },
    });

    console.log(`🗑️ Auto-closed inactive ticket ${ticket.ticketChannelId}`);
  } catch (error) {
    console.error(`Error deleting inactive ticket ${ticket.id}:`, error);
  }
}
