import { OperationActor } from "../../../components/resource-detail/OperationActor";
import { ResourceDetail } from "../../../components/resource-detail/ResourceDetail";
import { ExpenseActions } from "./components/ExpenseActions";
import { Card, Table } from "antd";
import { amount, dateText, Row } from "../../../shared/api";
import { t } from "../../../shared/i18n";
export default function ExpenseDetailPage() {
  return (
    <ResourceDetail
      resource="expenses"
      actions={<ExpenseActions />}
      getTabs={({ row }) => [
        {
          key: "payments",
          label: t("付款记录"),
          children: (
            <Card title={t("实际付款记录")}>
              <Table<Row>
                rowKey={(_, index) => String(index)}
                dataSource={row.paymentRecords || []}
                pagination={false}
                scroll={{ x: 700 }}
                columns={[
                  {
                    title: t("付款日期"),
                    dataIndex: "paidOn",
                    render: dateText,
                  },
                  { title: t("付款金额"), dataIndex: "amount", render: amount },
                  { title: t("银行账户"), dataIndex: "accountName" },
                  {
                    title: t("方式"),
                    dataIndex: "paymentMethod",
                    render: (v: string) =>
                      ({ BANK: "银行转账", CASH: "现金", CHEQUE: "支票" })[v] ||
                      v,
                  },
                  { title: t("银行参考号"), dataIndex: "bankReference" },
                  {
                    title: t("登记人"),
                    width: 250,
                    render: (_, record) => <OperationActor actor={record} />,
                  },
                ]}
              />
            </Card>
          ),
        },
      ]}
    />
  );
}
