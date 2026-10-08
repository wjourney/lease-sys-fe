import { OrderBasicInfo } from "../../pages/orders/detail/components/OrderBasicInfo";
import { OrderDetailHeader } from "../../pages/orders/detail/components/OrderDetailHeader";
import { OrderHistory } from "../../pages/orders/detail/components/OrderHistory";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Empty,
  Space,
  Spin,
  Tabs,
  TabsProps,
  Typography,
} from "antd";
import { observer } from "mobx-react-lite";
import { ReactNode, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { OrderDrawer } from "../../pages/orders/components/OrderDrawer";
import { ProjectDetailView } from "../../pages/projects/detail/components/ProjectDetailView";
import { amount, api, Row } from "../../shared/api";
import { configs } from "../../shared/config";
import { canEditFinancialRecord } from "../../shared/financial-record-actions";
import { t } from "../../shared/i18n";
import { Status } from "../../shared/ui";
import { useRoot } from "../../stores/root";
import { ActionForm } from "../forms/ActionForm";
import { MaterialEditor } from "../forms/MaterialEditor";
import { Editor } from "../forms/ResourceEditor";
import { ResourceList } from "../resource-list/ResourceList";
import { RequestError } from "../feedback/RequestError";
import { DetailContext, DetailContextValue } from "./DetailContext";
import { ownerFields } from "./owner-fields";
import { RecordBasicInfo } from "./RecordBasicInfo";
import { RecordHistory } from "./RecordHistory";
import { useRecordActions } from "./useRecordActions";
import { useRecordData } from "./useRecordData";
const { Text } = Typography;
export const ResourceDetail = observer(function ResourceDetail({
  resource,
  actions,
  getTabs,
}: {
  resource: string;
  actions?: ReactNode;
  getTabs?: (ctx: DetailContextValue) => NonNullable<TabsProps["items"]>;
}) {
  const { id = "" } = useParams();
  const root = useRoot();
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [edit, setEdit] = useState(false);
  const [tab, setTab] = useState<string>();
  const [material, setMaterial] = useState<Row>();
  const [version, setVersion] = useState<string>();
  const { row, loading, error, logs, receipts, versions, load } = useRecordData(
    resource,
    id,
    root.epoch,
  );
  const {
    action,
    setAction,
    openAction,
    openReceiptAction,
    run,
    previewInvoice,
  } = useRecordActions(id);
  const config = configs[resource];
  if (!config) return <Empty />;
  if (error)
    return (
      <RequestError
        message={t(error)}
        type="error"
        action={<Button onClick={load}>{t("重试")}</Button>}
      />
    );
  if (!row) return <Spin />;
  const editable =
    canEditFinancialRecord(resource, row) &&
    root.canWrite(resource) &&
    config.fields.length > 0 &&
    (resource !== "orders" || (row.actions?.edit ?? row.status !== "CLOSED"));
  const title =
    (resource === "orders" ? row.unitNo : null) ||
    row.name ||
    row.unitNo ||
    row.orderNo ||
    row.recordNo ||
    row.expenseNo ||
    row.commissionNo ||
    row.invoiceNo ||
    row.title ||
    row.key;
  const headerHost = document.getElementById("record-detail-header");
  const fields = Array.from(
    new Map(
      [
        ...config.fields.map((f) => ({
          key: f.key,
          label: t(f.label),
        })),
        ...config.columns,
      ].map((f) => [f.key, f]),
    ).values(),
  ).filter(
    (f) =>
      !["password", "branches", "positions", "recurrenceRule"].includes(f.key),
  );
  const detail = (
    <RecordBasicInfo fields={fields} row={row} resource={resource} id={id} />
  );
  const history = <RecordHistory logs={logs} fields={fields} />;
  const context: DetailContextValue = {
    resource,
    setTab,
    id,
    row,
    root,
    logs,
    receipts,
    versions,
    navigate,
    message,
    modal,
    openAction,
    openReceiptAction,
    run,
    previewInvoice,
    setMaterial,
    setVersion,
  };
  const tabs: NonNullable<TabsProps["items"]> = [
    {
      key: "basic",
      label: t("基本资料"),
      children: resource === "orders" ? <OrderBasicInfo /> : detail,
    },
  ];
  tabs.push(...(getTabs?.(context) ?? []));

  if (
    resource !== "orders" &&
    resource !== "users" &&
    ownerFields[resource] &&
    resource !== "materials" &&
    root.canRead("materials")
  )
    tabs.push({
      key: "materials",
      label: t("文件与资料"),
      children: (
        <ResourceList
          resource="materials"
          fixed={{
            [ownerFields[resource]]: id,
          }}
          embedded
        />
      ),
    });
  if (resource !== "users" && resource !== "projects")
    tabs.push({
      key: "logs",
      label: t("操作记录"),
      children: resource === "orders" ? <OrderHistory /> : history,
    });
  return (
    <DetailContext.Provider value={context}>
      <Spin spinning={loading}>
        {resource === "projects" ? (
          <ProjectDetailView
            onEdit={() =>
              navigate(`/projects/${id}/edit`, {
                state: { returnTo: location.pathname + location.search },
              })
            }
            onDelete={async (reason) => {
              await api.delete(`/projects/${id}`, { data: { reason } });
              message.success(t("已删除"));
              root.invalidate();
              navigate("/projects");
            }}
          />
        ) : (
          <>
            {resource === "orders" ? (
              <OrderDetailHeader
                editable={editable}
                onEdit={() => setEdit(true)}
                actions={actions}
              />
            ) : (
              <>
                {headerHost &&
                  createPortal(
                    <div className="flex min-w-0 items-center gap-3">
                      <Button
                        type="text"
                        icon={<ArrowLeftOutlined aria-hidden />}
                        aria-label={t("返回上级")}
                        onClick={() => navigate("/" + resource)}
                      />
                      <h1 className="record-header-title">{t(title)}</h1>
                    </div>,
                    headerHost,
                  )}
                <div className="mb-[25px] flex items-center justify-between gap-5 max-[1100px]:flex-col max-[1100px]:items-start [&_.ant-typography-secondary]:text-xs [&>.ant-space]:max-[1100px]:self-end [&>.ant-space]:max-[760px]:!flex-wrap [&>.ant-space]:max-[760px]:self-start">
                  <div>
                    <Space wrap>
                      <Status
                        value={row.status || row.occupancyStatus || "ACTIVE"}
                        resource={resource}
                      />
                      <Text type="secondary">
                        {row.projectName || row.address || config.description}
                      </Text>
                    </Space>
                  </div>
                  <Space wrap>
                    {editable && (
                      <Button
                        icon={<EditOutlined aria-hidden={true} />}
                        onClick={() => setEdit(true)}
                      >
                        {t("编辑")}
                      </Button>
                    )}
                    {actions}

                    {root.canWrite(resource) &&
                      canEditFinancialRecord(resource, row) &&
                      ![
                        "orders",
                        "incomes",
                        "invoices",
                        "settings",
                        "commissions",
                      ].includes(resource) && (
                        <Button
                          danger
                          icon={<DeleteOutlined aria-hidden={true} />}
                          onClick={() =>
                            setAction({
                              title: t("删除记录"),
                              fields: [
                                {
                                  key: "reason",
                                  label: t("删除原因"),
                                  type: "textarea",
                                },
                              ],
                              onSubmit: async (v: Row) => {
                                await api.delete(`/${resource}/${id}`, {
                                  data: v,
                                });
                                message.success("已删除");
                                root.invalidate();
                                navigate("/" + resource);
                              },
                            })
                          }
                        >
                          {t("删除")}
                        </Button>
                      )}
                  </Space>
                </div>
              </>
            )}
            {resource === "incomes" && (
              <div className="mb-5 grid grid-cols-4 rounded-[7px] border border-[#e9edf2] bg-white p-6 max-[760px]:grid-cols-2 max-[760px]:gap-5 [&>div]:border-r [&>div]:border-[#edf0f4] [&>div]:pl-6 [&>div]:max-[760px]:border-0 [&>div]:max-[760px]:pl-0 [&>div:first-child]:pl-0 [&>div:last-child]:border-0 [&_strong]:mt-3 [&_strong]:block [&_strong]:text-[21px] [&_strong]:font-medium [&_.ant-typography]:text-[11px]">
                {[
                  ["应收金额", row.total],
                  ["已确认收款", row.confirmed],
                  ["待确认收款", row.pending],
                  ["可登记余额", row.available],
                ].map(([label, v]) => (
                  <div key={label}>
                    <Text type="secondary">{t(label)}</Text>
                    <strong>{t(amount(v))}</strong>
                  </div>
                ))}
              </div>
            )}
            <Tabs
              className={
                resource === "orders"
                  ? "order-detail-tabs mx-auto w-full max-w-[1320px]"
                  : undefined
              }
              activeKey={tab}
              onChange={setTab}
              defaultActiveKey={
                resource === "projects"
                  ? "units"
                  : resource === "incomes"
                    ? "receipts"
                    : "basic"
              }
              items={tabs}
            />
          </>
        )}
        {edit &&
          (resource === "orders" ? (
            <OrderDrawer
              row={row}
              onClose={() => setEdit(false)}
              onSaved={() => {
                setEdit(false);
                void load();
              }}
            />
          ) : (
            <Editor
              resource={resource}
              row={row}
              lockedFields={
                resource === "commissions"
                  ? ["orderId", "mode", "periodStart", "periodEnd"]
                  : []
              }
              onClose={() => setEdit(false)}
              onSaved={() => {
                setEdit(false);
                void load();
              }}
            />
          ))}
        {action && (
          <ActionForm {...action} onClose={() => setAction(undefined)} />
        )}
        {material && (
          <MaterialEditor
            owner={material}
            versionOf={version}
            onClose={() => {
              setMaterial(undefined);
              setVersion(undefined);
            }}
            onSaved={() => {
              setMaterial(undefined);
              setVersion(undefined);
              void load();
            }}
          />
        )}
      </Spin>
    </DetailContext.Provider>
  );
});
