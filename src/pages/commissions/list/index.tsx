import { OrderFilter } from "../../../components/filters/OrderFilter";
import { CommissionBatchActions } from "../CommissionBatchActions";
import { Segmented } from "antd";
import { useSearchParams } from "react-router-dom";
import { ResourceList } from "../../../components/resource-list/ResourceList";
import { t } from "../../../shared/i18n";
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
      listToolbar={
        <div className="mb-5 flex items-center justify-between text-sm">
          <Segmented
            value={search.get("mode") || ""}
            options={[
              { label: t("全部佣金"), value: "" },
              { label: t("单月佣金"), value: "MONTHLY" },
              { label: t("年度佣金"), value: "YEARLY" },
              { label: t("一次性结付"), value: "ONE_TIME" },
              { label: t("按月结付"), value: "RECURRING_MONTHLY" },
            ]}
            onChange={(v) =>
              setSearch({
                ...Object.fromEntries(search.entries()),
                mode: String(v),
                page: "1",
              })
            }
          />
        </div>
      }
    />
  );
}
