import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { priceHistoryPlugin } from './vite-price-history-plugin.js';

export default defineConfig({
  plugins: [react(), priceHistoryPlugin()],
  server: {
    port: 5173,
    open: true,
  },
});

