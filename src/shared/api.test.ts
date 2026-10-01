import { describe, expect, it } from "vitest";
import { errorMessage } from "./api";

describe("errorMessage", () => {
  it("hides technical timeout and server errors", () => {
    expect(
      errorMessage({
        code: "ECONNABORTED",
        message: "timeout of 30000ms exceeded",
      }),
    ).toBe("请求超时，请稍后重试");
    expect(
      errorMessage({
        message: "Request failed with status code 502",
        response: { status: 502 },
      }),
    ).toBe("服务暂时不可用，请稍后重试");
  });

  it("preserves actionable Chinese business errors", () => {
    expect(
      errorMessage({
        response: {
          status: 400,
          data: { message: "已有业务引用，请改为停用" },
        },
      }),
    ).toBe("已有业务引用，请改为停用");
  });

  it("uses a safe fallback for unknown errors", () => {
    expect(errorMessage(new Error("Unexpected token <"))).toBe(
      "请求失败，请稍后重试",
    );
  });
});
