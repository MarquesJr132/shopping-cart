import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Conditionally import lovable-tagger only in development environment
let componentTagger: any = null;
try {
  if (process.env.NODE_ENV === 'development') {
    componentTagger = require("lovable-tagger").componentTagger;
  }
} catch (e) {
  // lovable-tagger not available, continue without it
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/sika-stock-flow-94/' : './',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    componentTagger && mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
