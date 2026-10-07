import { ResourceList } from "../../../components/resource-list/ResourceList";
import { OrderDeleteButton } from "../components/OrderDeleteButton";
import { OrderDrawer } from "../components/OrderDrawer";

export default function OrderListPage() {
  return (
    <ResourceList
      resource="orders"
      renderRowActions={(row) => <OrderDeleteButton order={row} small />}
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
