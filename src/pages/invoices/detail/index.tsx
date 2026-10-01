import { ResourceDetail } from "../../../components/resource-detail/ResourceDetail";
import { InvoiceActions } from "./components/InvoiceActions";
export default function InvoiceDetailPage() {
  return <ResourceDetail resource="invoices" actions={<InvoiceActions />} />;
}
