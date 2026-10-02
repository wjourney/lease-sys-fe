import { ResourceList } from "../../../components/resource-list/ResourceList";
import { OrderDrawer } from "../components/OrderDrawer";
export default function OrderListPage() {
  return (
    <ResourceList
      resource="orders"
      renderCreateEditor={({ onClose, onSaved }) => (
        <OrderDrawer onClose={onClose} onSaved={onSaved} />
      )}
    />
  );
}
