import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  server: { port: 6576 },
  plugins: [solid(), tailwindcss(), tsconfigPaths({ root: './' })],
})
