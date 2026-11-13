import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { priceHistoryPlugin } from './vite-price-history-plugin.js';
import { portalFeedPlugin } from './vite-portal-feed-plugin.js';

export default defineConfig({
  plugins: [react(), priceHistoryPlugin(), portalFeedPlugin()],
  server: {
    port: 5173,
    open: true,
  },
});

