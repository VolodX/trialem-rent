import vituum from 'vituum';
import posthtml from '@vituum/vite-plugin-posthtml';
import postcss from '@vituum/vite-plugin-postcss';
import { copyFileSync, existsSync, readFileSync } from 'fs';
import path from 'path';

export default {
  plugins: [
    vituum(),
    postcss(),
    posthtml({
      root: './src',
      options: {
        plugins: [
          ['posthtml-include', { root: './src' }],
          [
            'posthtml-expressions',
            {
              root: './src',
              // Додаємо функцію для завантаження JSON
              locals: {
                // Завантажуємо JSON дані глобально
                ...JSON.parse(
                  readFileSync('./src/data/price-data.json', 'utf8')
                )
              },
              // Додаємо можливість читати JSON файли
              delimiters: ['{{', '}}'],
              unescapeDelimiters: ['{{{', '}}}']
            }
          ]
        ]
      }
    }),

    // Кращий HMR
    {
      name: 'custom-hmr',
      enforce: 'post',
      handleHotUpdate({ file, server }) {
        if (
          file.endsWith('.html') ||
          file.endsWith('.scss') ||
          file.endsWith('.json')
        ) {
          server.ws.send({
            type: 'full-reload',
            path: '*'
          });
        }
      }
    },

    // Безпечніше копіювання файлів
    {
      name: 'copy-static-files',
      writeBundle() {
        const filesToCopy = [
          'src/android-chrome-192x192.png',
          'src/android-chrome-512x512.png'
        ];

        filesToCopy.forEach(file => {
          if (existsSync(file)) {
            const fileName = file.split('/').pop();
            copyFileSync(file, `dist/${fileName}`);
          }
        });
      }
    }
  ],

  // Додаємо resolve для алісу @
  resolve: {
    alias: {
      '@': path.resolve('./src')
    }
  },

  build: {
    rollupOptions: {
      output: {
        assetFileNames: asset => {
          const ext = asset.name.split('.').pop();

          // Favicon та подібні файли в корінь
          if (
            ['ico', 'png', 'webmanifest'].includes(ext) &&
            (asset.name.includes('favicon') ||
              asset.name.includes('android-chrome'))
          ) {
            return '[name][extname]';
          }

          // Організація за типами
          const folders = {
            css: 'css/',
            js: 'js/',
            png: 'images/',
            jpg: 'images/',
            webp: 'images/',
            svg: 'images/',
            woff2: 'fonts/'
          };

          const folder = folders[ext] || 'assets/';
          return `${folder}[name][extname]`;
        }
      }
    }
  }
};
