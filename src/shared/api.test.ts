import { describe, expect, it } from "vitest";
import { errorMessage } from "./api";

describe("errorMessage", () => {
  it("hides technical timeout and server errors", () => {
    expect(
      errorMessage({
        code: "ECONNABORTED",
        message: "timeout of 30000ms exceeded",
      }),
    ).toBe("网络不太稳定，请稍后再试");
    expect(
      errorMessage({
        message: "Request failed with status code 502",
        response: { status: 502 },
      }),
    ).toBe("服务暂时不可用，请稍后再试");
  });

  it("converts business errors without exposing backend text", () => {
    expect(
      errorMessage({
        response: {
          status: 400,
          data: { message: "已有业务引用，请改为停用" },
        },
      }),
    ).toBe("该记录已关联业务，无法删除。可改为停用。");
    expect(
      errorMessage({
        response: { status: 400, data: { message: "Prisma error P2002" } },
      }),
    ).toBe("提交的信息有误，请检查后重试");
  });

  it("uses a safe fallback for unknown errors", () => {
    expect(errorMessage(new Error("Unexpected token <"))).toBe(
      "操作未完成，请稍后再试",
    );
  });
});
