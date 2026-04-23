import {
  Button,
  Card,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { deleteCurrentUser, updateCurrentUser } from "@sashecka/api-client";
import {
  clearAuthSession,
  updateAuthUser,
} from "@sashecka/auth-session";
import { useAuthSession } from "@sashecka/auth-session/react";

export function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthSession();
  const [form, setForm] = useState({
    email: user?.email ?? "",
    username: user?.username ?? "",
    full_name: user?.full_name ?? "",
  });
  const [message, setMessage] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: (updatedUser) => {
      updateAuthUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ["sashecka", "users"] });
      setMessage("Данные пользователя обновлены.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCurrentUser,
    onSuccess: () => {
      clearAuthSession();
      navigate("/auth/login", { replace: true });
    },
  });

  const handleChange =
    (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;
      setForm((current) => ({
        ...current,
        [field]: value,
      }));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    updateMutation.mutate(form);
  };

  return (
    <Stack gap="lg">
      <Title order={2}>Настройки пользователя</Title>
      <Card withBorder radius="lg" p="xl">
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              required
            />
            <TextInput
              label="Username"
              value={form.username}
              onChange={handleChange("username")}
              required
            />
            <TextInput
              label="Полное имя"
              value={form.full_name}
              onChange={handleChange("full_name")}
            />
            {message ? <Text c="green">{message}</Text> : null}
            {updateMutation.isError ? (
              <Text c="red">Не удалось обновить пользователя.</Text>
            ) : null}
            <Group justify="space-between">
              <Button type="submit" loading={updateMutation.isPending}>
                Сохранить
              </Button>
              <Button
                color="red"
                variant="light"
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                Удалить аккаунт
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
