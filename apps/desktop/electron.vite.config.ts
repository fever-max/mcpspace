import { defineConfig } from 'electron-vite'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        output: {
          format: 'cjs',
        },
      },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        output: {
          format: 'cjs',
        },
      },
    },
  },
  renderer: {},
})