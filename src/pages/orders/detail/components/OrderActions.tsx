import {
  DownloadOutlined,
  LogoutOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Button, Space, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { saveDownload } from "../../../../components/batch/export";
import { api, errorMessage } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { orderDisplayStatus } from "../../../../shared/order-status";
import { OrderLeaseAction } from "./OrderLeaseAction";

export const OrderActions = observer(function OrderActions() {
  const { row, root, message } = useRecordDetail();
  const [action, setAction] = useState<"renew" | "terminate">();
  const [downloading, setDownloading] = useState(false);
  if (!root.manageOrders && !root.canRead("materials")) return null;
  const ended = orderDisplayStatus(row.status) === "ENDED";
  const unavailable = row.status === "DRAFT";
  const hint = ended
    ? t("租约已结束")
    : unavailable
      ? t("请先完善租约资料")
      : undefined;
  async function generateAndDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      await api.post(`/orders/${row.id}/contract/ensure`);
      root.invalidate();
      const { data } = await api.get<Blob>(
        `/orders/${row.id}/contract/download`,
        {
          responseType: "blob",
        },
      );
      saveDownload(data, `${row.orderNo} 租赁合同.pdf`);
    } catch (error) {
      message.error(errorMessage(error));
    } finally {
      setDownloading(false);
    }
  }
  return (
    <>
      <Space size={8} wrap>
        {root.manageOrders && (
          <>
            <Tooltip title={row.actions?.renew ? undefined : hint}>
              <span>
                <Button
                  icon={<ReloadOutlined aria-hidden />}
                  disabled={!(row.actions?.renew ?? (!ended && !unavailable))}
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
              unavailable
                ? t("请先完善租约资料")
                : !row.currentContractMaterialId
                  ? t(
                      root.manageOrders
                        ? "点击生成并下载合同"
                        : "合同尚未生成，请联系平台管理员",
                    )
                  : undefined
            }
          >
            <span>
              <Button
                icon={<DownloadOutlined aria-hidden />}
                disabled={
                  unavailable ||
                  (!row.currentContractMaterialId && !root.manageOrders)
                }
                loading={downloading}
                onClick={
                  !row.currentContractMaterialId
                    ? () => void generateAndDownload()
                    : undefined
                }
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
