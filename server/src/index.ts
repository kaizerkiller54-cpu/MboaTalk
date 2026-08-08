import { createServer } from 'http';
import { createApp } from './app';
import { setupSocket } from './socket';
import { env } from './config/env';

const app = createApp();
const httpServer = createServer(app);
setupSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`[mboaTalk Backend] Modular server running on http://localhost:${env.PORT}`);
});
