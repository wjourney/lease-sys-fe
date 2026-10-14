import {
  CalendarOutlined,
  CloseOutlined,
  FileTextOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { App, Button, Drawer, Space, Spin } from "antd";
import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { api, dateText, errorMessage, Row } from "../../shared/api";
import { formatMoney } from "../../shared/money-format";
import { Status } from "../../shared/ui";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";
import { ActionForm } from "../forms/ActionForm";
import { MaterialEditor } from "../forms/MaterialEditor";
import { Link } from "react-router-dom";

export const ReceiptActions = observer(function ReceiptActions({
  receipt,
  view = true,
  showUpload = true,
}: {
  receipt: Row;
  view?: boolean;
  showUpload?: boolean;
}) {
  const root = useRoot();
  const { modal, message } = App.useApp();
  const [action, setAction] = useState<"reject" | "withdraw">();
  const [viewing, setViewing] = useState(false);
  const [upload, setUpload] = useState(false);
  const labels: Record<string, string> = {
    reject: "驳回收款",
    withdraw: "撤回登记",
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
                content: formatMoney(receipt.amount, receipt.currency || "HKD"),
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
        !root.salesRole &&
        (root.finance || receipt.createdBy === root.user?.id) && (
          <Button size="small" onClick={() => setAction("withdraw")}>
            {t("撤回")}
          </Button>
        )}
      {showUpload && receipt.status === "PENDING" && !root.salesRole && (
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
              label: "原因",
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
  const [upload, setUpload] = useState(false);
  useEffect(() => {
    let active = true;
    setRow(undefined);
    api
      .get<Row>(`/incomes/${id}`)
      .then(async ({ data }) => {
        if (active) {
          setRow(data);
        }
      })
      .catch((e) => {
        if (active) message.error(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [id, root.epoch, message]);
  const canUpload = !root.salesRole && root.canWrite("materials");
  const files: Row[] = row?.vouchers ?? [];
  const paymentMethod = row
    ? (
        { BANK: "银行转账", CASH: "现金", CHEQUE: "支票" } as Record<
          string,
          string
        >
      )[row.paymentMethod] ||
      row.paymentMethod ||
      "—"
    : "—";
  return (
    <Drawer
      open
      className="receipt-detail-drawer"
      width="min(100vw, 820px, max(560px, 41vw))"
      closable={false}
      title={
        <div className="receipt-detail-heading">
          <div className="receipt-detail-heading-copy">
            <strong>{t("收款详情")}</strong>
            {row?.recordNo && (
              <span>
                {t("编号")}：{row.recordNo}
              </span>
            )}
          </div>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            aria-label={t("关闭")}
          />
        </div>
      }
      onClose={onClose}
    >
      {!row ? (
        <Spin />
      ) : (
        <div className="receipt-detail-content">
          <section
            className="receipt-detail-summary"
            aria-label={t("收款概况")}
          >
            <div className="receipt-detail-summary-label">{t("收款金额")}</div>
            <div className="receipt-detail-summary-main">
              <strong>{formatMoney(row.amount, row.currency || "HKD")}</strong>
              <Status value={row.status} resource="receipts" />
            </div>
            <div className="receipt-detail-date">
              <CalendarOutlined aria-hidden />
              <span>
                {t("到账日期")}：{dateText(row.receivedOn)}
              </span>
            </div>
            {row.status === "PENDING" && (
              <div className="receipt-detail-pending-actions">
                <ReceiptActions receipt={row} view={false} showUpload={false} />
              </div>
            )}
          </section>

          <section
            className="receipt-detail-section"
            aria-labelledby="receipt-related-heading"
          >
            <h3 id="receipt-related-heading">{t("关联信息")}</h3>
            <dl className="receipt-detail-related">
              <div>
                <dt>{t("应收账单")}</dt>
                <dd>{row.billNo || "—"}</dd>
                {row.parentId && root.canAccessPage("incomes") && (
                  <Link to={`/incomes/${row.parentId}`} onClick={onClose}>
                    {t("查看账单")}
                  </Link>
                )}
              </div>
              <div>
                <dt>{t("关联订单")}</dt>
                <dd>{row.orderNo || "—"}</dd>
                {row.orderId && (
                  <Link to={`/orders/${row.orderId}`} onClick={onClose}>
                    {t("查看订单")}
                  </Link>
                )}
              </div>
            </dl>
          </section>

          <section
            className="receipt-detail-section"
            aria-labelledby="receipt-payment-heading"
          >
            <h3 id="receipt-payment-heading">{t("付款信息")}</h3>
            <dl className="receipt-detail-fields">
              <div>
                <dt>{t("付款方")}</dt>
                <dd>{row.payerName || "—"}</dd>
              </div>
              <div>
                <dt>{t("收款账户")}</dt>
                <dd>{row.accountName || "—"}</dd>
              </div>
              <div>
                <dt>{t("付款方式")}</dt>
                <dd>{t(paymentMethod)}</dd>
              </div>
              <div>
                <dt>{t("银行参考号")}</dt>
                <dd>{row.bankReference || "—"}</dd>
              </div>
              {row.rejectionReason && (
                <div>
                  <dt>{t("处理原因")}</dt>
                  <dd>{row.rejectionReason}</dd>
                </div>
              )}
              <div>
                <dt>{t("说明")}</dt>
                <dd>{row.remark || "—"}</dd>
              </div>
            </dl>
          </section>

          <section
            className="receipt-detail-section receipt-detail-vouchers"
            aria-labelledby="receipt-voucher-heading"
          >
            <div className="receipt-detail-voucher-heading">
              <h3 id="receipt-voucher-heading">{t("收款凭证")}</h3>
              {root.canAccessPage("invoices") &&
                ["CONFIRMED", "REVERSED"].includes(row.status) && (
                  <Link to={`/invoices?incomeId=${row.id}`} onClick={onClose}>
                    {t("查看收据")}
                  </Link>
                )}
            </div>
            <div className="receipt-detail-voucher-row">
              {files.length ? (
                <div className="receipt-detail-voucher-list">
                  {files.map((file) => (
                    <a
                      key={file.id}
                      href={`/api/v1/materials/${file.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileTextOutlined aria-hidden />
                      <span>{file.title || file.originalName}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="receipt-detail-voucher-empty">
                  <FileTextOutlined aria-hidden />
                  <span>{t("暂无凭证")}</span>
                </div>
              )}
              {canUpload && (
                <Button
                  icon={<UploadOutlined />}
                  onClick={() => setUpload(true)}
                >
                  {t("补传凭证")}
                </Button>
              )}
            </div>
          </section>
        </div>
      )}
      {upload && row && (
        <MaterialEditor
          owner={{ incomeId: row.id, category: "VOUCHER" }}
          onClose={() => setUpload(false)}
          onSaved={() => {
            setUpload(false);
            root.invalidate();
          }}
        />
      )}
    </Drawer>
  );
});
