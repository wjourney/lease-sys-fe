import { RequestError } from "../../../components/feedback/RequestError";
import { ResourceList } from "../../../components/resource-list/ResourceList";
import { api, errorMessage, Row } from "../../../shared/api";
import { t } from "../../../shared/i18n";
import { useRoot } from "../../../stores/root";
import { Button, Descriptions, Drawer } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

export default observer(function FundAccountListPage() {
  const root = useRoot();
  const [viewing, setViewing] = useState<Row | null>(null);
  const [exists, setExists] = useState<boolean>();
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const epoch = root.epoch;
  useEffect(() => {
    const controller = new AbortController();
    setExists(undefined);
    setError("");
    api
      .get("/fund-accounts", {
        params: { pageSize: 1 },
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (!controller.signal.aborted) setExists(data.total > 0);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e));
      });
    return () => controller.abort();
  }, [epoch, retry]);

  return (
    <>
      {error && (
        <RequestError
          type="error"
          message={error}
          action={
            <Button onClick={() => setRetry((n) => n + 1)}>{t("重试")}</Button>
          }
        />
      )}
      <ResourceList
        resource="fund-accounts"
        onViewRow={setViewing}
        createDisabledReason={
          exists === undefined
            ? error
              ? "暂时无法确认银行账户，请重试"
              : "正在加载银行账户"
            : exists
              ? "只允许创建一个银行账户，每次订单录入默认使用该银行账户"
              : undefined
        }
      />
      <Drawer
        open={!!viewing}
        title={t("银行账户信息")}
        width={520}
        onClose={() => setViewing(null)}
      >
        {viewing && (
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item label={t("账户名称")}>
              {t(viewing.name)}
            </Descriptions.Item>
            <Descriptions.Item label={t("银行名称")}>
              {t(viewing.bankName || "—")}
            </Descriptions.Item>
            <Descriptions.Item label={t("银行账号")}>
              {viewing.accountIdentifier || "—"}
            </Descriptions.Item>
            <Descriptions.Item label={t("币种")}>
              {viewing.currency || "—"}
            </Descriptions.Item>
            <Descriptions.Item label={t("启用")}>
              {t(viewing.enabled ? "是" : "否")}
            </Descriptions.Item>
            <Descriptions.Item label={t("备注")}>
              {t(viewing.remark || "—")}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </>
  );
});
