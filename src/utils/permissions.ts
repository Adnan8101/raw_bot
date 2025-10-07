import { CommandInteraction } from 'discord.js';

export function isAdmin(userId: string): boolean {
  const adminIds = process.env.ADMIN_IDS?.split(',').map(id => id.trim()) || [];
  return adminIds.includes(userId);
}

export async function checkAdminPermission(interaction: CommandInteraction): Promise<boolean> {
  if (!isAdmin(interaction.user.id)) {
    await interaction.reply({
      content: '❌ You do not have permission to use this command. Only admins can execute this.',
      ephemeral: true,
    });
    return false;
  }
  return true;
}
