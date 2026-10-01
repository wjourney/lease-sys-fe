import { Card, Table, TabsProps } from "antd";
import { DetailContextValue } from "../../../../components/resource-detail/DetailContext";
import { dateText } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
export function getMaterialTabs(
  ctx: DetailContextValue,
): NonNullable<TabsProps["items"]> {
  const { resource, versions, navigate } = ctx;
  const tabs: NonNullable<TabsProps["items"]> = [];
  if (resource === "materials")
    tabs.push({
      key: "versions",
      label: t("历史版本"),
      children: (
        <Card>
          <Table
            rowKey="id"
            pagination={false}
            dataSource={versions}
            columns={[
              {
                title: t("版本"),
                dataIndex: "versionNo",
              },
              {
                title: t("资料名称"),
                dataIndex: "title",
                render: (v, r) => (
                  <a onClick={() => navigate("/materials/" + r.id)}>{v}</a>
                ),
              },
              {
                title: t("上传时间"),
                dataIndex: "createdAt",
                render: dateText,
              },
              {
                title: t("操作"),
                render: (_, r) =>
                  r.storageKey ? (
                    <a
                      target="_blank"
                      href={"/api/v1/materials/" + r.id + "/download"}
                    >
                      {t("下载")}
                    </a>
                  ) : (
                    t("文字资料")
                  ),
              },
            ]}
          />
        </Card>
      ),
    });
  return tabs;
}
