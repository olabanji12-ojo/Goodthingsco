import { defineConfig, loadEnv, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(async ({ command, mode }) => {
  // Populate process.env with .env variables so devApiPlugin and Firebase initialization have access
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  const plugins: PluginOption[] = [react()];

  if (command === 'serve') {
    const { devApiPlugin } = await import('./server/viteApiPlugin');
    plugins.push(devApiPlugin());
  }

  return {
    plugins,
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      port: 5174,
      strictPort: false,
      watch: {
        usePolling: true,
        interval: 800,
      },
    },
    build: {
      emptyOutDir: true,
      outDir: 'dist',
    },
  };
});
