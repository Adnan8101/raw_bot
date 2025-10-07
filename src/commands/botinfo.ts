import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import { ADMIN_IDS } from '../config/config';
import os from 'os';

export const data = new SlashCommandBuilder()
  .setName('botinfo')
  .setDescription('[ADMIN] Display bot and system information')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    // Admin check
    if (!ADMIN_IDS.includes(interaction.user.id)) {
      await interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true,
      });
      return;
    }

    // Get system information
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);

    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || 'Unknown';
    const cpuCount = cpus.length;

    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);
    const uptimeSeconds = Math.floor(uptime % 60);

    const platform = os.platform();
    const arch = os.arch();
    const hostname = os.hostname();
    const nodeVersion = process.version;

    // Discord client info
    const client = interaction.client;
    const ping = client.ws.ping;
    const serverCount = client.guilds.cache.size;
    const userCount = client.users.cache.size;

    const embed = new EmbedBuilder()
      .setTitle('Bot Information')
      .setColor('#5865F2')
      .addFields(
        {
          name: 'Bot Details',
          value: [
            `Bot Name: ${client.user?.tag}`,
            `Bot ID: ${client.user?.id}`,
            `Ping: ${ping}ms`,
            `Servers: ${serverCount}`,
            `Users: ${userCount}`,
          ].join('\n'),
          inline: false,
        },
        {
          name: 'System Information',
          value: [
            `Hostname: ${hostname}`,
            `Platform: ${platform}`,
            `Architecture: ${arch}`,
            `Node Version: ${nodeVersion}`,
          ].join('\n'),
          inline: false,
        },
        {
          name: 'CPU Information',
          value: [
            `Model: ${cpuModel}`,
            `Cores: ${cpuCount}`,
          ].join('\n'),
          inline: true,
        },
        {
          name: 'Memory Information',
          value: [
            `Total: ${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
            `Used: ${(usedMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
            `Free: ${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
            `Usage: ${memoryUsagePercent}%`,
          ].join('\n'),
          inline: true,
        },
        {
          name: 'Uptime',
          value: `${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`,
          inline: false,
        },
        {
          name: 'Links',
          value: '[Package Selection Portal](https://rawstudio.live)',
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Raw Studio Bot' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error('Error executing botinfo command:', error);
    await interaction.reply({
      content: 'An error occurred while executing the command.',
      ephemeral: true,
    });
  }
}

export const botinfoCommand = { data, execute };
