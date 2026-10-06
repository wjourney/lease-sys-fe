import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { RegisterReceipt } from "../../../../components/receipts/RegisterReceipt";
export function IncomeActions() {
  const { resource, row } = useRecordDetail();
  return resource === "incomes" && row.recordType === "RECEIVABLE" ? (
    <RegisterReceipt
      bills={[row]}
      orderId={row.orderId}
      payerName={row.payerName}
    />
  ) : null;
}
