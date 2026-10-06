import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";
import { registerReceiptWithVoucher } from "./receipt-voucher";

afterEach(() => vi.restoreAllMocks());

describe("registerReceiptWithVoucher", () => {
  it("attaches the selected proof to the newly created receipt", async () => {
    const post = vi
      .spyOn(api, "post")
      .mockResolvedValueOnce({ data: { id: "receipt-123" } })
      .mockResolvedValueOnce({ data: {} });
    const file = new File(["proof"], "transfer.pdf", {
      type: "application/pdf",
    });

    const result = await registerReceiptWithVoucher(
      "/incomes/bill-456/receipts",
      { amount: "10" },
      { sourceKey: "request-789" },
      file,
    );

    expect(post).toHaveBeenCalledTimes(2);
    expect(post).toHaveBeenNthCalledWith(1, "/incomes/bill-456/receipts", {
      amount: "10",
      sourceKey: "request-789",
    });
    expect(post.mock.calls[1][0]).toBe("/materials/upload");
    const body = post.mock.calls[1][1] as FormData;
    expect(JSON.parse(body.get("payload") as string)).toEqual({
      incomeId: "receipt-123",
      category: "VOUCHER",
      title: "transfer.pdf",
      visibility: "SHARED",
    });
    expect(body.get("file")).toBe(file);
    expect(result.voucherFailed).toBe(false);
  });

  it("keeps the receipt when its proof upload fails", async () => {
    const post = vi
      .spyOn(api, "post")
      .mockResolvedValueOnce({ data: { id: "receipt-123" } })
      .mockRejectedValueOnce(new Error("upload failed"));

    const result = await registerReceiptWithVoucher(
      "/incomes/bill-456/receipts",
      { amount: "10" },
      { sourceKey: "request-789" },
      new File(["proof"], "transfer.pdf", { type: "application/pdf" }),
    );

    expect(post).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      receipt: { id: "receipt-123" },
      voucherFailed: true,
    });
  });
});

it("uploads one voucher for a payment allocated to multiple bills", async () => {
  const post = vi
    .spyOn(api, "post")
    .mockResolvedValueOnce({
      data: {
        id: "first-receipt",
        receipts: [
          { id: "first-receipt" },
          { id: "second-receipt", voucherIncomeId: "first-receipt" },
        ],
      },
    })
    .mockResolvedValueOnce({ data: {} });
  await registerReceiptWithVoucher(
    "/orders/order-id/receipts",
    {
      allocations: [
        { billId: "rent", amount: "100" },
        { billId: "deposit", amount: "200" },
      ],
    },
    { sourceKey: "request" },
    new File(["proof"], "receipt.pdf"),
  );
  expect(post).toHaveBeenCalledTimes(2);
  expect(
    JSON.parse((post.mock.calls[1][1] as FormData).get("payload") as string)
      .incomeId,
  ).toBe("first-receipt");
});
