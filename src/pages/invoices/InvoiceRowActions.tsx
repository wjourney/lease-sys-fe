import { Alert, App, Button, Dropdown, Form, Input, Modal } from "antd";
import { DownOutlined, MoreOutlined } from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ActionForm } from "../../components/forms/ActionForm";
import { api, errorMessage, type Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";

function ReissueInvoiceModal({
  row,
  onClose,
}: {
  row: Row;
  onClose: () => void;
}) {
  const root = useRoot();
  const { message } = App.useApp();
  const [form] = Form.useForm<{ reason: string }>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit({ reason }: { reason: string }) {
    setSaving(true);
    setError("");
    try {
      await api.post(`/invoices/${row.id}/reissue`, { reason: reason.trim() });
      root.invalidate();
      message.success(t("发票已作废并生成新草稿"));
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      title={t("作废重开发票")}
      okText={t("确认重开")}
      okButtonProps={{ loading: saving }}
      cancelText={t("取消")}
      closable={!saving}
      maskClosable={!saving}
      keyboard={!saving}
      onOk={() => form.submit()}
      onCancel={() => !saving && onClose()}
    >
      <p className="mb-5 text-sm text-[#73819a]">
        {t(`发票 ${row.invoiceNo} 将作废并生成新草稿，请填写重开原因。`)}
      </p>
      {error && (
        <Alert type="error" showIcon message={error} className="mb-4" />
      )}
      <Form form={form} layout="vertical" disabled={saving} onFinish={submit}>
        <Form.Item
          name="reason"
          label={t("重开原因")}
          rules={[
            {
              validator: (_, value) =>
                typeof value === "string" && value.trim()
                  ? Promise.resolve()
                  : Promise.reject(new Error(t("请填写重开原因"))),
            },
          ]}
        >
          <Input.TextArea rows={4} autoFocus />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export const InvoiceRowActions = observer(function InvoiceRowActions({
  row,
  onPreview,
  onEdit,
  onPrint,
  showDetail = true,
  showLabel = false,
}: {
  row: Row;
  onPreview: () => void;
  onEdit: () => void;
  onPrint: () => void;
  showDetail?: boolean;
  showLabel?: boolean;
}) {
  const root = useRoot();
  const navigate = useNavigate();
  const location = useLocation();
  const { message, modal } = App.useApp();
  const [action, setAction] = useState<{ kind: string; requestId: string }>();
  const open = (kind: string) =>
    setAction({ kind, requestId: crypto.randomUUID() });
  const items = [
    { key: "preview", label: t("预览发票"), onClick: onPreview },
    {
      key: "download",
      label: (
        <a
          href={`/api/v1/invoices/${row.id}/pdf?download=true`}
          target="_blank"
          rel="noreferrer"
        >
          {t("下载 PDF")}
        </a>
      ),
    },
    { key: "print", label: t("打印"), onClick: onPrint },
    ...(showDetail
      ? [
          {
            key: "detail",
            label: t("查看详情"),
            onClick: () => navigate(`/invoices/${row.id}${location.search}`),
          },
        ]
      : []),
    ...(root.finance && row.status === "DRAFT"
      ? [
          { key: "edit", label: t("编辑草稿"), onClick: onEdit },
          {
            key: "issue",
            label: t("出具发票"),
            onClick: () =>
              modal.confirm({
                title: t("出具发票"),
                content: t("出具后不可直接编辑，后续修改需作废重开。"),
                onOk: async () => {
                  try {
                    await api.post(`/invoices/${row.id}/issue`);
                    root.invalidate();
                    message.success(t("发票已出具"));
                  } catch (e) {
                    message.error(errorMessage(e));
                    throw e;
                  }
                },
              }),
          },
        ]
      : []),
    ...(root.finance && row.status === "ACTIVE"
      ? [
          {
            key: "send",
            label: t("邮件发送"),
            disabled: ["PENDING", "SENDING", "UNKNOWN"].includes(
              row.emailStatus,
            ),
            onClick: () => open("send"),
          },
          {
            key: "reissue",
            label: t("作废重开"),
            onClick: () => open("reissue"),
          },
        ]
      : []),
    ...(root.finance && ["SENDING", "UNKNOWN"].includes(row.emailStatus)
      ? [
          {
            key: "resolve",
            label: t("核验发送结果"),
            onClick: () => open("email-resolution"),
          },
        ]
      : []),
    ...(root.finance && ["DRAFT", "ACTIVE"].includes(row.status)
      ? [
          {
            key: "void",
            label: t("作废"),
            danger: true,
            onClick: () => open("void"),
          },
        ]
      : []),
  ];
  return (
    <>
      <Dropdown menu={{ items }} trigger={["click"]}>
        <Button
          type={showLabel ? "default" : "text"}
          aria-label={t(`发票操作 ${row.invoiceNo}`)}
          icon={showLabel ? undefined : <MoreOutlined aria-hidden />}
        >
          {showLabel && (
            <>
              {t("更多")} <DownOutlined aria-hidden />
            </>
          )}
        </Button>
      </Dropdown>
      {action?.kind === "reissue" ? (
        <ReissueInvoiceModal row={row} onClose={() => setAction(undefined)} />
      ) : action ? (
        <ActionForm
          title={
            action.kind === "send"
              ? "发送发票"
              : action.kind === "email-resolution"
                ? "核验发送结果"
                : "作废发票"
          }
          fields={
            action.kind === "send"
              ? [
                  { key: "emailTo", label: "接收邮箱" },
                  { key: "emailSubject", label: "邮件主题" },
                ]
              : action.kind === "void"
                ? [{ key: "reason", label: "操作原因", type: "textarea" }]
                : [
                    {
                      key: "resolution",
                      label: "核验结果",
                      type: "select",
                      options: [
                        { value: "SENT", label: "确认已发送成功" },
                        { value: "RETRY", label: "确认未发送，重新发送" },
                      ],
                    },
                    { key: "reason", label: "核验说明", type: "textarea" },
                  ]
          }
          initial={{
            emailTo: row.snapshot?.payerEmail || row.emailTo,
            emailSubject: `${row.invoiceNo} 租赁发票`,
          }}
          onClose={() => setAction(undefined)}
          onSubmit={async (values) => {
            if (action.kind === "send")
              await api.post(`/invoices/${row.id}/render`);
            await api.post(`/invoices/${row.id}/${action.kind}`, {
              ...values,
              ...(action.kind === "send"
                ? { requestId: action.requestId }
                : {}),
            });
            root.invalidate();
            message.success(t("操作成功"));
          }}
        />
      ) : null}
    </>
  );
});
