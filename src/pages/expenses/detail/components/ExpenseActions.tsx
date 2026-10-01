import { Button } from "antd";
import { observer } from "mobx-react-lite";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { financialFields } from "../../../../components/resource-detail/financial-fields";
import { t } from "../../../../shared/i18n";
export const ExpenseActions = observer(function ExpenseActions() {
  const { resource, root, row, openAction, id } = useRecordDetail();
  return (
    <>
      {resource === "expenses" && root.finance && row.status === "UNPAID" && (
        <Button
          type="primary"
          onClick={() =>
            openAction("登记付款", financialFields, `/expenses/${id}/pay`, {
              paymentMethod: "BANK",
            })
          }
        >
          {t("登记付款")}
        </Button>
      )}
    </>
  );
});
