import { Button } from "antd";
import { observer } from "mobx-react-lite";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { financialFields } from "../../../../components/resource-detail/financial-fields";
import { t } from "../../../../shared/i18n";
import { Link } from "react-router-dom";
export const ExpenseActions = observer(function ExpenseActions() {
  const { resource, root, row, openAction, id } = useRecordDetail();
  return (
    <>
      {row.orderId && (
        <Link to={`/orders/${row.orderId}`}>{t("查看来源订单")}</Link>
      )}
      {row.commissionId && (
        <Link to={`/commissions/${row.commissionId}`}>{t("查看来源佣金")}</Link>
      )}
      {resource === "expenses" && root.finance && row.status === "UNPAID" && (
        <Button
          type="primary"
          onClick={() =>
            openAction(
              "登记付款",
              [
                {
                  key: "amount",
                  label: "付款金额（一次付清）",
                  type: "money",
                  readOnly: true,
                },
                ...financialFields,
              ],
              `/expenses/${id}/pay`,
              {
                paymentMethod: "BANK",
                amount: row.remainingAmount,
              },
              { sourceKey: crypto.randomUUID() },
            )
          }
        >
          {t("登记付款")}
        </Button>
      )}
    </>
  );
});
