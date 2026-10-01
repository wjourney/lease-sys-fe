import { ResourceDetail } from "../../../components/resource-detail/ResourceDetail";
import { MaterialActions } from "./components/MaterialActions";
import { getMaterialTabs } from "./components/MaterialTabs";
export default function MaterialDetailPage() {
  return (
    <ResourceDetail
      resource="materials"
      actions={<MaterialActions />}
      getTabs={getMaterialTabs}
    />
  );
}
