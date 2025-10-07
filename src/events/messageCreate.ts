import { Message, EmbedBuilder } from 'discord.js';

export async function handleMessageCreate(message: Message) {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Check if the bot was mentioned
  if (message.mentions.has(message.client.user!.id)) {
    const embed = new EmbedBuilder()
      .setTitle('I am alive!')
      .setColor('#5865F2')
      .setDescription('Raw Studio Bot is online and ready to help with your event tickets.')
      .addFields(
        {
          name: 'Status',
          value: 'Online and operational',
          inline: true,
        },
        {
          name: 'Ping',
          value: `${message.client.ws.ping}ms`,
          inline: true,
        }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
}
