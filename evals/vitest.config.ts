// The evals run through vitest only for its TypeScript and path-alias handling.
// They call the real providers, so they are not part of `npm test`.
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
  },
  test: {
    root: fileURLToPath(new URL('..', import.meta.url)),
    include: ['evals/run.eval.ts'],
    environment: 'node',
    testTimeout: 30 * 60 * 1000,
    reporters: ['default'],
  },
})
