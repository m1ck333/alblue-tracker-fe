import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5941,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split big third-party libraries into their own chunks so the
        // app code chunks stay small AND vendor caches don't bust whenever
        // app code changes. Order matters — more specific tests first.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('antd') || id.includes('@ant-design/icons') || id.includes('rc-')) return 'vendor-antd';
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('@tanstack/react-query')) return 'vendor-react-query';
          if (id.includes('exceljs')) return 'vendor-exceljs';
          if (id.includes('react-markdown') || id.includes('remark-') || id.includes('rehype-')) return 'vendor-markdown';
          if (id.includes('dayjs')) return 'vendor-dayjs';
          if (id.includes('@microsoft/signalr')) return 'vendor-signalr';
          if (id.includes('react-dom')) return 'vendor-react';
          if (id.includes('react/')) return 'vendor-react';
          return undefined;
        },
      },
    },
  },
});
