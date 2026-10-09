import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { Alert, Button, Space, Tag } from "antd";
import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { dateText } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { orderLabel, orderNotice } from "../order-state";
import { orderDisplayStatus } from "../../../../shared/order-status";

export function OrderDetailHeader({
  actions,
  editable,
  onEdit,
}: {
  actions?: ReactNode;
  editable: boolean;
  onEdit: () => void;
}) {
  const { row, navigate, setTab } = useRecordDetail();
  const notice = orderNotice(row);
  const headerHost = document.getElementById("record-detail-header");
  return (
    <div className="mx-auto mb-6 w-full max-w-[1320px]">
      {headerHost &&
        createPortal(
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="text"
              icon={<ArrowLeftOutlined aria-hidden />}
              aria-label={t("返回订单列表")}
              onClick={() => navigate("/orders")}
            />
            <h1 className="record-header-title">
              {t(row.unitNo || row.orderNo)}
            </h1>
          </div>,
          headerHost,
        )}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Tag
            color={
              orderDisplayStatus(row.status) === "ENDED" ? "default" : "green"
            }
            className="!m-0"
          >
            {t(orderLabel(row))}
          </Tag>
          <div className="min-w-0 text-sm text-[#7b8a9e]">
            {[
              row.orderNo,
              row.tenantName,
              `${dateText(row.startsOn)} 至 ${dateText(row.endsOn)}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        <Space wrap size={8}>
          {editable && (
            <Button icon={<EditOutlined aria-hidden />} onClick={onEdit}>
              {t("编辑")}
            </Button>
          )}
          {actions}
        </Space>
      </div>
      {notice && (
        <Alert
          className="!rounded-md [&_.ant-alert-message]:!text-sm"
          type={row.status === "ACTIVE" ? "success" : "info"}
          showIcon
          message={
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{t(notice)}</span>
              {row.status === "PENDING" && (
                <Button
                  type="link"
                  size="small"
                  className="!h-auto !p-0"
                  onClick={() => setTab("bills")}
                >
                  {t("查看收款")}
                </Button>
              )}
            </div>
          }
        />
      )}
    </div>
  );
}
