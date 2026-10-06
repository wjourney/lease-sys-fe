import { Pagination, Select, Table, Tabs } from "antd";
import { useState } from "react";
import { observer } from "mobx-react-lite";
import { ResourceList } from "../../../components/resource-list/ResourceList";
import { ReceiptActions } from "../../../components/receipts/ReceiptActions";
import { RegisterReceipt } from "../../../components/receipts/RegisterReceipt";
import { amount, dateText, Row } from "../../../shared/api";
import { Status } from "../../../shared/ui";
import { t } from "../../../shared/i18n";
import { useRoot } from "../../../stores/root";

export default observer(function IncomeListPage() {
  const root = useRoot();
  const [tab, setTab] = useState(root.finance ? "receipts" : "bills");
  const [status, setStatus] = useState(root.finance ? "PENDING" : "");
  const receipts = tab === "receipts";
  const states = receipts
    ? {
        PENDING: "待核对",
        CONFIRMED: "已确认",
        REJECTED: "已驳回",
        WITHDRAWN: "已撤回",
        REVERSED: "已冲正",
      }
    : { OPEN: "待收款", PARTIAL: "部分收款", PAID: "已收齐", VOID: "已作废" };
  return (
    <ResourceList
      key={tab}
      resource="incomes"
      embedded
      hideCreate
      hideStatus
      fixed={{ recordType: receipts ? "RECEIPT" : "RECEIVABLE", status }}
      listToolbar={
        <Tabs
          activeKey={tab}
          onChange={(key) => {
            setTab(key);
            setStatus(key === "receipts" && root.finance ? "PENDING" : "");
          }}
          items={[
            { key: "bills", label: t("应收账单") },
            { key: "receipts", label: t("收款核对") },
          ]}
        />
      }
      filterExtras={
        <label className="flex items-center gap-3">
          {t("状态")}
          <Select
            style={{ width: 150 }}
            value={status}
            onChange={setStatus}
            options={[
              { value: "", label: t("全部状态") },
              ...Object.entries(states).map(([value, label]) => ({
                value,
                label: t(label),
              })),
            ]}
          />
        </label>
      }
      onResetExtras={() => setStatus("")}
      renderRowActions={(r) => (
        <RegisterReceipt
          bills={[r]}
          orderId={r.orderId}
          payerName={r.payerName}
        />
      )}
      renderItems={
        receipts
          ? ({ store, page, onPageChange }) => (
              <>
                <div className="list-scroll-area">
                  <Table<Row>
                    rowKey="id"
                    loading={store.loading}
                    dataSource={store.items}
                    pagination={false}
                    scroll={{ x: "max-content" }}
                    columns={[
                      { title: t("收款编号"), dataIndex: "recordNo" },
                      { title: t("付款方"), dataIndex: "payerName" },
                      { title: t("关联订单"), dataIndex: "orderNo" },
                      { title: t("账单"), dataIndex: "billNo" },
                      { title: t("金额"), dataIndex: "amount", render: amount },
                      {
                        title: t("到账日期"),
                        dataIndex: "receivedOn",
                        render: dateText,
                      },
                      { title: t("资金账户"), dataIndex: "accountName" },
                      {
                        title: t("状态"),
                        dataIndex: "status",
                        render: (s) => <Status value={s} />,
                      },
                      {
                        title: t("操作"),
                        render: (_, r) => <ReceiptActions receipt={r} />,
                      },
                    ]}
                  />
                </div>
                <div className="list-pagination flex justify-end">
                  <Pagination
                    current={page}
                    pageSize={12}
                    total={store.total}
                    showSizeChanger={false}
                    onChange={onPageChange}
                  />
                </div>
              </>
            )
          : undefined
      }
    />
  );
});
