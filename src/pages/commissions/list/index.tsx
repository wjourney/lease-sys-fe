import { RegisterCommissionPayment } from "../RegisterCommissionPayment";
import { OrderFilter } from "../../../components/filters/OrderFilter";
import { CommissionBatchActions } from "../CommissionBatchActions";
import { useSearchParams } from "react-router-dom";
import { ResourceList } from "../../../components/resource-list/ResourceList";
import { lazy, Suspense, useState } from "react";
import { Spin } from "antd";
const CommissionDetail = lazy(() => import("../detail"));
export default function CommissionListPage() {
  const [search, setSearch] = useSearchParams();
  const [viewing, setViewing] = useState<string>();
  return (
    <>
      <ResourceList
        resource="commissions"
        onViewRow={(row) => setViewing(row.id)}
        hideCreate
        renderRowActions={(row) => <RegisterCommissionPayment row={row} />}
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
      {viewing && (
        <Suspense fallback={<Spin />}>
          <CommissionDetail
            key={viewing}
            recordId={viewing}
            onClose={() => setViewing(undefined)}
          />
        </Suspense>
      )}
    </>
  );
}
