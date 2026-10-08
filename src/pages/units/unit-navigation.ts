export const unitDetailPath = (projectId: string, unitId: string) =>
  `/projects/${projectId}/units/${unitId}`;

export function unitListPath(projectId: string, search = "") {
  const params = new URLSearchParams(search);
  params.set("tab", "units");
  return `/projects/${projectId}?${params}`;
}

export function unitListReturnTo(projectId: string, value: unknown) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  )
    return unitListPath(projectId);
  const url = new URL(value, "https://local.invalid");
  return url.origin === "https://local.invalid" &&
    url.pathname === `/projects/${projectId}`
    ? unitListPath(projectId, url.search)
    : unitListPath(projectId);
}

export function unitEditorReturnTo(
  projectId: string,
  unitId: string | undefined,
  value: unknown,
) {
  if (unitId && value === unitDetailPath(projectId, unitId)) return value;
  return unitListReturnTo(projectId, value);
}
