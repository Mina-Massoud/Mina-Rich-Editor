import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/lib/index.ts'],
  format: ['esm', 'cjs'],
  dts: { tsconfig: 'tsconfig.lib.json' },
  splitting: true,
  treeshake: true,
  clean: true,
  outDir: 'dist',
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.cjs' };
  },
  external: ['react', 'react-dom', 'zustand'],
  banner: {
    js: '"use client";',
  },
});
