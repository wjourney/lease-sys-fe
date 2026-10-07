import { App, Button, Tooltip } from "antd";
import { useState } from "react";
import { ActionForm } from "../forms/ActionForm";
import { financialFields } from "../resource-detail/financial-fields";
import { Row } from "../../shared/api";
import { formatMoney } from "../../shared/money-format";
import { t } from "../../shared/i18n";
import { registerReceiptWithVoucher } from "../../shared/receipt-voucher";
import { useRoot } from "../../stores/root";

/** Same form for one bill or one payment allocated across several order bills. */
export function RegisterReceipt({
  bills,
  orderId,
  payerName,
}: {
  bills: Row[];
  orderId?: string;
  payerName: string;
}) {
  const [key, setKey] = useState<string>();
  const root = useRoot();
  const { message } = App.useApp();
  const available = bills.filter(
    (b) =>
      b.canRegister !== false && b.status !== "VOID" && Number(b.available) > 0,
  );
  if (root.salesRole) return null;
  if (!available.length) {
    const bill = bills.length === 1 ? bills[0] : undefined;
    if (!bill || ["PAID", "VOID"].includes(bill.status)) return null;
    const reason =
      bill.registrationBlockedReason ||
      (Number(bill.pending) > 0
        ? "已有收款记录待处理，请在账单详情的收款记录中核对，避免重复登记"
        : "当前账单不可登记收款，请查看账单详情或刷新后重试");
    return (
      <Tooltip title={t(reason)}>
        <span>
          <Button size="small" disabled>
            {t("登记收款")}
          </Button>
        </span>
      </Tooltip>
    );
  }
  const multiple = available.length > 1;
  const fields = [
    ...available.map((b) => ({
      key: `bill_${b.id}`,
      label: `${({ RENT: "租金", DEPOSIT: "押金", OTHER: "其他费用" } as Row)[b.feeType] || b.feeType} · ${b.recordNo}（可登记 ${formatMoney(b.available, b.currency || "HKD")}）`,
      type: "money" as const,
      required: !multiple,
    })),
    { key: "receivedOn", label: "到账日期", type: "date" as const },
    ...financialFields.filter((f) => f.key !== "paidOn"),
    { key: "payerName", label: "付款方" },
    {
      key: "remark",
      label: "说明",
      type: "textarea" as const,
      required: false,
    },
  ];
  return (
    <>
      <Button
        size="small"
        type="primary"
        onClick={() => setKey(crypto.randomUUID())}
      >
        {t(multiple ? "登记收款 / 分配账单" : "登记收款")}
      </Button>
      {key && (
        <ActionForm
          title={
            multiple
              ? "登记收款（分别填写各账单金额，共用一份凭证）"
              : "登记收款"
          }
          fields={fields}
          initial={{
            payerName,
            paymentMethod: "BANK",
            ...(!multiple
              ? { [`bill_${available[0].id}`]: available[0].available }
              : {}),
          }}
          voucher
          onClose={() => setKey(undefined)}
          onSubmit={async (values, file) => {
            const allocations = available
              .map((b) => ({
                billId: b.id,
                amount: String(values[`bill_${b.id}`] || "0"),
              }))
              .filter((a) => Number(a.amount) > 0);
            if (!allocations.length) throw new Error("请至少填写一笔收款金额");
            for (const a of allocations)
              if (
                Number(a.amount) >
                Number(available.find((b) => b.id === a.billId)!.available)
              )
                throw new Error("收款金额超过可登记余额");
            const payment = Object.fromEntries(
              Object.entries(values).filter(([k]) => !k.startsWith("bill_")),
            );
            const result = orderId
              ? await registerReceiptWithVoucher(
                  `/orders/${orderId}/receipts`,
                  { ...payment, allocations },
                  { sourceKey: key },
                  file,
                )
              : await registerReceiptWithVoucher(
                  `/incomes/${available[0].id}/receipts`,
                  { ...payment, amount: allocations[0].amount },
                  { sourceKey: key },
                  file,
                );
            root.invalidate();
            if (result.voucherFailed)
              message.warning(t("收款已登记，凭证上传失败，请在收款记录补传"));
            else message.success(t("收款已入账"));
          }}
        />
      )}
    </>
  );
}
