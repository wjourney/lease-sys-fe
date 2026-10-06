import { App, Button } from "antd";
import { useState } from "react";
import { ResourceList } from "../../../components/resource-list/ResourceList";
import { api, type Row } from "../../../shared/api";
import { t } from "../../../shared/i18n";
import { useRoot } from "../../../stores/root";
import { SalesCompanyDrawer } from "./components/SalesCompanyDrawer";
import { DeleteSalesCompanyModal } from "./components/DeleteSalesCompanyModal";
export default function SalesCompanyListPage() {
  const root = useRoot();
  const { message } = App.useApp();
  const [deleting, setDeleting] = useState<Row>();
  return (
    <>
      <ResourceList
        resource="sales-companies"
        hideCreate={root.companyAdmin}
        renderEditor={({ row, onClose, onSaved }) => (
          <SalesCompanyDrawer
            company={row}
            onClose={onClose}
            onSaved={onSaved}
          />
        )}
        renderRowActions={(row) =>
          root.canWrite("sales-companies") && !root.companyAdmin ? (
            <Button size="small" danger onClick={() => setDeleting(row)}>
              {t("删除")}
            </Button>
          ) : null
        }
      />
      {deleting && (
        <DeleteSalesCompanyModal
          companyName={deleting.name}
          onClose={() => setDeleting(undefined)}
          onConfirm={async (reason) => {
            await api.delete(`/sales-companies/${deleting.id}`, {
              data: { reason },
            });
            message.success(t("销售公司已删除"));
            setDeleting(undefined);
            root.invalidate();
          }}
        />
      )}
    </>
  );
}
