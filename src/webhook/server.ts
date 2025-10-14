import express from 'express';
import { handlePackageSelection } from './packageSelection';

const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Webhook endpoint for package selection from website
app.post('/webhook/package-selection', handlePackageSelection);

// Webhook endpoint for notice board
app.post('/webhook/notice', async (req, res) => {
  try {
    const { noticeId, title, notice, channelId, date, remarks } = req.body;

    if (!channelId || !title || !notice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Dynamically import client
    const { client } = await import('../index');
    
    const channel = await client.channels.fetch(channelId);
    
    if (!channel || !channel.isTextBased() || !('send' in channel)) {
      return res.status(400).json({ error: 'Invalid channel or channel is not text-based' });
    }

    // Create embed
    const embed = {
      title: `📢 ${title}`,
      description: notice,
      color: 0x9333EA, // Purple color
      fields: [] as any[],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Raw Studio Notice Board'
      }
    };

    if (date) {
      embed.fields.push({
        name: '📅 Date',
        value: new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        inline: true
      });
    }

    if (remarks) {
      embed.fields.push({
        name: '📝 Remarks',
        value: remarks,
        inline: true
      });
    }

    const message = await channel.send({ embeds: [embed] });
    
    res.json({ 
      success: true, 
      messageId: message.id,
      channelId: channel.id
    });
  } catch (error) {
    console.error('Error sending notice to Discord:', error);
    res.status(500).json({ 
      error: 'Failed to send notice to Discord',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export function startWebhookServer() {
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    console.log(`🌐 Webhook server listening on port ${PORT}`);
  });
}
