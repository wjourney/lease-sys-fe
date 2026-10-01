import { ResourceDetail } from "../../../components/resource-detail/ResourceDetail";
import { CommissionActions } from "./components/CommissionActions";
export default function CommissionDetailPage() {
  return (
    <ResourceDetail resource="commissions" actions={<CommissionActions />} />
  );
}
