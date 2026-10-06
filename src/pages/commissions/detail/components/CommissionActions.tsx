import { Button } from "antd";
import { observer } from "mobx-react-lite";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { financialFields } from "../../../../components/resource-detail/financial-fields";
import { t } from "../../../../shared/i18n";
import { Link } from "react-router-dom";
export const CommissionActions = observer(function CommissionActions() {
  const { resource, root, row, openAction, id } = useRecordDetail();
  return (
    <>
      {row.orderId && (
        <Link to={`/orders/${row.orderId}`}>{t("查看来源订单")}</Link>
      )}
      {resource === "commissions" &&
        root.finance &&
        row.status !== "VOID" &&
        Number(row.availableAmount ?? row.remainingAmount) > 0 && (
          <Button
            type="primary"
            onClick={() =>
              openAction(
                "支付佣金",
                [
                  {
                    key: "amount",
                    label: t("本次支付金额"),
                    type: "money",
                  },
                  ...financialFields,
                ],
                `/commissions/${id}/payments`,
                {
                  amount: row.availableAmount ?? row.remainingAmount,
                  paymentMethod: "BANK",
                },
                {
                  sourceKey: crypto.randomUUID(),
                },
              )
            }
          >
            {t("支付佣金")}
          </Button>
        )}
    </>
  );
});
