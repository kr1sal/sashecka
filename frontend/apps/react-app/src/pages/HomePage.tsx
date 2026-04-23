import {
  Button,
  Badge,
  Card,
  Grid,
  Group,
  Modal,
  MultiSelect,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createGroup, listGroups, listUsers } from "@sashecka/api-client";
import { useAuthSession } from "@sashecka/auth-session/react";
import { PageLoader } from "@sashecka/shared-ui";

const GRANT_OPTIONS = [
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "delete", label: "Delete" },
];

type AccessDraft = {
  key: string;
  user_id?: number | null;
  grants: string[];
  isCommon?: boolean;
};

function createCommonAccessDraft(): AccessDraft {
  return {
    key: "common-access",
    user_id: null,
    grants: ["read"],
    isCommon: true,
  };
}

function createInvitationDraft(): AccessDraft {
  return {
    key: `access-${Math.random().toString(36).slice(2, 10)}`,
    user_id: undefined,
    grants: ["read"],
    isCommon: false,
  };
}

export function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthSession();
  const [query, setQuery] = useState("");
  const [createOpened, { open: openCreateModal, close: closeCreateModal }] =
    useDisclosure(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [draftAccesses, setDraftAccesses] = useState<AccessDraft[]>([
    createCommonAccessDraft(),
  ]);

  const usersQuery = useQuery({
    queryKey: ["sashecka", "users", query],
    queryFn: () => listUsers(query),
  });

  const groupsQuery = useQuery({
    queryKey: ["sashecka", "groups", query],
    queryFn: () => listGroups(query),
  });
  const selectableUsersQuery = useQuery({
    queryKey: ["sashecka", "users", "create-group"],
    queryFn: () => listUsers(),
    enabled: createOpened,
  });

  const selectableUsers = useMemo(
    () => (selectableUsersQuery.data ?? []).filter((item) => item.id !== user?.id),
    [selectableUsersQuery.data, user?.id],
  );
  const duplicateUserIds = useMemo(() => {
    const counts = new Map<number, number>();

    draftAccesses.forEach((access) => {
      if (access.isCommon || access.user_id === undefined || access.user_id === null) {
        return;
      }
      counts.set(access.user_id, (counts.get(access.user_id) ?? 0) + 1);
    });

    return new Set(
      Array.from(counts.entries())
        .filter(([, count]) => count > 1)
        .map(([userId]) => userId),
    );
  }, [draftAccesses]);
  const hasInvalidAccesses = draftAccesses.some((access) => {
    if (access.grants.length === 0) {
      return true;
    }
    if (access.isCommon) {
      return false;
    }
    if (access.user_id === undefined || access.user_id === null) {
      return true;
    }
    return duplicateUserIds.has(access.user_id);
  });

  function resetCreateForm() {
    setGroupName("");
    setGroupDescription("");
    setDraftAccesses([createCommonAccessDraft()]);
  }

  function handleCloseCreateModal() {
    createGroupMutation.reset();
    closeCreateModal();
    resetCreateForm();
  }

  const createGroupMutation = useMutation({
    mutationFn: () =>
      createGroup({
        name: groupName.trim(),
        description: groupDescription.trim() || null,
        accesses: draftAccesses.map((access) => ({
          user_id: access.isCommon ? null : (access.user_id ?? null),
          grants: access.grants,
        })),
      }),
    onSuccess: (createdGroup) => {
      handleCloseCreateModal();
      queryClient.invalidateQueries({ queryKey: ["sashecka", "groups"] });
      queryClient.setQueryData(["sashecka", "group", createdGroup.id], createdGroup);
      navigate(`/groups/${createdGroup.id}`);
    },
  });
  const canCreateGroup =
    groupName.trim().length >= 3 && !hasInvalidAccesses && !createGroupMutation.isPending;

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

      <Group justify="space-between" align="flex-end">
        <TextInput
          placeholder="Поиск по пользователям и группам"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Button onClick={openCreateModal}>Создать группу</Button>
      </Group>

      <Modal
        opened={createOpened}
        onClose={handleCloseCreateModal}
        title="Создать группу"
        size="lg"
      >
        <Stack gap="lg">
          <Stack gap="xs">
            <TextInput
              label="Название"
              placeholder="Например, Product team"
              value={groupName}
              onChange={(event) => setGroupName(event.currentTarget.value)}
            />
            <Textarea
              label="Описание"
              placeholder="Кратко опишите назначение группы"
              autosize
              minRows={3}
              value={groupDescription}
              onChange={(event) => setGroupDescription(event.currentTarget.value)}
            />
          </Stack>

          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Stack gap={0}>
                <Title order={4}>Доступы</Title>
                <Text size="sm" c="dimmed">
                  Доступ пользователю выдаётся только через приглашение, которое он
                  увидит в уведомлениях.
                </Text>
              </Stack>
              <Button
                variant="light"
                onClick={() =>
                  setDraftAccesses((current) => [...current, createInvitationDraft()])
                }
                disabled={
                  selectableUsersQuery.isLoading ||
                  selectableUsersQuery.isError ||
                  selectableUsers.length === 0
                }
              >
                Добавить участника
              </Button>
            </Group>

            {selectableUsersQuery.isLoading ? (
              <Text size="sm" c="dimmed">
                Загружаем список пользователей...
              </Text>
            ) : null}
            {selectableUsersQuery.isError ? (
              <Text size="sm" c="red">
                Не удалось загрузить список пользователей для приглашений.
              </Text>
            ) : null}
            {!selectableUsersQuery.isLoading &&
            !selectableUsersQuery.isError &&
            selectableUsers.length === 0 ? (
              <Text size="sm" c="dimmed">
                Доступных пользователей для приглашения пока нет.
              </Text>
            ) : null}

            {draftAccesses.map((access) => {
              const isDuplicate =
                !access.isCommon &&
                access.user_id !== undefined &&
                access.user_id !== null &&
                duplicateUserIds.has(access.user_id);

              return (
                <Card key={access.key} withBorder radius="lg" p="md">
                  <Stack gap="sm">
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={0}>
                        <Text fw={600}>
                          {access.isCommon ? "Все пользователи" : "Персональный доступ"}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {access.isCommon
                            ? "Общие права применяются сразу ко всем пользователям."
                            : "Будет создано приглашение до подтверждения."}
                        </Text>
                      </Stack>
                      {!access.isCommon ? (
                        <Button
                          variant="subtle"
                          color="red"
                          onClick={() =>
                            setDraftAccesses((current) =>
                              current.filter((item) => item.key !== access.key),
                            )
                          }
                        >
                          Удалить
                        </Button>
                      ) : null}
                    </Group>

                    {!access.isCommon ? (
                      <Select
                        label="Пользователь"
                        placeholder="Выберите пользователя"
                        data={selectableUsers.map((item) => ({
                          value: String(item.id),
                          label: item.full_name || item.username,
                        }))}
                        value={
                          access.user_id === undefined || access.user_id === null
                            ? null
                            : String(access.user_id)
                        }
                        onChange={(value) => {
                          setDraftAccesses((current) =>
                            current.map((item) =>
                              item.key === access.key
                                ? {
                                    ...item,
                                    user_id: value === null ? undefined : Number(value),
                                  }
                                : item,
                            ),
                          );
                        }}
                        searchable
                      />
                    ) : null}

                    <MultiSelect
                      label="Права"
                      data={GRANT_OPTIONS}
                      value={access.grants}
                      onChange={(value) => {
                        setDraftAccesses((current) =>
                          current.map((item) =>
                            item.key === access.key ? { ...item, grants: value } : item,
                          ),
                        );
                      }}
                    />

                    {isDuplicate ? (
                      <Text size="sm" c="red">
                        Один и тот же пользователь не может быть добавлен дважды.
                      </Text>
                    ) : null}
                  </Stack>
                </Card>
              );
            })}
          </Stack>

          {hasInvalidAccesses ? (
            <Text size="sm" c="red">
              Заполните все доступы: у каждого участника должен быть выбран пользователь
              и хотя бы одно право.
            </Text>
          ) : null}
          {createGroupMutation.isError ? (
            <Text size="sm" c="red">
              Не удалось создать группу.
            </Text>
          ) : null}

          <Group justify="flex-end">
            <Button variant="default" onClick={handleCloseCreateModal}>
              Отмена
            </Button>
            <Button
              onClick={() => createGroupMutation.mutate()}
              loading={createGroupMutation.isPending}
              disabled={!canCreateGroup}
            >
              Создать группу
            </Button>
          </Group>
        </Stack>
      </Modal>

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
