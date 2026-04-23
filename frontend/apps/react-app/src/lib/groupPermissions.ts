import type { Group } from "@sashecka/api-client";
import type { AuthUser } from "@sashecka/auth-session";

export function canManageGroup(group: Group, user: AuthUser | null, grant: string): boolean {
  if (!user) {
    return false;
  }

  if (group.owner_id === user.id) {
    return true;
  }

  return group.accesses.some((access) => {
    if (!access.is_active || !access.grants.includes(grant)) {
      return false;
    }

    return access.user_id === user.id || access.user_id === null;
  });
}
