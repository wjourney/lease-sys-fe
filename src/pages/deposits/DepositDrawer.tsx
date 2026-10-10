import { App, Button, Drawer, Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActionForm } from "../../components/forms/ActionForm";
import { RequestError } from "../../components/feedback/RequestError";
import {
  DetailContext,
  DetailContextValue,
} from "../../components/resource-detail/DetailContext";
import { useRecordActions } from "../../components/resource-detail/useRecordActions";
import { useRecordData } from "../../components/resource-detail/useRecordData";
import {
  OrderDepositSummary,
  openDepositRefund,
} from "../orders/detail/components/OrderDepositSummary";
import { DepositSettlementForm } from "../orders/detail/components/DepositSettlementForm";
import { t } from "../../shared/i18n";
import { Row } from "../../shared/api";
import { useRoot } from "../../stores/root";

export const DepositDrawer = observer(function DepositDrawer({
  id,
  mode,
  onClose,
}: {
  id: string;
  mode?: "settle" | "refund";
  onClose: () => void;
}) {
  const root = useRoot();
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const { row, loading, error, logs, load } = useRecordData(
    "orders",
    id,
    root.epoch,
  );
  const actions = useRecordActions(id);
  const [settling, setSettling] = useState(mode === "settle");
  const [saving, setSaving] = useState(false);
  const [, setMaterial] = useState<Row>();
  const [, setVersion] = useState<string>();
  const opened = useRef(false);
  useEffect(() => {
    if (mode !== "refund" || !row || opened.current) return;
    opened.current = true;
    const refund = row.deposit?.refunds?.find(
      (r: Row) =>
        r.status !== "VOID" && Number(r.amount) > Number(r.paidAmount),
    );
    if (root.finance && refund)
      openDepositRefund(actions.openAction, refund, row.currency);
  }, [mode, row, root.finance, actions.openAction]);
  const context: DetailContextValue | undefined = row
    ? {
        resource: "orders",
        id,
        row,
        root,
        logs,
        receipts: [],
        versions: [],
        navigate,
        message,
        modal,
        setTab: (tab) => navigate(`/orders/${id}?tab=${tab}`),
        openAction: actions.openAction,
        openReceiptAction: actions.openReceiptAction,
        run: actions.run,
        previewInvoice: actions.previewInvoice,
        setMaterial,
        setVersion,
      }
    : undefined;
  return (
    <Drawer
      open
      width={1080}
      title={t(
        row
          ? `押金 · ${row.tenantName} · ${row.unitNo || row.orderNo}`
          : "押金详情",
      )}
      onClose={() => !saving && onClose()}
      closable={!saving}
      maskClosable={!saving}
      keyboard={!saving}
    >
      {error ? (
        <RequestError
          type="error"
          message={error}
          action={<Button onClick={load}>{t("重试")}</Button>}
        />
      ) : (
        <Spin spinning={loading}>
          {context ? (
            <DetailContext.Provider value={context}>
              <p className="mb-4 mt-0 text-sm text-[#78869a]">
                {t(`${row!.orderNo} · ${row!.projectName || ""}`)}
              </p>
              {actions.action ? (
                <ActionForm
                  {...actions.action}
                  presentation="inline"
                  onSavingChange={setSaving}
                  onClose={() => actions.setAction(undefined)}
                />
              ) : settling &&
                (row!.actions?.settle || row!.actions?.reviseDeposit) ? (
                <DepositSettlementForm
                  presentation="inline"
                  onSavingChange={setSaving}
                  onClose={() => setSettling(false)}
                />
              ) : (
                <OrderDepositSummary
                  onSettle={() => setSettling(true)}
                  onRegisterReceipt={actions.setAction}
                />
              )}
            </DetailContext.Provider>
          ) : null}
        </Spin>
      )}
    </Drawer>
  );
});
