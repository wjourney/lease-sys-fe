import { describe, expect, it } from "vitest";
import {
  financeOperationChanges,
  financeOperationSummary,
} from "./finance-operation-text";

describe("finance operation text", () => {
  it("summarizes creation without exposing the initial database fields", () => {
    const log = {
      action: "CREATE",
      changes: {
        amount: { before: null, after: 18000 },
        unitId: { before: null, after: "f210a668-0b58-488c-ab37-9fb35e9b14c6" },
        dueOn: { before: null, after: "2026-10-12T00:00:00.000Z" },
      },
    };
    expect(financeOperationSummary(log, "incomes", "B202610124BA7BA32")).toBe(
      "账单 · B202610124BA7BA32",
    );
    expect(financeOperationChanges(log, "incomes")).toEqual([]);
  });

  it("describes only meaningful bill changes in business language", () => {
    const log = {
      action: "UPDATE",
      changes: {
        amount: { before: "18000", after: "20000" },
        total: { before: "18000", after: "20000" },
        dueOn: {
          before: "2026-10-12T00:00:00.000Z",
          after: "2026-10-15T00:00:00.000Z",
        },
        status: { before: "OPEN", after: "PAID" },
        orderId: { before: "old-id", after: "new-id" },
        updatedAt: { before: "old-date", after: "new-date" },
      },
    };
    expect(financeOperationChanges(log, "incomes")).toEqual([
      "应收金额由HK$18,000.00改为HK$20,000.00",
      "到期日由2026-10-12改为2026-10-15",
      "状态由待付款改为已付款",
    ]);
  });

  it("uses the relevant amount and payment labels for expenses", () => {
    expect(
      financeOperationChanges(
        {
          action: "UPDATE",
          changes: {
            amount: { before: "100", after: "200" },
            paymentMethod: { before: null, after: "BANK" },
            fundAccountId: { before: null, after: "internal-id" },
          },
        },
        "expenses",
      ),
    ).toEqual(["应付金额由HK$100.00改为HK$200.00", "设置付款方式为银行转账"]);
  });

  it("recognizes related receipts and commission settlement periods", () => {
    expect(
      financeOperationSummary(
        { action: "CREATE", subject: "RC202610120001" },
        "incomes",
        "B202610120001",
      ),
    ).toBe("收款 · RC202610120001");
    expect(
      financeOperationChanges(
        {
          action: "UPDATE",
          subject: "CM202610120001",
          changes: {
            periodEnd: {
              before: "2026-10-31T00:00:00.000Z",
              after: "2026-11-30T00:00:00.000Z",
            },
          },
        },
        "commissions",
      ),
    ).toEqual(["结算期结束日由2026-10-31改为2026-11-30"]);
  });
});
