import { ResourceDetail } from "../../../components/resource-detail/ResourceDetail";
import { IncomeActions } from "./components/IncomeActions";
import { getIncomeTabs } from "./components/IncomeTabs";
export default function IncomeDetailPage() {
  return (
    <ResourceDetail
      resource="incomes"
      actions={<IncomeActions />}
      getTabs={getIncomeTabs}
    />
  );
}
