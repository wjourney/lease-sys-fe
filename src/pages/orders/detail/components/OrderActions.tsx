import {
  DownloadOutlined,
  LogoutOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Button, Space, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { t } from "../../../../shared/i18n";
import { orderDisplayStatus } from "../../../../shared/order-status";
import { OrderLeaseAction } from "./OrderLeaseAction";

export const OrderActions = observer(function OrderActions() {
  const { row, root } = useRecordDetail();
  const [action, setAction] = useState<"renew" | "terminate">();
  if (!root.manageOrders && !root.canRead("materials")) return null;
  const ended = orderDisplayStatus(row.status) === "ENDED";
  const unavailable = row.status === "DRAFT";
  const hint = ended
    ? t("租约已结束")
    : unavailable
      ? t("请先完善租约资料")
      : undefined;
  return (
    <>
      <Space size={8} wrap>
        {root.manageOrders && (
          <>
            <Tooltip title={hint}>
              <span>
                <Button
                  icon={<ReloadOutlined aria-hidden />}
                  disabled={ended || unavailable}
                  onClick={() => setAction("renew")}
                >
                  {t("一键续约")}
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={hint}>
              <span>
                <Button
                  danger
                  icon={<LogoutOutlined aria-hidden />}
                  disabled={ended || unavailable}
                  onClick={() => setAction("terminate")}
                >
                  {t("提前结束租约")}
                </Button>
              </span>
            </Tooltip>
          </>
        )}
        {root.canRead("materials") && (
          <Tooltip
            title={
              !row.currentContractMaterialId ? t("合同尚未生成") : undefined
            }
          >
            <span>
              <Button
                icon={<DownloadOutlined aria-hidden />}
                disabled={!row.currentContractMaterialId}
                href={
                  row.currentContractMaterialId
                    ? `/api/v1/orders/${row.id}/contract/download`
                    : undefined
                }
              >
                {t("下载合同")}
              </Button>
            </span>
          </Tooltip>
        )}
      </Space>
      {action && (
        <OrderLeaseAction
          key={action}
          action={action}
          onClose={() => setAction(undefined)}
        />
      )}
    </>
  );
});
