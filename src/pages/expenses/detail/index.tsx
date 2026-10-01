import { ResourceDetail } from "../../../components/resource-detail/ResourceDetail";
import { ExpenseActions } from "./components/ExpenseActions";
export default function ExpenseDetailPage() {
  return <ResourceDetail resource="expenses" actions={<ExpenseActions />} />;
}
