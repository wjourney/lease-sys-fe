import { ResourceDetail } from "../../../components/resource-detail/ResourceDetail";
import { ExpenseInfo, ExpenseSummary } from "./components/ExpenseInfo";

export default function ExpenseDetailPage({
  recordId,
  onClose,
}: { recordId?: string; onClose?: () => void } = {}) {
  return (
    <ResourceDetail
      resource="expenses"
      recordId={recordId}
      presentation={onClose ? "drawer" : "page"}
      onClose={onClose}
      renderTabHeader={(_, editing) => <ExpenseSummary {...editing} />}
      getDetailTabs={(_, sections) => [
        { key: "basic", label: "支出资料", children: <ExpenseInfo /> },
        { key: "logs", label: "操作记录", children: sections.historyPlain },
      ]}
    />
  );
}
