import { App, Button, Space, Table } from "antd";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import { ActionForm } from "../../components/forms/ActionForm";
import { financialFields } from "../../components/resource-detail/financial-fields";
import { exportRows } from "../../components/batch/export";
import { api, errorMessage, type Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";

export const CommissionBatchActions = observer(function CommissionBatchActions({
  rows,
}: {
  rows: Row[];
}) {
  const root = useRoot();
  const { message } = App.useApp();
  const [commissions, setCommissions] = useState<Row[]>();
  const [results, setResults] = useState<Row[]>([]);
  const keys = useRef(new Map<string, string>());
  const paid = useRef(new Set<string>());
  const available = rows.filter(
    (r) => r.status !== "VOID" && Number(r.availableAmount) > 0,
  );
  if (!root.finance) return null;
  const report = results.length ? (
    <Table
      rowKey="id"
      size="small"
      pagination={false}
      dataSource={results}
      columns={[
        { title: t("佣金"), dataIndex: "commissionNo" },
        {
          title: t("执行结果"),
          render: (_, r) => (r.ok ? t("已登记付款") : t(r.message)),
        },
      ]}
    />
  ) : null;
  return (
    <>
      <Space wrap className="mb-4">
        <span>{t(`已选 ${rows.length} 条（当前页）`)}</span>
        <Button
          disabled={!rows.length}
          onClick={() =>
            exportRows(
              rows,
              [
                ["commissionNo", "佣金编号"],
                ["orderNo", "订单编号"],
                ["salesName", "员工"],
                ["amount", "应付（HKD）"],
                ["paidAmount", "已付（HKD）"],
                ["remainingAmount", "剩余（HKD）"],
                ["status", "状态"],
              ],
              "佣金.csv",
            )
          }
        >
          {t("导出所选")}
        </Button>
        <Button
          type="primary"
          disabled={!available.length}
          onClick={() => {
            keys.current = new Map(
              available.map((r) => [r.id, crypto.randomUUID()]),
            );
            paid.current = new Set();
            setResults([]);
            setCommissions(available);
          }}
        >
          {t(`批量登记付款（${available.length}）`)}
        </Button>
      </Space>
      {!commissions && report}
      {commissions && (
        <ActionForm
          title="批量登记佣金付款"
          initial={{
            paymentMethod: "BANK",
            ...Object.fromEntries(
              commissions.map((r) => [`commission_${r.id}`, r.availableAmount]),
            ),
          }}
          fields={[
            ...commissions.map((r) => ({
              key: `commission_${r.id}`,
              label: `${r.commissionNo}（可付 HK$ ${r.availableAmount}）`,
              type: "money" as const,
            })),
            ...financialFields,
          ]}
          onClose={() => {
            setCommissions(undefined);
            root.invalidate();
          }}
          onSubmit={async (values) => {
            const next: Row[] = [];
            for (const row of commissions) {
              if (paid.current.has(row.id)) {
                next.push({ ...row, ok: true });
                continue;
              }
              const amount = String(values[`commission_${row.id}`] ?? "0");
              if (
                !(Number(amount) > 0) ||
                Number(amount) > Number(row.availableAmount)
              ) {
                next.push({
                  ...row,
                  ok: false,
                  message: "付款金额须大于零且不超过可付余额",
                });
                continue;
              }
              try {
                await api.post(`/commissions/${row.id}/payments`, {
                  amount,
                  paidOn: values.paidOn,
                  fundAccountId: values.fundAccountId,
                  paymentMethod: values.paymentMethod,
                  bankReference: values.bankReference,
                  sourceKey: keys.current.get(row.id),
                });
                paid.current.add(row.id);
                next.push({ ...row, ok: true });
              } catch (error) {
                next.push({ ...row, ok: false, message: errorMessage(error) });
              }
              setResults([...next]);
            }
            setResults(next);
            if (next.some((r) => !r.ok)) {
              message.warning(t("部分佣金付款未完成，再次提交仅重试失败项"));
              throw new Error("操作未完成，请稍后再试");
            }
            message.success(t("所选佣金已登记付款"));
          }}
        >
          {report}
        </ActionForm>
      )}
    </>
  );
});
