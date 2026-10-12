import { ResourceList } from "../../../components/resource-list/ResourceList";
import { lazy, Suspense, useState } from "react";
import { App, Button, Spin, Tooltip } from "antd";
import { ActionForm } from "../../../components/forms/ActionForm";
import { api, type Row } from "../../../shared/api";
import { canEditFinancialRecord } from "../../../shared/financial-record-actions";
import { t } from "../../../shared/i18n";
import { useRoot } from "../../../stores/root";
const ExpenseDetail = lazy(() => import("../detail"));
export default function ExpenseListPage() {
  const [viewing, setViewing] = useState<string>();
  const [deleting, setDeleting] = useState<Row>();
  const root = useRoot();
  const { message } = App.useApp();
  return (
    <>
      <ResourceList
        resource="expenses"
        onViewRow={(row) => setViewing(row.id)}
        renderRowActions={(row) =>
          root.canWrite("expenses") ? (
            <Tooltip
              title={
                !canEditFinancialRecord("expenses", row)
                  ? t("已付款或自动生成的支出不能编辑、删除")
                  : undefined
              }
            >
              <span>
                <Button
                  size="small"
                  danger
                  disabled={!canEditFinancialRecord("expenses", row)}
                  onClick={() => setDeleting(row)}
                >
                  {t("删除")}
                </Button>
              </span>
            </Tooltip>
          ) : null
        }
      />
      {deleting && (
        <ActionForm
          title={t("删除支出")}
          fields={[{ key: "reason", label: t("删除原因"), type: "textarea" }]}
          onClose={() => setDeleting(undefined)}
          onSubmit={async (values) => {
            await api.delete(`/expenses/${deleting.id}`, { data: values });
            message.success(t("已删除"));
            root.invalidate();
          }}
        />
      )}
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
