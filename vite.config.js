import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    handlebars({
      partialDirectory: [
        resolve(__dirname, 'components'),
        resolve(__dirname, 'sections'),
      ],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        design: resolve(__dirname, 'pages/design-system.html'),
      },
    },
  },
});
