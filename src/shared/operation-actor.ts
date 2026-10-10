export type OperationIdentity = {
  actorName?: string | null;
  actorPhone?: string | null;
  actorUsername?: string | null;
  actorType?: string;
  actorDeleted?: boolean;
  operator?: string | null;
};

export function operationActorText(actor: OperationIdentity) {
  if (
    actor.actorType === "SYSTEM" ||
    (!actor.actorType && actor.actorName === "系统任务")
  )
    return "系统";
  const name =
    actor.actorName?.trim() || actor.operator?.trim() || "未知操作人";
  const identifier = actor.actorPhone?.trim() || actor.actorUsername?.trim();
  return `${name}${identifier ? ` · ${identifier}` : ""}${actor.actorDeleted ? "（账号已删除）" : ""}`;
}
