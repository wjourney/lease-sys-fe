import { Tag } from "antd";
import { t } from "../../../shared/i18n";

export function AccountStatusTag({ status }: { status?: string }) {
  return (
    <Tag bordered={false} color={status === "ACTIVE" ? "green" : "default"}>
      {t(status === "ACTIVE" ? "启用" : "停用")}
    </Tag>
  );
}
