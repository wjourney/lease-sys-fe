import { DownloadOutlined } from "@ant-design/icons";
import { Button, Card, Descriptions, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { valueView } from "../../shared/ui";
const { Paragraph } = Typography;
export const RecordBasicInfo = observer(function RecordBasicInfo({
  fields,
  row,
  resource,
  id,
}: {
  fields: { key: string; label: string }[];
  row: Row;
  resource: string;
  id: string;
}) {
  return (
    <Card
      title={t("基本信息")}
      className="mb-5 [&_.ant-descriptions-item-label]:text-xs [&_.ant-descriptions-item-content]:break-words [&_.ant-descriptions-item-content]:text-xs"
    >
      <Descriptions
        column={{
          xs: 1,
          sm: 2,
          lg: 3,
        }}
        items={fields.map((f) => ({
          key: f.key,
          label: t(f.label),
          children: valueView(
            f.key,
            f.key === "unitTypeCode"
              ? row.unitTypeName || row[f.key]
              : row[f.key],
            resource,
          ),
        }))}
      />
      {resource === "materials" && (
        <>
          <Paragraph className="mt-6 whitespace-pre-wrap">
            {row.body || row.description}
          </Paragraph>
          {row.storageKey && (
            <Button
              href={`/api/v1/materials/${id}/download`}
              target="_blank"
              icon={<DownloadOutlined aria-hidden={true} />}
            >
              {t("预览 / 下载文件")}
            </Button>
          )}
        </>
      )}
    </Card>
  );
});
