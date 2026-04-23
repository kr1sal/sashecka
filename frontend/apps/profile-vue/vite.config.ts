import vue from "@vitejs/plugin-vue";
import { federation } from "@module-federation/vite";
import { defineConfig } from "vite";

export default defineConfig({
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
    origin: "http://localhost:4176",
  },
  preview: {
    port: 4176,
    strictPort: true,
  },
});
