import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';
// import { resolve } from 'path';

// TODO: tsconfig & eslintrc: https://stackoverflow.com/questions/68217795/vite-resolve-alias-how-to-resolve-paths
// or use: https://github.com/aleclarson/vite-tsconfig-paths

export default defineConfig({
  plugins: [
    svgr({
      include: '**/*.svg?react',
    }),
    react(),
    tsconfigPaths(),
  ],
  server: {
    port: 3000,
  },
  build: {
    outDir: './build',
  },
});
