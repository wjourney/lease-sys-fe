import { App, Button } from "antd";
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
    if (!root.finance || row.status === "VOID" || !(Number(available) > 0))
      return null;
    return (
      <>
        <Button
          size="small"
          type="primary"
          onClick={() => setSourceKey(crypto.randomUUID())}
        >
          {t("登记付款")}
        </Button>
        {sourceKey && (
          <ActionForm
            title="登记佣金付款"
            fields={[
              { key: "amount", label: "本次付款金额（HKD）", type: "money" },
              ...financialFields,
            ]}
            initial={{ amount: available, paymentMethod: "BANK" }}
            onClose={() => setSourceKey(undefined)}
            onSubmit={async (values) => {
              if (
                !(Number(values.amount) > 0) ||
                Number(values.amount) > Number(available)
              )
                throw new Error("付款金额须大于零且不超过可付余额");
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
