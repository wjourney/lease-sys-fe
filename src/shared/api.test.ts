import { describe, expect, it } from "vitest";
import { errorMessage } from "./api";

describe("errorMessage", () => {
  it("distinguishes occupied renewal dates from stale order revisions", () => {
    expect(
      errorMessage({
        response: {
          status: 409,
          data: { message: "该单位在所选租期已被占用" },
        },
      }),
    ).toBe("该单位在所选租期已有订单，请调整到期日。");
    expect(
      errorMessage({
        response: {
          status: 409,
          data: { message: "订单已更新，请刷新后重新续约" },
        },
      }),
    ).toBe("内容已被修改，请刷新后重试");
  });
  it("does not mistake missing API endpoints for deleted business data", () => {
    const hint = errorMessage({
      response: {
        status: 404,
        data: { message: "Cannot GET /api/v1/company-commissions" },
      },
    });
    expect(hint).toBe("操作暂时无法完成，请稍后再试");
    expect(errorMessage(hint)).toBe(hint);
  });

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

  it("explains order settlement errors and preserves translated toast text", () => {
    const hint = errorMessage({
      response: {
        status: 400,
        data: { code: "BUSINESS", message: "付款金额超过待付余额" },
      },
    });
    expect(hint).toBe("付款金额超过待付余额，请刷新后重新登记。");
    expect(errorMessage(hint)).toBe(hint);
  });

  it("distinguishes login throttling and request validation from permissions", () => {
    for (const status of [403, 429]) {
      expect(
        errorMessage({
          response: { status, data: { message: "尝试过多，请 15 分钟后重试" } },
        }),
      ).toBe("登录尝试过多，请 15 分钟后重试");
    }
    expect(
      errorMessage({
        response: {
          status: 403,
          data: { message: "请求校验失败，请刷新页面" },
        },
      }),
    ).toBe("请求校验失败，请刷新页面后重试");
    expect(
      errorMessage({
        response: { status: 403, data: { message: "请求来源不被允许" } },
      }),
    ).toContain("访问地址未获允许");
    expect(
      errorMessage({ response: { status: 403, data: { message: "unknown" } } }),
    ).toBe("当前账号没有操作权限");
  });

  it("uses a safe fallback for unknown errors", () => {
    expect(errorMessage(new Error("Unexpected token <"))).toBe(
      "操作未完成，请稍后再试",
    );
  });
});
