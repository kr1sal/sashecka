import {
  AppShell,
  Avatar,
  Burger,
  Group,
  Menu,
  NavLink,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { clearAuthSession } from "@sashecka/auth-session";
import { useAuthSession } from "@sashecka/auth-session/react";

export function ShellLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthSession();
  const [opened, { toggle }] = useDisclosure(false);

  const links = [
    { href: "/app", label: "Главная" },
    { href: "/profile", label: "Профиль" },
    { href: "/settings", label: "Настройки" },
  ];

  return (
    <AppShell
      header={{ height: 72 }}
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="lg"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Stack gap={0}>
              <Title order={4}>Sashecka</Title>
              <Text size="xs" c="dimmed">
                Microfrontend demo shell
              </Text>
            </Stack>
          </Group>

          <Menu shadow="md" width={220}>
            <Menu.Target>
              <UnstyledButton>
                <Group gap="sm">
                  <Avatar color="indigo" radius="xl">
                    {user?.username?.slice(0, 1).toUpperCase() ?? "U"}
                  </Avatar>
                  <Stack gap={0}>
                    <Text size="sm" fw={600}>
                      {user?.full_name || user?.username}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {user?.email}
                    </Text>
                  </Stack>
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => navigate("/profile")}>Профиль</Menu.Item>
              <Menu.Item onClick={() => navigate("/settings")}>Настройки</Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                onClick={() => {
                  clearAuthSession();
                  navigate("/auth/login", { replace: true });
                }}
              >
                Выйти
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs">
          {links.map((link) => (
            <NavLink
              key={link.href}
              label={link.label}
              active={location.pathname === link.href}
              onClick={() => { toggle(); navigate(link.href); }}
            />
          ))}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
