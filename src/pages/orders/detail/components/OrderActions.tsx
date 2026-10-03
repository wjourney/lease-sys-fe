import { DownloadOutlined, MoreOutlined } from "@ant-design/icons";
import { Button, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { api, errorMessage } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";

export const OrderActions = observer(function OrderActions() {
  const [preparingContract, setPreparingContract] = useState(false);
  const { row, root, modal, run, id, openAction, message, setTab } =
    useRecordDetail();

  async function downloadContract() {
    setPreparingContract(true);
    try {
      await api.post(`/orders/${id}/contract/ensure`);
      root.invalidate();
      const link = document.createElement("a");
      link.href = `/api/v1/orders/${id}/contract/download`;
      link.download = `${row.orderNo} 租赁合同.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      message.error(errorMessage(error));
    } finally {
      setPreparingContract(false);
    }
  }

  const items: MenuProps["items"] = [
    ...(root.manageOrders && row.actions?.terminate
      ? [{ key: "terminate", label: t("登记退租") }]
      : []),
    ...(root.manageOrders && row.actions?.handover
      ? [{ key: "handover", label: t("确认交还") }]
      : []),
    ...(row.actions?.close
      ? [{ key: "close", label: t("关闭订单"), danger: true }]
      : []),
  ];

  function onMore({ key }: { key: string }) {
    if (key === "close") {
      modal.confirm({
        title: t("确认关闭此订单？"),
        content: t("关闭后释放单位占用，并作废未收款的账单。"),
        onOk: () => run(`/orders/${id}/close`),
      });
    } else if (key === "terminate") {
      openAction(
        "登记退租",
        [
          { key: "date", label: "实际退租日期", type: "date" },
          { key: "reason", label: "退租原因", type: "textarea" },
        ],
        `/orders/${id}/terminate`,
      );
    } else if (key === "handover") {
      openAction(
        "登记交还",
        [
          { key: "date", label: "交还日期", type: "date" },
          { key: "note", label: "交还说明", type: "textarea" },
        ],
        `/orders/${id}/handover`,
      );
    }
  }

  return (
    <>
      <Button
        icon={<DownloadOutlined aria-hidden />}
        loading={preparingContract}
        onClick={() => void downloadContract()}
      >
        {t("下载合同")}
      </Button>
      {(row.actions?.settle || row.actions?.refund) && (
        <Button type="primary" onClick={() => setTab("deposit")}>
          {t(row.actions?.refund ? "处理退款" : "处理押金")}
        </Button>
      )}
      {items.length > 0 && (
        <Dropdown menu={{ items, onClick: onMore }} trigger={["click"]}>
          <Button icon={<MoreOutlined aria-hidden />}>{t("更多")}</Button>
        </Dropdown>
      )}
    </>
  );
});
