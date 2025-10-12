import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'editorjs': [
            '@editorjs/editorjs',
            '@editorjs/header',
            '@editorjs/list',
            '@editorjs/paragraph',
            '@editorjs/code',
            '@editorjs/quote',
            '@editorjs/delimiter',
            '@editorjs/inline-code',
            '@editorjs/marker',
            '@editorjs/table',
            '@editorjs/warning',
            '@editorjs/embed',
            '@editorjs/link',
            '@editorjs/raw',
            '@editorjs/simple-image',
            '@editorjs/checklist',
          ],
        },
      },
      onwarn(warning, warn) {
        // Suppress PURE comment warnings
        if (warning.code === 'ANNOTATION_POSITION' || 
            warning.message.includes('/*#__PURE__*/')) {
          return;
        }
        warn(warning);
      },
    },
  },
  optimizeDeps: {
    include: [
      '@editorjs/editorjs',
      '@editorjs/header',
      '@editorjs/list',
      '@editorjs/paragraph',
      '@editorjs/code',
      '@editorjs/quote',
      '@editorjs/delimiter',
      '@editorjs/inline-code',
      '@editorjs/marker',
      '@editorjs/table',
      '@editorjs/warning',
      '@editorjs/embed',
      '@editorjs/link',
      '@editorjs/raw',
      '@editorjs/simple-image',
      '@editorjs/checklist',
    ],
    esbuildOptions: {
      legalComments: 'none',
    },
  },
}));
