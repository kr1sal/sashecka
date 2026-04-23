import {
  ActionIcon,
  AppShell,
  Avatar,
  Burger,
  Button,
  Group,
  Indicator,
  Menu,
  NavLink,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import {
  acceptCurrentUserGroupInvitation,
  ignoreCurrentUserGroupInvitation,
  listCurrentUserGroupInvitations,
} from "@sashecka/api-client";
import { clearAuthSession } from "@sashecka/auth-session";
import { useAuthSession } from "@sashecka/auth-session/react";

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 18H9" />
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M10 22a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function ShellLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuthSession();
  const [opened, { toggle }] = useDisclosure(false);

  const links = [
    { href: "/app", label: "Главная" },
    { href: "/profile", label: "Профиль" },
    { href: "/settings", label: "Настройки" },
  ];
  const invitationsQuery = useQuery({
    queryKey: ["sashecka", "current-user", "group-invitations"],
    queryFn: () => listCurrentUserGroupInvitations(),
    enabled: Boolean(user),
  });
  const acceptInvitationMutation = useMutation({
    mutationFn: (accessId: number) => acceptCurrentUserGroupInvitation(accessId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sashecka", "current-user", "group-invitations"],
      });
      queryClient.invalidateQueries({ queryKey: ["sashecka", "groups"] });
      queryClient.invalidateQueries({ queryKey: ["sashecka", "group"] });
    },
  });
  const ignoreInvitationMutation = useMutation({
    mutationFn: (accessId: number) => ignoreCurrentUserGroupInvitation(accessId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sashecka", "current-user", "group-invitations"],
      });
    },
  });
  const invitations = invitationsQuery.data ?? [];
  const invitationsCount = invitations.length;
  const avatarStyle = user?.profile_accent_color
    ? { backgroundColor: user.profile_accent_color, color: "#ffffff" }
    : undefined;

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

          <Group gap="sm">
            <Menu shadow="md" width={360} position="bottom-end">
              <Menu.Target>
                <Indicator
                  disabled={invitationsCount === 0}
                  label={invitationsCount > 9 ? "9+" : invitationsCount}
                  size={16}
                  offset={6}
                >
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="lg"
                    aria-label="Приглашения в группы"
                  >
                    <BellIcon />
                  </ActionIcon>
                </Indicator>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Приглашения</Menu.Label>
                {invitationsQuery.isLoading ? (
                  <Text size="sm" px="sm" py="xs">
                    Загружаем приглашения...
                  </Text>
                ) : null}
                {invitationsQuery.isError ? (
                  <Text size="sm" c="red" px="sm" py="xs">
                    Не удалось загрузить приглашения.
                  </Text>
                ) : null}
                {!invitationsQuery.isLoading &&
                !invitationsQuery.isError &&
                invitations.length === 0 ? (
                  <Text size="sm" c="dimmed" px="sm" py="xs">
                    Новых приглашений нет.
                  </Text>
                ) : null}
                {invitations.map((invitation, index) => (
                  <div key={invitation.id}>
                    <Stack gap={6} px="sm" py="sm">
                      <Stack gap={2}>
                        <Text size="sm" fw={600}>
                          {invitation.group_name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {invitation.group_description || "Без описания"}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Права: {invitation.grants.join(", ") || "не указаны"}
                        </Text>
                      </Stack>
                      <Group justify="flex-end">
                        <Button
                          size="xs"
                          variant="default"
                          loading={
                            ignoreInvitationMutation.isPending &&
                            ignoreInvitationMutation.variables === invitation.id
                          }
                          onClick={() => ignoreInvitationMutation.mutate(invitation.id)}
                        >
                          Игнорировать
                        </Button>
                        <Button
                          size="xs"
                          loading={
                            acceptInvitationMutation.isPending &&
                            acceptInvitationMutation.variables === invitation.id
                          }
                          onClick={() => acceptInvitationMutation.mutate(invitation.id)}
                        >
                          Принять
                        </Button>
                      </Group>
                    </Stack>
                    {index < invitations.length - 1 ? <Menu.Divider /> : null}
                  </div>
                ))}
              </Menu.Dropdown>
            </Menu>

            <Menu shadow="md" width={220}>
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="sm">
                    <Avatar color="indigo" radius="xl" style={avatarStyle}>
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
