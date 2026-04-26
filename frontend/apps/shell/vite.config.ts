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
        name: "shell",
        dev: {
          disableDynamicRemoteTypeHints: true,
        },
        dts: {
          consumeTypes: false,
        },
        remotes: {
          authRemote: {
            type: "module",
            name: "authRemote",
            entry:
              env.VITE_AUTH_REMOTE_URL ??
              "http://localhost:4174/remoteEntry.js",
          },
          reactAppRemote: {
            type: "module",
            name: "reactAppRemote",
            entry:
              env.VITE_REACT_APP_REMOTE_URL ??
              "http://localhost:4175/remoteEntry.js",
          },
          profileVueRemote: {
            type: "module",
            name: "profileVueRemote",
            entry:
              env.VITE_PROFILE_VUE_REMOTE_URL ??
              "http://localhost:4176/remoteEntry.js",
          },
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
      port: 4173,
      strictPort: true,
      origin: env.VITE_SHELL_ORIGIN ?? "http://localhost:4173",
      proxy: {
        "/api": {
          target: env.VITE_BACKEND_ORIGIN ?? "http://127.0.0.1:8000",
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 4173,
      strictPort: true,
    },
  };
});
