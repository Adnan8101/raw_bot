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

export function startWebhookServer() {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🌐 Webhook server listening on port ${PORT}`);
  });
}
