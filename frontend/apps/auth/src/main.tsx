import "@mantine/core/styles.css";
import "@sashecka/design-tokens/tokens.css";

import { MantineProvider } from "@mantine/core";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { configureApiClient } from "@sashecka/api-client";
import { ApiErrorNotifications } from "@sashecka/shared-ui";

import { App } from "./App";

configureApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="light">
      <BrowserRouter>
        <ApiErrorNotifications />
        <App />
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>,
);
