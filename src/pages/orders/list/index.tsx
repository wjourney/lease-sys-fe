import { ResourceList } from "../../../components/resource-list/ResourceList";
import { OrderDrawer } from "../components/OrderDrawer";

export default function OrderListPage() {
  return (
    <ResourceList
      resource="orders"
      renderEditor={({ row, onClose, onSaved }) => (
        <OrderDrawer
          key={row?.id ?? "new"}
          row={row}
          loadDetail={!!row}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    />
  );
}
