import { App, Button, Descriptions, Drawer, Space, Spin, Tag } from "antd";
import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { api, amount, dateText, errorMessage, Row } from "../../shared/api";
import { Status } from "../../shared/ui";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";
import { ActionForm } from "../forms/ActionForm";
import { MaterialEditor } from "../forms/MaterialEditor";
import { Link } from "react-router-dom";

export const ReceiptActions = observer(function ReceiptActions({
  receipt,
  view = true,
}: {
  receipt: Row;
  view?: boolean;
}) {
  const root = useRoot();
  const { modal, message } = App.useApp();
  const [action, setAction] = useState<string>();
  const [viewing, setViewing] = useState(false);
  const [upload, setUpload] = useState(false);
  const labels: Record<string, string> = {
    reject: "驳回收款",
    withdraw: "撤回登记",
    reverse: "冲正收款",
  };
  return (
    <Space wrap data-row-action>
      {view && (
        <Button size="small" onClick={() => setViewing(true)}>
          {t("查看")}
        </Button>
      )}
      {receipt.status === "PENDING" && root.finance && (
        <>
          <Button
            size="small"
            type="primary"
            onClick={() =>
              modal.confirm({
                title: t("确认已核对实际到账？"),
                content: amount(receipt.amount),
                onOk: async () => {
                  try {
                    await api.post(`/incomes/${receipt.id}/confirm`);
                    root.invalidate();
                    message.success(t("已确认到账"));
                  } catch (e) {
                    message.error(errorMessage(e));
                    throw e;
                  }
                },
              })
            }
          >
            {t("确认到账")}
          </Button>
          <Button size="small" onClick={() => setAction("reject")}>
            {t("驳回")}
          </Button>
        </>
      )}
      {receipt.status === "PENDING" &&
        (root.finance || receipt.createdBy === root.user?.id) && (
          <Button size="small" onClick={() => setAction("withdraw")}>
            {t("撤回")}
          </Button>
        )}
      {receipt.status === "CONFIRMED" && root.finance && (
        <Button size="small" onClick={() => setAction("reverse")}>
          {t("冲正")}
        </Button>
      )}
      {receipt.status === "PENDING" && (
        <Button size="small" onClick={() => setUpload(true)}>
          {t("补传凭证")}
        </Button>
      )}
      {viewing && (
        <ReceiptDrawer id={receipt.id} onClose={() => setViewing(false)} />
      )}
      {action && (
        <ActionForm
          title={labels[action]}
          fields={[
            {
              key: "reason",
              label:
                action === "reverse"
                  ? "错误原因（冲正将作废原收据，实际退款请办理退款付款）"
                  : "原因",
              type: "textarea",
              required: true,
            },
          ]}
          onClose={() => setAction(undefined)}
          onSubmit={async (v) => {
            await api.post(`/incomes/${receipt.id}/${action}`, v);
            root.invalidate();
            message.success(t("操作成功"));
          }}
        />
      )}
      {upload && (
        <MaterialEditor
          owner={{ incomeId: receipt.id }}
          onClose={() => setUpload(false)}
          onSaved={() => {
            setUpload(false);
            root.invalidate();
          }}
        />
      )}
    </Space>
  );
});

export const ReceiptDrawer = observer(function ReceiptDrawer({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const root = useRoot();
  const { message } = App.useApp();
  const [row, setRow] = useState<Row>();
  const [files, setFiles] = useState<Row[]>([]);
  useEffect(() => {
    let active = true;
    api
      .get<Row>(`/incomes/${id}`)
      .then(async ({ data }) => {
        if (active) {
          setRow(data);
          setFiles(data.vouchers ?? []);
        }
      })
      .catch((e) => {
        if (active) message.error(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [id, root.epoch, message]);
  return (
    <Drawer open width={620} title={t("收款详情")} onClose={onClose}>
      {!row ? (
        <Spin />
      ) : (
        <>
          <Descriptions
            column={1}
            items={[
              { key: "no", label: t("收款编号"), children: row.recordNo },
              { key: "bill", label: t("应收账单"), children: row.billNo },
              {
                key: "order",
                label: t("关联订单"),
                children: row.orderNo || "—",
              },
              { key: "amount", label: t("金额"), children: amount(row.amount) },
              {
                key: "date",
                label: t("到账日期"),
                children: dateText(row.receivedOn),
              },
              { key: "payer", label: t("付款方"), children: row.payerName },
              {
                key: "account",
                label: t("资金账户"),
                children: row.accountName || "—",
              },
              {
                key: "method",
                label: t("付款方式"),
                children: (
                  { BANK: "银行转账", CASH: "现金", CHEQUE: "支票" } as Row
                )[row.paymentMethod],
              },
              {
                key: "reference",
                label: t("银行参考号"),
                children: row.bankReference || "—",
              },
              {
                key: "state",
                label: t("状态"),
                children: <Status value={row.status} />,
              },
              {
                key: "reason",
                label: t("处理原因"),
                children: row.rejectionReason || "—",
              },
              { key: "remark", label: t("说明"), children: row.remark || "—" },
            ]}
          />
          <div className="my-5">
            <ReceiptActions receipt={row} view={false} />
            <Space wrap className="mt-3">
              {row.parentId && (
                <Link to={`/incomes/${row.parentId}`} onClick={onClose}>
                  {t("查看来源账单")}
                </Link>
              )}
              {row.orderId && (
                <Link to={`/orders/${row.orderId}`} onClick={onClose}>
                  {t("查看来源订单")}
                </Link>
              )}
              {root.canRead("invoices") &&
                ["CONFIRMED", "REVERSED"].includes(row.status) && (
                  <Link to={`/invoices?incomeId=${row.id}`} onClick={onClose}>
                    {t("查看收据")}
                  </Link>
                )}
            </Space>
          </div>
          <h3>{t("收款凭证")}</h3>
          {files.length ? (
            files.map((f) => (
              <p key={f.id}>
                <a
                  href={`/api/v1/materials/${f.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {f.title || f.originalName}
                </a>
              </p>
            ))
          ) : (
            <Tag>{t("暂无凭证，可补传")}</Tag>
          )}
        </>
      )}
    </Drawer>
  );
});
