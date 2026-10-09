import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Space, Tag } from "antd";
import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { t } from "../../../../shared/i18n";
import { orderLabel } from "../order-state";
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
  const { row, navigate } = useRecordDetail();
  const headerHost = document.getElementById("record-detail-header");
  return (
    <div className="order-detail-toolbar mb-4 flex shrink-0 flex-wrap items-center gap-x-5 gap-y-3">
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
              {t(`订单详情 · ${row.unitNo || row.orderNo || ""}`)}
            </h1>
            <Tag
              color={
                orderDisplayStatus(row.status) === "ENDED" ? "default" : "green"
              }
              className="!m-0 !shrink-0 !text-xs"
            >
              {t(orderLabel(row))}
            </Tag>
          </div>,
          headerHost,
        )}
      <Space wrap size={8}>
        {editable && (
          <Button icon={<EditOutlined aria-hidden />} onClick={onEdit}>
            {t("编辑订单")}
          </Button>
        )}
        {actions}
      </Space>
      <div className="order-detail-summary min-w-0 break-words text-sm leading-5 text-[#718197]">
        {[
          row.orderNo && `订单 ${row.orderNo}`,
          row.tenantName && `租客 ${row.tenantName}`,
          row.projectName,
        ]
          .filter(Boolean)
          .map(t)
          .join(" · ")}
      </div>
    </div>
  );
}
