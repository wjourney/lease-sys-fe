import { DeleteOutlined } from "@ant-design/icons";
import { App, Button, Descriptions, Form, Input, Modal, Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { api, errorMessage, type Row } from "../../../shared/api";
import { t } from "../../../shared/i18n";
import { useRoot } from "../../../stores/root";

export const OrderDeleteButton = observer(function OrderDeleteButton({ order, onDeleted, small = false }: { order: Row; onDeleted?: () => void; small?: boolean }) {
  const root = useRoot();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Row>();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [form] = Form.useForm();
  if (!root.canWrite("orders")) return null;
  async function load() {
    setFailed(false); setPreview(undefined);
    try { const { data } = await api.get(`/orders/${order.id}/deletion-preview`); setPreview(data); }
    catch (error) { setFailed(true); message.error(errorMessage(error)); }
  }
  async function remove() {
    const { reason } = await form.validateFields();
    setSaving(true);
    try {
      await api.delete(`/orders/${order.id}`, { data: { reason } });
      message.success(t("订单及关联记录已删除"));
      setOpen(false); root.invalidate(); onDeleted?.();
    } catch (error) { message.error(errorMessage(error)); }
    finally { setSaving(false); }
  }
  return <>
    <Button danger size={small ? "small" : "middle"} icon={small ? undefined : <DeleteOutlined />} onClick={() => { form.resetFields(); setOpen(true); void load(); }}>{t("删除订单")}</Button>
    <Modal title={t("删除订单")} open={open} onCancel={() => { if (!saving) setOpen(false); }} onOk={remove} okText={t("确认删除")} cancelText={t("取消")} confirmLoading={saving} okButtonProps={{ danger: true, disabled: !preview?.allowed || saving }} cancelButtonProps={{ disabled: saving }} closable={!saving} maskClosable={!saving}>
      <p>{t(`订单：${order.orderNo || order.id}`)}</p>
      {!preview && !failed && <Spin />}
      {failed && <Button onClick={load}>{t("重新加载")}</Button>}
      {preview && <>
        <p>{t("删除将同时移除下列关联业务，并重新计算单位状态和统计。操作记录保留供追溯。")}</p>
        <Descriptions column={2} items={[["bills", "账单（含押金）"], ["receipts", "收款登记"], ["commissions", "佣金"], ["expenses", "支出"], ["invoices", "收据"], ["materials", "合同及附件"]].map(([key, label]) => ({ key, label: t(label), children: preview[key] ?? 0 }))} />
        {preview.allowed ? <Form form={form} layout="vertical"><Form.Item name="reason" label={t("删除原因")} rules={[{ required: true, whitespace: true, message: t("请填写删除原因") }]}><Input.TextArea maxLength={500} rows={3} disabled={saving} /></Form.Item></Form> : <p className="text-[#b54708]">{t(preview.reason)}</p>}
      </>}
    </Modal>
  </>;
});
