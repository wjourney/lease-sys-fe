import { Button } from "antd";
import { observer } from "mobx-react-lite";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { financialFields } from "../../../../components/resource-detail/financial-fields";
import { t } from "../../../../shared/i18n";
export const CommissionActions = observer(function CommissionActions() {
  const { resource, root, row, openAction, id } = useRecordDetail();
  return (
    <>
      {resource === "commissions" &&
        root.finance &&
        Number(row.remainingAmount) > 0 && (
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
                  amount: row.remainingAmount,
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
