import { describe, expect, it } from "vitest";
import { operationActorText } from "./operation-actor";

describe("operation actor identity", () => {
  it("distinguishes namesakes by full phone", () => {
    expect(
      operationActorText({ actorName: "林夏", actorPhone: "19934287000" }),
    ).toBe("林夏 · 19934287000");
    expect(
      operationActorText({ actorName: "林夏", actorPhone: "19934287001" }),
    ).toBe("林夏 · 19934287001");
  });
  it("uses login account when phone is missing", () => {
    expect(
      operationActorText({
        actorName: "系统管理员",
        actorPhone: " ",
        actorUsername: "admin",
      }),
    ).toBe("系统管理员 · admin");
  });
  it("marks deleted accounts and preserves legacy fallback", () => {
    expect(
      operationActorText({
        actorName: "林夏",
        actorUsername: "xia",
        actorDeleted: true,
      }),
    ).toBe("林夏 · xia（账号已删除）");
    expect(operationActorText({ operator: "旧姓名" })).toBe("旧姓名");
    expect(operationActorText({})).toBe("未知操作人");
  });
  it("shows system tasks without the borrowed admin identity", () => {
    expect(
      operationActorText({
        actorType: "SYSTEM",
        actorName: "管理员",
        actorPhone: "19934287000",
      }),
    ).toBe("系统");
    expect(
      operationActorText({ actorName: "系统任务", actorUsername: "admin" }),
    ).toBe("系统");
    expect(
      operationActorText({
        actorType: "USER",
        actorName: "系统任务",
        actorUsername: "human",
      }),
    ).toBe("系统任务 · human");
  });
});
