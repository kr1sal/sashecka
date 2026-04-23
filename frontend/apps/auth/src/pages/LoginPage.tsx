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

import { loginUser } from "@sashecka/api-client";
import { saveAuthSession } from "@sashecka/auth-session";

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await loginUser({ username, password });
      saveAuthSession({
        token: response.access_token,
        user: response.user,
      });
      navigate("/app", { replace: true });
    } catch (submitError) {
      setError("Не удалось авторизоваться. Проверь логин и пароль.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card shadow="sm" radius="lg" p="xl" maw={420} mx="auto" mt={80}>
      <form onSubmit={handleSubmit}>
        <Stack>
          <Title order={2}>Вход в Sashecka</Title>
          <Text c="dimmed" size="sm">
            Авторизуйся через email или username.
          </Text>
          <TextInput
            label="Email или username"
            placeholder="kira"
            value={username}
            onChange={(event) => setUsername(event.currentTarget.value)}
            autoComplete="username"
            required
          />
          <PasswordInput
            label="Пароль"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            autoComplete="current-password"
            required
          />
          {error ? (
            <Text c="red" size="sm">
              {error}
            </Text>
          ) : null}
          <Button type="submit" loading={loading}>
            Войти
          </Button>
          <Text size="sm">
            Нет аккаунта?{" "}
            <Anchor component={Link} to="../register">
              Зарегистрироваться
            </Anchor>
          </Text>
        </Stack>
      </form>
    </Card>
  );
}
