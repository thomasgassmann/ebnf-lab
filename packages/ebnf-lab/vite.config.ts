import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: { index: fileURLToPath(new URL('./src/index.ts', import.meta.url)), core: fileURLToPath(new URL('./src/core.ts', import.meta.url)) },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
      cssFileName: 'ebnf-lab'
    },
    rollupOptions: {
      external: [/^react(\/|$)/, /^react-dom(\/|$)/, /^@monaco-editor\/react$/, /^monaco-editor$/, /^@radix-ui\//, /^lucide-react$/, /^class-variance-authority$/, /^clsx$/, /^tailwind-merge$/]
    }
  }
});
