import "@sashecka/design-tokens/tokens.css";
import "primeicons/primeicons.css";

import Aura from "@primeuix/themes/aura";
import PrimeVue from "primevue/config";
import { createApp } from "vue";

import { configureApiClient } from "@sashecka/api-client";

import App from "./App.vue";

export function mount(
  element: HTMLElement,
  props: { apiBaseUrl: string; routePath: string },
): () => void {
  configureApiClient({
    baseUrl: props.apiBaseUrl,
  });

  const app = createApp(App, props);
  app.use(PrimeVue, {
    theme: {
      preset: Aura,
    },
  });
  app.mount(element);

  return () => {
    app.unmount();
  };
}
