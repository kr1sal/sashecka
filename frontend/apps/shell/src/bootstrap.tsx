import "@mantine/core/styles.css";
import "@sashecka/design-tokens/tokens.css";

import { MantineProvider } from "@mantine/core";
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import { configureApiClient, isApiRequestError } from "@sashecka/api-client";
import { ApiErrorNotifications } from "@sashecka/shared-ui";

import { App } from "./App";

configureApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (isApiRequestError(error) && error.status < 500) {
          return false;
        }

        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="light">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ApiErrorNotifications />
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </MantineProvider>
  </React.StrictMode>,
);
