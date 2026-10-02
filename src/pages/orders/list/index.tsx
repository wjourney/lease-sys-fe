import { ResourceList } from "../../../components/resource-list/ResourceList";
import { CreateOrderDrawer } from "./CreateOrderDrawer";
export default function OrderListPage() {
  return (
    <ResourceList
      resource="orders"
      renderCreateEditor={({ onClose, onSaved }) => (
        <CreateOrderDrawer onClose={onClose} onSaved={onSaved} />
      )}
    />
  );
}
