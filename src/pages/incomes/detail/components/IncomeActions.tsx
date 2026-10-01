import { Button } from "antd";
import { observer } from "mobx-react-lite";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { financialFields } from "../../../../components/resource-detail/financial-fields";
import { t } from "../../../../shared/i18n";
export const IncomeActions = observer(function IncomeActions() {
  const { resource, row, openAction, id, root } = useRecordDetail();
  return (
    <>
      {resource === "incomes" && row.status !== "VOID" && (
        <>
          {Number(row.available) > 0 && (
            <Button
              type="primary"
              onClick={() =>
                openAction(
                  "登记收款",
                  [
                    {
                      key: "amount",
                      label: t("本次收款金额"),
                      type: "money",
                    },
                    {
                      key: "receivedOn",
                      label: t("收款日期"),
                      type: "date",
                    },
                    ...financialFields.filter(
                      (f) => !["paidOn"].includes(f.key),
                    ),
                    {
                      key: "payerName",
                      label: t("付款方"),
                    },
                    {
                      key: "remark",
                      label: t("说明"),
                      type: "textarea",
                      required: false,
                    },
                  ],
                  `/incomes/${id}/receipts`,
                  {
                    amount: row.available,
                    payerName: row.payerName,
                    paymentMethod: "BANK",
                  },
                  {
                    sourceKey: crypto.randomUUID(),
                  },
                )
              }
            >
              {t("登记收款")}
            </Button>
          )}
          {root.finance && (
            <Button
              onClick={() =>
                openAction(
                  "调整应收金额",
                  [
                    {
                      key: "amount",
                      label: t("调整后的应收总额"),
                      type: "money",
                    },
                    {
                      key: "reason",
                      label: t("调整原因"),
                      type: "textarea",
                    },
                  ],
                  `/incomes/${id}/adjust`,
                  {
                    amount: row.total,
                  },
                  {
                    revision: row.revision,
                  },
                )
              }
            >
              {t("财务调整")}
            </Button>
          )}
        </>
      )}
    </>
  );
});
