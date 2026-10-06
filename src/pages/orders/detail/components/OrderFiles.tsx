import { FileOutlined, FilePdfOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Space } from "antd";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { dateText, Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";

function FileRow({ file }: { file: Row }) {
  const { navigate } = useRecordDetail();
  const isPdf = /\.pdf$/i.test(file.originalName || file.title || "");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f4] px-6 py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded bg-[#f3f6fa] text-lg text-[#506480]">
          {isPdf ? (
            <FilePdfOutlined aria-hidden />
          ) : (
            <FileOutlined aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <div className="truncate font-medium text-[#263650]">
            {t(file.title || file.originalName || "未命名文件")}
          </div>
          <div className="mt-0.5 text-xs text-[#8793a4]">
            {file.category === "CONTRACT" ? t("系统生成") : t("上传于")} ·{" "}
            {dateText(file.createdAt)}
          </div>
        </div>
      </div>
      <Space size={4}>
        {file.previewUrl && (
          <Button
            type="link"
            size="small"
            href={file.previewUrl}
            target="_blank"
            rel="noreferrer"
          >
            {t("预览")}
          </Button>
        )}
        {file.downloadUrl && (
          <Button
            type="link"
            size="small"
            href={file.downloadUrl}
            target="_blank"
            rel="noreferrer"
          >
            {t("下载")}
          </Button>
        )}
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/materials/${file.id}`)}
        >
          {t("详情")}
        </Button>
      </Space>
    </div>
  );
}

export function OrderFiles() {
  const { row, id, root, setMaterial } = useRecordDetail();
  const files: Row[] = row.materials ?? [];
  const contracts = files.filter(
    (file) =>
      file.category === "CONTRACT" || file.id === row.currentContractMaterialId,
  );
  const others = files.filter((file) => !contracts.includes(file));
  return (
    <div className="flex flex-col gap-4">
      <Card
        title={t("合同与协议")}
        className="!border-[#e5eaf0] [&_.ant-card-head]:!min-h-14 [&_.ant-card-body]:!p-0"
      >
        {contracts.length ? (
          <div className="max-h-[55dvh] overflow-y-auto">
            {contracts.map((file) => (
              <FileRow key={file.id} file={file} />
            ))}
          </div>
        ) : (
          <p className="m-0 px-6 py-5 text-sm text-[#8793a4]">
            {t(
              root.salesRole
                ? "暂无合同文件，请联系平台管理员。"
                : "暂无合同文件，可通过页面上方的“下载合同”生成。",
            )}
          </p>
        )}
      </Card>
      <Card
        title={t("付款凭证与其他资料")}
        extra={
          root.canWrite("materials") && (
            <Button
              icon={<PlusOutlined aria-hidden />}
              onClick={() => setMaterial({ orderId: id })}
            >
              {t("上传资料")}
            </Button>
          )
        }
        className="!border-[#e5eaf0] [&_.ant-card-head]:!min-h-14 [&_.ant-card-body]:!p-0"
      >
        {others.length ? (
          <div className="max-h-[55dvh] overflow-y-auto">
            {others.map((file) => (
              <FileRow key={file.id} file={file} />
            ))}
          </div>
        ) : (
          <p className="m-0 px-6 py-5 text-sm text-[#8793a4]">
            {t("暂无相关资料")}
          </p>
        )}
      </Card>
    </div>
  );
}
