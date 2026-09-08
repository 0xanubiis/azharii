import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Fallbacks so production builds (e.g. on external hosts where the local .env
// file is not available) still receive the public backend connection values.
// Both values are publishable/anon and safe to ship to the browser.
const FALLBACK_SUPABASE_URL = "https://krwhkobsqrnuwisjxjyv.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtyd2hrb2JzcXJudXdpc2p4anl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzAzNDUsImV4cCI6MjA3OTQwNjM0NX0.MrVMl60ePE5bd0q-HCMaVuZa3nJ5gjyMvF3rR_GIhzo";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL,
      ),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_PUBLISHABLE_KEY,
      ),
    },
  };
});
