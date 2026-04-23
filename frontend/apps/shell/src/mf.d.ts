declare module "authRemote/login-page" {
  export function LoginPage(): JSX.Element;
}

declare module "authRemote/register-page" {
  export function RegisterPage(): JSX.Element;
}

declare module "reactAppRemote/home-page" {
  export function HomePage(): JSX.Element;
}

declare module "reactAppRemote/settings-page" {
  export function SettingsPage(): JSX.Element;
}

declare module "reactAppRemote/group-page" {
  export function GroupPage(): JSX.Element;
}

declare module "profileVueRemote/mount" {
  export function mount(
    element: HTMLElement,
    props: { apiBaseUrl: string; routePath: string },
  ): () => void;
}
