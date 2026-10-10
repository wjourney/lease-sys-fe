import { ResourceDetail } from "../../../components/resource-detail/ResourceDetail";
import { CommissionActions } from "./components/CommissionActions";
export default function CommissionDetailPage({
  recordId,
  onClose,
}: { recordId?: string; onClose?: () => void } = {}) {
  return (
    <ResourceDetail
      resource="commissions"
      recordId={recordId}
      presentation={onClose ? "drawer" : "page"}
      onClose={onClose}
      actions={<CommissionActions />}
    />
  );
}
