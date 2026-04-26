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
        name: "authRemote",
        dev: {
          disableDynamicRemoteTypeHints: true,
        },
        filename: "remoteEntry.js",
        exposes: {
          "./login-page": "./src/pages/LoginPage.tsx",
          "./register-page": "./src/pages/RegisterPage.tsx",
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
        },
      }),
    ],
    server: {
      port: 4174,
      strictPort: true,
      origin: env.VITE_AUTH_REMOTE_ORIGIN ?? "http://localhost:4174",
    },
    preview: {
      port: 4174,
      strictPort: true,
    },
  };
});
