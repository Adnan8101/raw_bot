import { Client, ActivityType } from 'discord.js';

export function handleReady(client: Client) {
  console.log(`✅ Logged in as ${client.user?.tag}`);
  
  // Set bot status
  client.user?.setPresence({
    activities: [{ name: 'Event Packages | /send_embed', type: ActivityType.Watching }],
    status: 'online',
  });
}
