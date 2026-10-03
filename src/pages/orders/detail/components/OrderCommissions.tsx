import { Button, Card, Space } from "antd";
import { useState } from "react";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { financialFields } from "../../../../components/resource-detail/financial-fields";
import { Editor } from "../../../../components/forms/ResourceEditor";
import { amount, dateText } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { Status } from "../../../../shared/ui";
import { OrderTable } from "./OrderTable";
export function OrderCommissions() {
  const { row, id, root, openAction, navigate } = useRecordDetail();
  const [creating, setCreating] = useState(false);
  const commissions = (row.commissions ?? []).filter(
    (commission: { status: string }) => commission.status !== "VOID",
  );
  const hasCommission = commissions.length > 0;
  const agreement = commissions[0] ?? row.orderCommission;
  const mode =
    (
      {
        MONTHLY: "单月结付",
        YEARLY: "按年结付",
        ONE_TIME: "一次性结付",
        RECURRING_MONTHLY: "按月结付",
      } as Record<string, string>
    )[agreement?.mode] ||
    agreement?.mode ||
    "—";
  return (
    <div className="flex flex-col gap-4">
      <Card
        title={t("佣金约定")}
        className="!border-[#e5eaf0] [&_.ant-card-head]:!min-h-14 [&_.ant-card-body]:!p-6"
      >
        <div className="grid gap-5 text-sm sm:grid-cols-3">
          <div>
            <span className="text-[#8793a4]">{t("结付方式")}</span>
            <strong className="ml-3 font-medium text-[#263650]">
              {t(mode)}
            </strong>
          </div>
          <div>
            <span className="text-[#8793a4]">
              {t(
                agreement?.mode === "RECURRING_MONTHLY"
                  ? "每月佣金"
                  : "约定佣金",
              )}
            </span>
            <strong className="ml-3 font-medium text-[#263650]">
              {agreement?.amount != null ? amount(agreement.amount) : "—"}
            </strong>
          </div>
          <div>
            <span className="text-[#8793a4]">{t("负责销售")}</span>
            <strong className="ml-3 font-medium text-[#263650]">
              {t(agreement?.salesName || row.salesName || "—")}
            </strong>
          </div>
        </div>
      </Card>
      <OrderTable
        title="结付记录"
        rows={commissions}
        actions={
          root.canWrite("commissions") && !hasCommission ? (
            <Button type="primary" onClick={() => setCreating(true)}>
              {t("新增佣金")}
            </Button>
          ) : null
        }
        columns={[
          {
            title: t("结算期间"),
            render: (_, c) =>
              `${dateText(c.periodStart)} — ${dateText(c.periodEnd)}`,
          },
          { title: t("应付佣金"), dataIndex: "amount", render: amount },
          { title: t("预计结付日"), dataIndex: "dueOn", render: dateText },
          { title: t("已付金额"), dataIndex: "paidAmount", render: amount },
          {
            title: t("状态"),
            dataIndex: "status",
            render: (v) => <Status value={v} resource="commissions" />,
          },
          {
            title: t("操作"),
            render: (_, c) => (
              <Space>
                <Button
                  size="small"
                  onClick={() => navigate(`/commissions/${c.id}`)}
                >
                  {t("查看")}
                </Button>
                {root.finance &&
                  Number(c.availableAmount) > 0 &&
                  c.status !== "VOID" && (
                    <Button
                      size="small"
                      onClick={() =>
                        openAction(
                          "支付佣金",
                          [
                            {
                              key: "amount",
                              label: "本次支付金额",
                              type: "money",
                            },
                            ...financialFields,
                          ],
                          `/commissions/${c.id}/payments`,
                          { amount: c.availableAmount, paymentMethod: "BANK" },
                          { sourceKey: crypto.randomUUID() },
                        )
                      }
                    >
                      {t("登记付款")}
                    </Button>
                  )}
              </Space>
            ),
          },
        ]}
      />
      {creating && (
        <Editor
          resource="commissions"
          initial={{ orderId: id }}
          lockedFields={["orderId"]}
          onClose={() => setCreating(false)}
          onSaved={() => setCreating(false)}
        />
      )}
    </div>
  );
}
