import { RequestError } from "../../components/feedback/RequestError";
import { Button, Drawer, Pagination, Table } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ReceiptActions } from "../../components/receipts/ReceiptActions";
import { dateText, Page, Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";
import { formatMoney } from "../finance/finance-data";
import { useBillRequest } from "./bill-data";

export const ReceiptReviewDrawer = observer(function ReceiptReviewDrawer({
  currency,
  onClose,
}: {
  currency: string;
  onClose: () => void;
}) {
  const root = useRoot();
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useBillRequest<Page>(
    "/incomes",
    {
      recordType: "RECEIPT",
      status: "PENDING",
      currency,
      orderOnly: "true",
      page,
      pageSize: 12,
    },
    root.epoch,
  );
  useEffect(() => {
    if (!loading && data && page > Math.max(1, Math.ceil(data.total / 12)))
      setPage(Math.max(1, Math.ceil(data.total / 12)));
  }, [data, loading, page]);
  return (
    <Drawer open title={t("待核对收款")} width={1100} onClose={onClose}>
      <p className="mb-4 text-sm text-[#738198]">
        {t(
          "当前币种下所有订单的待核对收款。查看收款详情与凭证后，再确认实际到账。",
        )}
      </p>
      {error ? (
        <RequestError
          type="error"
          message={error}
          action={<Button onClick={reload}>{t("重试")}</Button>}
        />
      ) : (
        <>
          <Table<Row>
            rowKey="id"
            size="small"
            loading={loading}
            dataSource={data?.items || []}
            pagination={false}
            scroll={{ x: 1100 }}
            columns={[
              { title: t("收款编号"), dataIndex: "recordNo", width: 190 },
              { title: t("账单编号"), dataIndex: "billNo", width: 190 },
              {
                title: t("订单"),
                dataIndex: "orderNo",
                render: (v, row) => (
                  <Link to={`/orders/${row.orderId}`}>{v}</Link>
                ),
              },
              { title: t("付款方"), dataIndex: "payerName" },
              {
                title: t("金额"),
                dataIndex: "amount",
                render: (v, row) => formatMoney(v, row.currency),
              },
              {
                title: t("到账日期"),
                dataIndex: "receivedOn",
                render: dateText,
              },
              { title: t("平台账户"), dataIndex: "accountName" },
              {
                title: t("凭证 / 操作"),
                width: 260,
                render: (_, r) => <ReceiptActions receipt={r} />,
              },
            ]}
          />
          <Pagination
            className="mt-5"
            current={page}
            pageSize={12}
            total={data?.total || 0}
            showSizeChanger={false}
            onChange={setPage}
          />
        </>
      )}
    </Drawer>
  );
});
