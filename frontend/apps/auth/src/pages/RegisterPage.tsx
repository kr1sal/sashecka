import {
  Anchor,
  Button,
  Card,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { loginUser, registerUser } from "@sashecka/api-client";
import { saveAuthSession } from "@sashecka/auth-session";

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    username: "",
    full_name: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange =
    (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;
      setForm((current) => ({
        ...current,
        [field]: value,
      }));
    };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const createdUser = await registerUser(form);
      const auth = await loginUser({
        username: form.email,
        password: form.password,
      });

      saveAuthSession({
        token: auth.access_token,
        user: createdUser,
      });
      navigate("/app", { replace: true });
    } catch (submitError) {
      setError("Не удалось зарегистрировать пользователя.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card shadow="sm" radius="lg" p="xl" maw={420} mx="auto" mt={80}>
      <form onSubmit={handleSubmit}>
        <Stack>
          <Title order={2}>Регистрация</Title>
          <TextInput
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            autoComplete="email"
            required
          />
          <TextInput
            label="Username"
            value={form.username}
            onChange={handleChange("username")}
            autoComplete="username"
            required
          />
          <TextInput
            label="Полное имя"
            value={form.full_name}
            onChange={handleChange("full_name")}
            autoComplete="name"
          />
          <PasswordInput
            label="Пароль"
            value={form.password}
            onChange={handleChange("password")}
            autoComplete="new-password"
            required
          />
          {error ? (
            <Text c="red" size="sm">
              {error}
            </Text>
          ) : null}
          <Button type="submit" loading={loading}>
            Создать аккаунт
          </Button>
          <Text size="sm">
            Уже зарегистрирован?{" "}
            <Anchor component={Link} to="../login">
              Войти
            </Anchor>
          </Text>
        </Stack>
      </form>
    </Card>
  );
}
