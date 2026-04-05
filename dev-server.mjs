// Alternative dev server entry point for Windows
// This bypasses the vite.config.ts file resolution issues

import { createServer } from 'vite';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

async function startDevServer() {
  try {
    console.log('🔧 Starting Vite development server...');
    
    // Create Vite dev server inline configuration
    const vite = await createServer({
      root: __dirname,
      server: {
        middlewareMode: true,
        port: PORT,
      },
      appType: 'spa',
      plugins: [
        (await import('@vitejs/plugin-react')).default(),
        (await import('@tailwindcss/vite')).default()
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
      },
      define: {
        'process.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(process.env.VITE_CLERK_PUBLISHABLE_KEY || ''),
      }
    });
    
    app.use(vite.middlewares);
    
    // Import and start the API server
    console.log('🔧 Starting API server...');
    await import('./server.js');
    
    console.log(`
✅ Development server running!

📱 Frontend: http://localhost:${PORT}
🔌 API: http://localhost:${PORT}/api
    `);
  } catch (error) {
    console.error('❌ Failed to start development server:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

startDevServer();
