import { Button, Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RequestError } from "../../../../components/feedback/RequestError";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { api, errorMessage, type Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";

/** Payment information is visible directly within the deposit details. */
export const DepositRecordDetail = observer(function DepositRecordDetail({
  record,
  onPreview,
}: {
  record: Row;
  onPreview: (files: Row[]) => void;
}) {
  const { row: order, root } = useRecordDetail();
  const [detail, setDetail] = useState<Row>();
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const id = record.receipt ? record.id : record.expenseId;
  const resource = record.receipt ? "incomes" : "expenses";
  useEffect(() => {
    let active = true;
    setDetail(undefined);
    setError("");
    api
      .get<Row>(`/${resource}/${id}`)
      .then(({ data }) => {
        if (active) setDetail(data);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [resource, id, root.epoch, retry]);
  if (error)
    return (
      <RequestError
        type="error"
        message={error}
        action={
          <Button onClick={() => setRetry((n) => n + 1)}>{t("重试")}</Button>
        }
      />
    );
  if (!detail)
    return (
      <div className="deposit-record-loading">
        <Spin size="small" />
      </div>
    );
  const payment = record.receipt
    ? detail
    : detail.paymentRecords?.[record.paymentIndex ?? 0] || detail;
  const files: Row[] = root.canRead("materials")
    ? record.receipt
      ? (detail.vouchers ?? [])
      : (order.materials ?? []).filter((file: Row) => file.expenseId === id)
    : [];
  const fields = [
    {
      key: "no",
      label: record.receipt ? "收款编号" : "退款编号",
      value: detail.recordNo || detail.expenseNo || "—",
    },
    ...(record.receipt
      ? [{ key: "payer", label: "付款方", value: detail.payerName || "—" }]
      : []),
    { key: "account", label: "银行账户", value: payment.accountName || "—" },
    {
      key: "reference",
      label: "银行参考号",
      value: payment.bankReference || "—",
    },
    {
      key: "remark",
      label: "说明",
      value: payment.remark || detail.remark || "—",
    },
    {
      key: "vouchers",
      label: "凭证",
      value: files.length ? (
        <Button
          type="link"
          size="small"
          className="!h-auto !p-0"
          onClick={() => onPreview(files)}
        >
          {t(`查看凭证（${files.length}）`)}
        </Button>
      ) : (
        t("暂无凭证")
      ),
    },
    ...(detail.rejectionReason
      ? [{ key: "reason", label: "处理原因", value: detail.rejectionReason }]
      : []),
  ];
  return (
    <>
      <dl className="deposit-record-details">
        {fields.map((field) => (
          <div key={field.key} className="deposit-record-field">
            <dt>{t(field.label)}</dt>
            <dd>
              {typeof field.value === "string" ? t(field.value) : field.value}
            </dd>
          </div>
        ))}
      </dl>
      {record.receipt && record.status === "PENDING" && detail.parentId && (
        <Link to={`/incomes/${detail.parentId}`}>
          {t("前往账单核对历史收款")}
        </Link>
      )}
    </>
  );
});
