export type TenantRoleCode =
  | "ADMIN"
  | "VP_GM"
  | "MANAGER"
  | "STAFF"
  | "SUPPORTER";

const CREATABLE_BY_CREATOR: Record<TenantRoleCode, readonly TenantRoleCode[]> =
  {
    ADMIN: ["ADMIN", "VP_GM", "MANAGER", "STAFF", "SUPPORTER"],
    VP_GM: ["MANAGER", "STAFF", "SUPPORTER"],
    MANAGER: ["STAFF", "SUPPORTER"],
    STAFF: [],
    SUPPORTER: [],
  };

export function creatableRoleCodesForCreator(
  roleCode: string | null | undefined,
) {
  if (!roleCode) return [] as const;
  const key = roleCode as TenantRoleCode;
  return CREATABLE_BY_CREATOR[key] ?? [];
}

export function canCreateUsers(roleCode: string | null | undefined) {
  return creatableRoleCodesForCreator(roleCode).length > 0;
}
