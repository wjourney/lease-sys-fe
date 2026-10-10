import { ResourceList } from "../../../components/resource-list/ResourceList";
import { lazy, Suspense, useState } from "react";
import { Spin } from "antd";
const ExpenseDetail = lazy(() => import("../detail"));
export default function ExpenseListPage() {
  const [viewing, setViewing] = useState<string>();
  return (
    <>
      <ResourceList
        resource="expenses"
        onViewRow={(row) => setViewing(row.id)}
      />
      {viewing && (
        <Suspense fallback={<Spin />}>
          <ExpenseDetail
            key={viewing}
            recordId={viewing}
            onClose={() => setViewing(undefined)}
          />
        </Suspense>
      )}
    </>
  );
}
