import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@packages': path.resolve(__dirname, '../../packages'),
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
});
