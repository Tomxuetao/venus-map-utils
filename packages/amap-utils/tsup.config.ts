import { defineConfig } from 'tsup'

export default defineConfig({
  dts: true,
  clean: true,
  minify: true,
  splitting: true,
  format: ['esm', 'cjs'],
  entry: ['src/index.ts']
})
