import { App, Button, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { ActionForm } from "../../components/forms/ActionForm";
import { financialFields } from "../../components/resource-detail/financial-fields";
import { api, type Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";

export const RegisterCommissionPayment = observer(
  function RegisterCommissionPayment({ row }: { row: Row }) {
    const root = useRoot();
    const { message } = App.useApp();
    const [sourceKey, setSourceKey] = useState<string>();
    const available = row.availableAmount ?? row.remainingAmount;
    const hasPlan = Number(row.remainingAmount) > Number(available);
    if (!root.finance || row.status === "VOID" || !(Number(available) > 0))
      return null;
    return (
      <>
        <Tooltip
          title={
            hasPlan ? t("佣金已有待付支出，请在支出管理中付清") : undefined
          }
        >
          <Button
            size="small"
            type="primary"
            disabled={hasPlan}
            onClick={() => setSourceKey(crypto.randomUUID())}
          >
            {t("登记付款")}
          </Button>
        </Tooltip>
        {sourceKey && (
          <ActionForm
            title="登记佣金付款"
            fields={[
              {
                key: "amount",
                label: "付款金额（HKD）",
                type: "money",
                readOnly: true,
              },
              ...financialFields,
            ]}
            initial={{ amount: available, paymentMethod: "BANK" }}
            onClose={() => setSourceKey(undefined)}
            onSubmit={async (values) => {
              if (
                !(Number(values.amount) > 0) ||
                Number(values.amount) !== Number(available)
              )
                throw new Error("付款须一次付清，请刷新后重新登记");
              await api.post(`/commissions/${row.id}/payments`, {
                ...values,
                amount: String(values.amount),
                sourceKey,
              });
              root.invalidate();
              message.success(t("佣金付款已登记"));
            }}
          />
        )}
      </>
    );
  },
);
