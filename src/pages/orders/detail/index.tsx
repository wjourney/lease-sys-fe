import { ResourceDetail } from "../../../components/resource-detail/ResourceDetail";
import { OrderActions } from "./components/OrderActions";
import { getOrderTabs } from "./components/OrderTabs";
export default function OrderDetailPage() {
  return (
    <ResourceDetail
      resource="orders"
      actions={<OrderActions />}
      getTabs={getOrderTabs}
    />
  );
}
