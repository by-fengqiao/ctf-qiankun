import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: path.resolve(__dirname, 'client'),
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? '/ctf-qiankun/' : '/',
  resolve: { alias: { '@': path.resolve(__dirname, 'client/src'), '@client': path.resolve(__dirname, 'client'), '@shared': path.resolve(__dirname, 'shared') } },
  build: { outDir: path.resolve(__dirname, 'dist'), emptyOutDir: true },
});
