import vue from "@vitejs/plugin-vue";
import { federation } from "@module-federation/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: env.VITE_BASE_PATH ?? "/",
    plugins: [
      vue(),
      federation({
        name: "profileVueRemote",
        dev: {
          disableDynamicRemoteTypeHints: true,
        },
        filename: "remoteEntry.js",
        exposes: {
          "./mount": "./src/mount.ts",
        },
      }),
    ],
    server: {
      port: 4176,
      strictPort: true,
      origin: env.VITE_PROFILE_VUE_REMOTE_ORIGIN ?? "http://localhost:4176",
    },
    preview: {
      port: 4176,
      strictPort: true,
    },
  };
});
