import { mount } from "./mount";

const root = document.getElementById("app");

if (root) {
  mount(root, {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
    routePath: "/profile",
  });
}
