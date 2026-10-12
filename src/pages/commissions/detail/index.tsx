import { ResourceDetail } from "../../../components/resource-detail/ResourceDetail";
import { CommissionSummary, CommissionInfo } from "./components/CommissionInfo";
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
      renderTabHeader={(_, editing) => <CommissionSummary {...editing} />}
      getDetailTabs={(_, sections) => [
        { key: "basic", label: "佣金资料", children: <CommissionInfo /> },
        { key: "logs", label: "操作记录", children: sections.historyPlain },
      ]}
    />
  );
}
