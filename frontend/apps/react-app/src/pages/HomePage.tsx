import {
  Badge,
  Card,
  Grid,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";

import { listGroups, listUsers } from "@sashecka/api-client";
import { useAuthSession } from "@sashecka/auth-session/react";
import { PageLoader } from "@sashecka/shared-ui";

export function HomePage() {
  const { user } = useAuthSession();
  const [query, setQuery] = useState("");

  const usersQuery = useQuery({
    queryKey: ["sashecka", "users", query],
    queryFn: () => listUsers(query),
  });

  const groupsQuery = useQuery({
    queryKey: ["sashecka", "groups", query],
    queryFn: () => listGroups(query),
  });

  if (usersQuery.isLoading || groupsQuery.isLoading) {
    return <PageLoader label="Ищем пользователей и группы..." />;
  }

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={2}>Главная</Title>
        <Text c="dimmed">
          Привет, {user?.full_name || user?.username}. Здесь можно быстро искать
          пользователей и группы.
        </Text>
      </Stack>

      <TextInput
        placeholder="Поиск по пользователям и группам"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack>
            <Group justify="space-between">
              <Title order={3}>Пользователи</Title>
              <Badge variant="light">{usersQuery.data?.length ?? 0}</Badge>
            </Group>
            {usersQuery.data?.map((item) => (
              <Card key={item.id} withBorder radius="lg">
                <Stack gap={4}>
                  <Text fw={600}>{item.full_name || item.username}</Text>
                  <Text size="sm" c="dimmed">
                    @{item.username}
                  </Text>
                  <Text size="sm">{item.email}</Text>
                </Stack>
              </Card>
            ))}
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack>
            <Group justify="space-between">
              <Title order={3}>Группы</Title>
              <Badge variant="light">{groupsQuery.data?.length ?? 0}</Badge>
            </Group>
            {groupsQuery.data?.map((item) => (
              <Card
                key={item.id}
                withBorder
                radius="lg"
                component={Link}
                to={`/groups/${item.id}`}
              >
                <Stack gap={4}>
                  <Text fw={600}>{item.name}</Text>
                  <Text size="sm" c="dimmed">
                    {item.description || "Без описания"}
                  </Text>
                </Stack>
              </Card>
            ))}
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
