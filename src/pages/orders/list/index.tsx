import { ResourceList } from "../../../components/resource-list/ResourceList";
import { OrderDrawer } from "../components/OrderDrawer";
export default function OrderListPage() {
  return (
    <ResourceList
      resource="orders"
      renderEditor={({ row, onClose, onSaved }) => (
        <OrderDrawer row={row} onClose={onClose} onSaved={onSaved} />
      )}
    />
  );
}
