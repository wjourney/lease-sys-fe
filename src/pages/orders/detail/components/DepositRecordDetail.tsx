import { Button, Descriptions, Space, Spin } from "antd";
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
  if (!detail) return <Spin size="small" />;
  const payment = record.receipt
    ? detail
    : detail.paymentRecords?.[record.paymentIndex ?? 0] || detail;
  const files: Row[] = root.canRead("materials")
    ? record.receipt
      ? (detail.vouchers ?? [])
      : (order.materials ?? []).filter((file: Row) => file.expenseId === id)
    : [];
  return (
    <div className="min-w-0 whitespace-normal break-words rounded-md bg-[#f7f9fc] p-4 [&_.ant-descriptions-item-content]:break-all">
      <Descriptions
        size="small"
        column={{ xs: 1, sm: 2, xl: 3 }}
        items={[
          {
            key: "no",
            label: t(record.receipt ? "收款编号" : "退款编号"),
            children: detail.recordNo || detail.expenseNo || "—",
          },
          ...(record.receipt
            ? [
                {
                  key: "payer",
                  label: t("付款方"),
                  children: detail.payerName || "—",
                },
              ]
            : []),
          {
            key: "account",
            label: t("银行账户"),
            children: payment.accountName || "—",
          },
          {
            key: "reference",
            label: t("银行参考号"),
            children: payment.bankReference || "—",
          },
          {
            key: "remark",
            label: t("说明"),
            children: payment.remark || detail.remark || "—",
          },
          ...(detail.rejectionReason
            ? [
                {
                  key: "reason",
                  label: t("处理原因"),
                  children: detail.rejectionReason,
                },
              ]
            : []),
        ]}
      />
      <Space wrap>
        {files.length ? (
          <Button size="small" onClick={() => onPreview(files)}>
            {t(`查看凭证（${files.length}）`)}
          </Button>
        ) : (
          <span className="text-sm text-[#78869a]">{t("暂无凭证")}</span>
        )}
        {record.receipt && record.status === "PENDING" && detail.parentId && (
          <Link to={`/incomes/${detail.parentId}`}>
            {t("前往账单核对历史收款")}
          </Link>
        )}
      </Space>
    </div>
  );
});
