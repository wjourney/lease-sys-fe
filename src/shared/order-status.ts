export const orderStatusFilterOptions = [
  { value: "IN_PROGRESS", label: "进行中" },
  { value: "ENDED", label: "已结束" },
];

export function orderDisplayStatus(status: string | undefined) {
  if (["DRAFT", "PENDING", "ACTIVE"].includes(status || ""))
    return "IN_PROGRESS";
  if (["COMPLETED", "CLOSED"].includes(status || "")) return "ENDED";
  return status;
}

export function normalizeOrderStatusFilter(status: string | undefined) {
  return orderDisplayStatus(status);
}
