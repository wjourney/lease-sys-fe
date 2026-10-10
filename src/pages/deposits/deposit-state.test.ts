import { describe, expect, it } from "vitest";
import { depositRefundDisabledReason } from "./deposit-state";

describe("deposit refund availability", () => {
  it("blocks refunds throughout the lease, including renewals", () => {
    expect(
      depositRefundDisabledReason(
        { status: "ACTIVE", deposit: { received: "20000" } },
        true,
      ),
    ).toContain("租约尚未结束");
  });
  it("allows settlement after natural expiry or early termination", () => {
    expect(
      depositRefundDisabledReason(
        {
          status: "COMPLETED",
          deposit: { pending: "0" },
          actions: { settle: true },
        },
        true,
      ),
    ).toBeUndefined();
  });
  it("requires unresolved receipts to be checked before refunding", () => {
    expect(
      depositRefundDisabledReason(
        { status: "COMPLETED", deposit: { pending: "100" } },
        true,
      ),
    ).toContain("核对历史收款");
  });
  it("allows a settled unpaid refund but blocks refunds once paid", () => {
    expect(
      depositRefundDisabledReason(
        {
          status: "COMPLETED",
          depositSettledAt: "2026-10-10",
          deposit: { refundDue: "18000" },
        },
        true,
      ),
    ).toBeUndefined();
    expect(
      depositRefundDisabledReason(
        {
          status: "COMPLETED",
          depositSettledAt: "2026-10-10",
          deposit: { refundDue: "0" },
        },
        true,
      ),
    ).toContain("已结清");
  });
  it("keeps finance permissions and the server's settlement restriction", () => {
    expect(
      depositRefundDisabledReason({ status: "COMPLETED" }, false),
    ).toContain("权限");
    expect(
      depositRefundDisabledReason(
        { status: "COMPLETED", actions: { settle: false } },
        true,
      ),
    ).toContain("不可退还");
  });
});
