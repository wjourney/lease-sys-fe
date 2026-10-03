import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { Alert, Button, Space, Tag } from "antd";
import { ReactNode } from "react";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { dateText } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { orderLabel, orderNotice } from "../order-state";

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
  return (
    <div className="mx-auto mb-6 w-full max-w-[1320px]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-2">
          <Button
            type="text"
            icon={<ArrowLeftOutlined aria-hidden />}
            aria-label={t("返回订单列表")}
            onClick={() => navigate("/orders")}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="m-0 text-[24px] font-semibold leading-8 text-[#21324e]">
                {t(row.unitNo || row.orderNo)}
              </h1>
              <Tag
                color={
                  row.status === "ACTIVE"
                    ? "green"
                    : row.status === "PENDING"
                      ? "gold"
                      : "default"
                }
                className="!m-0"
              >
                {t(orderLabel(row))}
              </Tag>
            </div>
            <div className="mt-1 text-sm text-[#7b8a9e]">
              {[
                row.orderNo,
                row.tenantName,
                `${dateText(row.startsOn)} 至 ${dateText(row.endsOn)}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
        </div>
        <Space wrap size={8} className="max-[760px]:ml-10">
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
