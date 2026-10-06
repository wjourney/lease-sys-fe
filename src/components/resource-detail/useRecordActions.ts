import { App } from "antd";
import { useState } from "react";
import { api, errorMessage, Row } from "../../shared/api";
import { Field } from "../../shared/resource-config";
import { registerReceiptWithVoucher } from "../../shared/receipt-voucher";
import { useRoot } from "../../stores/root";
export function useRecordActions(id: string) {
  const root = useRoot();
  const { message } = App.useApp();
  const [action, setAction] = useState<any>();
  function openAction(
    title: string,
    fields: Field[],
    path: string,
    initial: Row = {},
    extra: Row = {},
  ) {
    setAction({
      title,
      fields,
      initial,
      onSubmit: async (v: Row) => {
        await api.post(path, {
          ...v,
          ...extra,
        });
        message.success("操作成功");
        root.invalidate();
      },
    });
  }
  function openReceiptAction(
    fields: Field[],
    path: string,
    initial: Row = {},
    extra: Row = {},
  ) {
    setAction({
      title: "登记收款",
      fields,
      initial,
      voucher: true,
      onSubmit: async (values: Row, file?: File) => {
        const { voucherFailed } = await registerReceiptWithVoucher(
          path,
          values,
          extra,
          file,
        );
        root.invalidate();
        if (voucherFailed)
          message.warning("收款已登记，但凭证上传失败，请在收款记录中补传。");
        else message.success("收款登记成功");
      },
    });
  }
  async function run(path: string, body: Row = {}) {
    try {
      await api.post(path, body);
      message.success("操作成功");
      root.invalidate();
    } catch (e) {
      message.error(errorMessage(e));
    }
  }
  async function previewInvoice() {
    const tab = window.open("", "_blank");
    try {
      const { data } = await api.get("/materials", {
        params: {
          invoiceId: id,
        },
      });
      if (!data.items[0]) {
        tab?.close();
        message.info("文件尚未生成，请先生成 PDF");
        return;
      }
      if (tab)
        tab.location.href =
          "/api/v1/materials/" + data.items[0].id + "/download";
    } catch (e) {
      tab?.close();
      message.error(errorMessage(e));
    }
  }
  return {
    action,
    setAction,
    openAction,
    openReceiptAction,
    run,
    previewInvoice,
  };
}
