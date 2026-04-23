import {
  Alert,
  Center,
  CloseButton,
  Group,
  Loader,
  Paper,
  Portal,
  Stack,
  Text,
} from "@mantine/core";
import { API_ERROR_EVENT, type ApiErrorNotification } from "@sashecka/api-client";
import { Component, type ReactNode, useEffect, useRef, useState } from "react";

type RemoteErrorBoundaryProps = {
  children: ReactNode;
};

type RemoteErrorBoundaryState = {
  hasError: boolean;
  errorMessage?: string;
};

export class RemoteErrorBoundary extends Component<
  RemoteErrorBoundaryProps,
  RemoteErrorBoundaryState
> {
  state: RemoteErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(error: Error): RemoteErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Alert color="red" title="Remote failed to load" radius="md" mt="md">
          {this.state.errorMessage ?? "Unknown error"}
        </Alert>
      );
    }

    return this.props.children;
  }
}

export function PageLoader({ label = "Loading..." }: { label?: string }): ReactNode {
  return (
    <Center mih={240}>
      <Stack gap="xs" align="center">
        <Loader color="indigo" />
        <Text c="dimmed" size="sm">
          {label}
        </Text>
      </Stack>
    </Center>
  );
}

export function ApiErrorNotifications(): ReactNode {
  const [items, setItems] = useState<ApiErrorNotification[]>([]);
  const timeoutsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    function removeItem(id: string) {
      const timeoutId = timeoutsRef.current.get(id);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutsRef.current.delete(id);
      }

      setItems((current) => current.filter((item) => item.id !== id));
    }

    function onApiError(event: Event) {
      const customEvent = event as CustomEvent<ApiErrorNotification>;
      const detail = customEvent.detail;
      if (!detail) {
        return;
      }

      setItems((current) => [detail, ...current].slice(0, 5));
      const timeoutId = window.setTimeout(() => removeItem(detail.id), 5000);
      timeoutsRef.current.set(detail.id, timeoutId);
    }

    window.addEventListener(API_ERROR_EVENT, onApiError as EventListener);

    return () => {
      window.removeEventListener(API_ERROR_EVENT, onApiError as EventListener);
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutsRef.current.clear();
    };
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <Portal>
      <Stack
        gap="sm"
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          width: "min(420px, calc(100vw - 32px))",
          zIndex: 500,
        }}
      >
        {items.map((item) => (
          <Paper
            key={item.id}
            shadow="lg"
            radius="lg"
            p="md"
            withBorder
            style={{
              borderColor: item.status === 401 ? "#fcc419" : "#ffa8a8",
            }}
          >
            <Group align="flex-start" justify="space-between" wrap="nowrap">
              <Stack gap={4} style={{ flex: 1 }}>
                <Text fw={700} size="sm">
                  {item.title}
                </Text>
                <Text size="sm">{item.message}</Text>
                <Text c="dimmed" size="xs">
                  {item.path} | HTTP {item.status}
                </Text>
              </Stack>
              <CloseButton
                onClick={() =>
                  setItems((current) => current.filter((entry) => entry.id !== item.id))
                }
              />
            </Group>
          </Paper>
        ))}
      </Stack>
    </Portal>
  );
}
