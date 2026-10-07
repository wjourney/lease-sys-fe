import { observer } from "mobx-react-lite";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { RegisterCommissionPayment } from "../../RegisterCommissionPayment";
import { t } from "../../../../shared/i18n";
import { Link } from "react-router-dom";
export const CommissionActions = observer(function CommissionActions() {
  const { row } = useRecordDetail();
  return (
    <>
      {row.orderId && (
        <Link to={`/orders/${row.orderId}`}>{t("查看来源订单")}</Link>
      )}
      <RegisterCommissionPayment row={row} />
    </>
  );
});
