import { Segmented } from "antd";
import { useSearchParams } from "react-router-dom";
import { ResourceList } from "../../../components/resource-list/ResourceList";
import { t } from "../../../shared/i18n";
export default function CommissionListPage() {
  const [search, setSearch] = useSearchParams();
  return (
    <ResourceList
      resource="commissions"
      listToolbar={
        <div className="mb-5 flex items-center justify-between text-[11px]">
          <Segmented
            value={search.get("mode") || "MONTHLY"}
            options={[
              { label: t("月度佣金"), value: "MONTHLY" },
              { label: t("年度佣金"), value: "YEARLY" },
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
