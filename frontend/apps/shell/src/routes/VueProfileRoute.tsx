import { Alert } from "@mantine/core";
import { useEffect, useRef, useState } from "react";

import { PageLoader } from "@sashecka/shared-ui";

type RemoteMount = typeof import("profileVueRemote/mount");

export function VueProfileRoute() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let mounted = true;

    async function loadRemote() {
      try {
        const remote: RemoteMount = await import("profileVueRemote/mount");
        if (!mounted || !containerRef.current) {
          return;
        }

        cleanup = remote.mount(containerRef.current, {
          apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
          routePath: "/profile",
        });
        setReady(true);
      } catch (loadError) {
        setError("Не удалось загрузить Vue profile remote.");
      }
    }

    loadRemote();

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, []);

  if (error) {
    return <Alert color="red">{error}</Alert>;
  }

  return (
    <>
      {!ready ? <PageLoader label="Подключаем Vue profile remote..." /> : null}
      <div ref={containerRef} />
    </>
  );
}
