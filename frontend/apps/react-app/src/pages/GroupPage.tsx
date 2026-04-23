import {
  Badge,
  Button,
  Card,
  Group as MantineGroup,
  MultiSelect,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { deleteGroup, getGroup, listUsers, updateGroup } from "@sashecka/api-client";
import { useAuthSession } from "@sashecka/auth-session/react";
import { PageLoader } from "@sashecka/shared-ui";

import { canManageGroup } from "../lib/groupPermissions";

const GRANT_OPTIONS = [
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "delete", label: "Delete" },
];

export function GroupPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthSession();

  const numericGroupId = Number(groupId);
  const groupQuery = useQuery({
    queryKey: ["sashecka", "group", numericGroupId],
    queryFn: () => getGroup(numericGroupId),
    enabled: Number.isFinite(numericGroupId),
  });

  const usersQuery = useQuery({
    queryKey: ["sashecka", "users", "group-page"],
    queryFn: () => listUsers(),
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [accesses, setAccesses] = useState<
    Array<{ user_id: number | null; grants: string[] }>
  >([]);

  useEffect(() => {
    if (groupQuery.data) {
      setName(groupQuery.data.name);
      setDescription(groupQuery.data.description ?? "");
      setAccesses(
        groupQuery.data.accesses.map((access) => ({
          user_id: access.user_id,
          grants: access.grants,
        })),
      );
    }
  }, [groupQuery.data]);

  const canWrite = useMemo(
    () => (groupQuery.data ? canManageGroup(groupQuery.data, user, "write") : false),
    [groupQuery.data, user],
  );
  const canDelete = useMemo(
    () => (groupQuery.data ? canManageGroup(groupQuery.data, user, "delete") : false),
    [groupQuery.data, user],
  );

  const updateMutation = useMutation({
    mutationFn: () =>
      updateGroup(numericGroupId, {
        name,
        description,
        accesses: accesses.map((access) => ({
          user_id: access.user_id,
          group_id: numericGroupId,
          grants: access.grants,
        })),
      }),
    onSuccess: (updatedGroup) => {
      queryClient.setQueryData(["sashecka", "group", numericGroupId], updatedGroup);
      queryClient.invalidateQueries({ queryKey: ["sashecka", "groups"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteGroup(numericGroupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sashecka", "groups"] });
      navigate("/app", { replace: true });
    },
  });

  if (groupQuery.isLoading || usersQuery.isLoading) {
    return <PageLoader label="Загружаем группу..." />;
  }

  if (!groupQuery.data) {
    return <Text>Группа не найдена.</Text>;
  }

  const usersById = new Map((usersQuery.data ?? []).map((item) => [item.id, item]));

  return (
    <Stack gap="lg">
      <MantineGroup justify="space-between">
        <Stack gap={0}>
          <Title order={2}>Группа</Title>
          <Text c="dimmed">
            Здесь можно просмотреть участников и их права внутри группы.
          </Text>
        </Stack>
        <MantineGroup>
          <Badge variant="light">
            owner_id: {groupQuery.data.owner_id ?? "unknown"}
          </Badge>
          {canDelete ? (
            <Button
              color="red"
              variant="light"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              Удалить группу
            </Button>
          ) : null}
        </MantineGroup>
      </MantineGroup>

      <Card withBorder radius="lg" p="xl">
        <Stack>
          <TextInput
            label="Название"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            disabled={!canWrite}
          />
          <TextInput
            label="Описание"
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
            disabled={!canWrite}
          />
          {canWrite ? (
            <Button loading={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
              Сохранить группу
            </Button>
          ) : null}
        </Stack>
      </Card>

      <Card withBorder radius="lg" p="xl">
        <Stack>
          <Title order={3}>Права участников</Title>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Участник</Table.Th>
                <Table.Th>Права</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {accesses.map((access, index) => {
                const member =
                  access.user_id === null ? null : usersById.get(access.user_id);
                const label =
                  access.user_id === null
                    ? "Все пользователи"
                    : member?.full_name || member?.username || `User #${access.user_id}`;

                return (
                  <Table.Tr key={`${String(access.user_id)}-${index}`}>
                    <Table.Td>{label}</Table.Td>
                    <Table.Td>
                      <MultiSelect
                        data={GRANT_OPTIONS}
                        value={access.grants}
                        onChange={(value) => {
                          setAccesses((current) =>
                            current.map((item, currentIndex) =>
                              currentIndex === index
                                ? { ...item, grants: value }
                                : item,
                            ),
                          );
                        }}
                        disabled={!canWrite}
                      />
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
          {updateMutation.isError ? (
            <Text c="red">Не удалось обновить группу.</Text>
          ) : null}
        </Stack>
      </Card>
    </Stack>
  );
}
