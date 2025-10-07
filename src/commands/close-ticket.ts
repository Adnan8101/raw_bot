import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  TextChannel,
} from 'discord.js';
import { prisma } from '../utils/prisma';
import { ADMIN_IDS } from '../config/config';

export const data = new SlashCommandBuilder()
  .setName('close_ticket')
  .setDescription('[ADMIN] Force close a ticket')
  .addChannelOption((option) =>
    option
      .setName('ticket_channel')
      .setDescription('The ticket channel to close')
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

    const channel = interaction.options.getChannel('ticket_channel', true);

    // Find ticket in database
    const ticket = await prisma.discord_tickets.findUnique({
      where: { ticketChannelId: channel.id },
    });

    if (!ticket) {
      await interaction.reply({
        content: '❌ This channel is not a ticket.',
        ephemeral: true,
      });
      return;
    }

    // Update ticket status
    await prisma.discord_tickets.update({
      where: { id: ticket.id },
      data: {
        status: 'closed',
        closedAt: new Date(),
      },
    });

    // Send closing message
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('🔒 Ticket Closed')
      .setDescription(`This ticket has been closed by an administrator.`)
      .setFooter({ text: 'Managed by Raw Studio' })
      .setTimestamp();

    const ticketChannel = channel as TextChannel;
    await ticketChannel.send({ embeds: [embed] });

    // Delete channel after 10 seconds
    setTimeout(async () => {
      try {
        await ticketChannel.delete();
      } catch (error) {
        console.error('Error deleting ticket channel:', error);
      }
    }, 10000);

    await interaction.reply({
      content: `✅ Ticket closed successfully. Channel will be deleted in 10 seconds.`,
      ephemeral: true,
    });

    console.log(`[ADMIN] ${interaction.user.tag} closed ticket ${channel.id}`);
  } catch (error) {
    console.error('Error in close-ticket command:', error);
    await interaction.reply({
      content: '❌ An error occurred while closing the ticket.',
      ephemeral: true,
    });
  }
}

export const closeTicketCommand = { data, execute };
