import type { Row } from "../../shared/api";

export function canDownloadBillInvoices(bill: Row) {
  return (
    bill.status !== "VOID" &&
    Number(bill.confirmed) > 0 &&
    Number(bill.invoiceCount) > 0
  );
}
