import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: env.VITE_BASE_PATH ?? "/",
    plugins: [
      react(),
      federation({
        name: "reactAppRemote",
        dev: {
          disableDynamicRemoteTypeHints: true,
        },
        filename: "remoteEntry.js",
        exposes: {
          "./home-page": "./src/pages/HomePage.tsx",
          "./settings-page": "./src/pages/SettingsPage.tsx",
          "./group-page": "./src/pages/GroupPage.tsx",
        },
        shared: {
          react: {
            singleton: true,
          },
          "react-dom": {
            singleton: true,
          },
          "react-router-dom": {
            singleton: true,
          },
          "@mantine/core": {
            singleton: true,
          },
          "@mantine/hooks": {
            singleton: true,
          },
          "@tanstack/react-query": {
            singleton: true,
          },
        },
      }),
    ],
    server: {
      port: 4175,
      strictPort: true,
      origin: env.VITE_REACT_APP_REMOTE_ORIGIN ?? "http://localhost:4175",
    },
    preview: {
      port: 4175,
      strictPort: true,
    },
  };
});
