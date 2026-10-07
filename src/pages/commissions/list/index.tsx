import { OrderFilter } from "../../../components/filters/OrderFilter";
import { CommissionBatchActions } from "../CommissionBatchActions";
import { useSearchParams } from "react-router-dom";
import { ResourceList } from "../../../components/resource-list/ResourceList";
export default function CommissionListPage() {
  const [search, setSearch] = useSearchParams();
  return (
    <ResourceList
      resource="commissions"
      hideCreate
      renderBatchActions={(rows) => <CommissionBatchActions rows={rows} />}
      filterExtras={
        <OrderFilter
          value={search.get("orderId") || undefined}
          onChange={(orderId) =>
            setSearch((current) => {
              const next = new URLSearchParams(current);
              if (orderId) next.set("orderId", orderId);
              else next.delete("orderId");
              next.set("page", "1");
              return next;
            })
          }
        />
      }
      onResetExtras={() => setSearch({})}
    />
  );
}
