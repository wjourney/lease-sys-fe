import { OperationActor } from "../../../components/resource-detail/OperationActor";
import { ResourceDetail } from "../../../components/resource-detail/ResourceDetail";
import { RecordBasicInfo } from "../../../components/resource-detail/RecordBasicInfo";
import { ExpenseFiles } from "./components/ExpenseFiles";
import { ExpenseActions } from "./components/ExpenseActions";
import { Card, Table } from "antd";
import { amount, dateText, Row } from "../../../shared/api";
import { t } from "../../../shared/i18n";
export default function ExpenseDetailPage({
  recordId,
  onClose,
}: { recordId?: string; onClose?: () => void } = {}) {
  return (
    <ResourceDetail
      resource="expenses"
      recordId={recordId}
      presentation={onClose ? "drawer" : "page"}
      onClose={onClose}
      actions={<ExpenseActions />}
      getDetailTabs={({ row, id }, sections) => [
        {
          key: "basic",
          label: t("支出资料"),
          children: (
            <div className="expense-detail-info">
              <RecordBasicInfo
                resource="expenses"
                id={id}
                row={row}
                fields={[
                  { key: "expenseNo", label: "支出编号" },
                  { key: "feeType", label: "支出类型" },
                  { key: "payeeName", label: "收款方" },
                  { key: "amount", label: "应付金额" },
                  { key: "paidAmount", label: "实付金额" },
                  { key: "dueOn", label: "到期日期" },
                  { key: "orderNo", label: "关联订单" },
                  { key: "projectName", label: "关联项目" },
                  { key: "remark", label: "说明" },
                ]}
              />
              <Card title={t("付款记录")}>
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
                    {
                      title: t("付款金额"),
                      dataIndex: "amount",
                      render: amount,
                    },
                    { title: t("银行账户"), dataIndex: "accountName" },
                    {
                      title: t("方式"),
                      dataIndex: "paymentMethod",
                      render: (v: string) =>
                        ({ BANK: "银行转账", CASH: "现金", CHEQUE: "支票" })[
                          v
                        ] || v,
                    },
                    {
                      title: t("银行参考号"),
                      dataIndex: "bankReference",
                      render: (v) => v || "—",
                    },
                    {
                      title: t("登记人"),
                      width: 250,
                      render: (_, record) => <OperationActor actor={record} />,
                    },
                  ]}
                />
              </Card>
              <ExpenseFiles />
            </div>
          ),
        },
        { key: "logs", label: t("操作记录"), children: sections.history },
      ]}
    />
  );
}
