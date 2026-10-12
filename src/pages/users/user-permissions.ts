export function canManageUser(actorRole?: string, target?: { role?: string }) {
  if (actorRole === "SUPER_ADMIN") return true;
  if (actorRole === "OPERATIONS")
    return !target || !["SUPER_ADMIN", "FINANCE"].includes(target.role ?? "");
  return false;
}
