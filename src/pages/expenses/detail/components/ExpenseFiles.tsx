import { UploadOutlined } from "@ant-design/icons";
import { Button, Card, Modal, Space, Table } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { RequestError } from "../../../../components/feedback/RequestError";
import { MaterialEditor } from "../../../../components/forms/MaterialEditor";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { api, dateText, errorMessage, Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { MediaGalleryModal } from "../../../projects/detail/components/MediaGalleryModal";

export const ExpenseFiles = observer(function ExpenseFiles() {
  const { id, root } = useRecordDetail();
  const [page, changePage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [store, setStore] = useState({
    items: [] as Row[],
    total: 0,
    loading: true,
    error: "",
  });
  const refresh = () => setRetry((v) => v + 1);
  const allowed = root.canRead("materials");
  const epoch = root.epoch;
  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    setStore((v) => ({ ...v, loading: true, error: "" }));
    api
      .get("/materials", {
        params: { expenseId: id, page, pageSize: 8 },
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (!controller.signal.aborted)
          setStore({
            items: data.items,
            total: data.total,
            loading: false,
            error: "",
          });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setStore({
            items: [],
            total: 0,
            loading: false,
            error: errorMessage(error),
          });
      });
    return () => controller.abort();
  }, [id, page, retry, allowed, epoch]);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<Row>();
  if (!allowed) return null;
  return (
    <>
      <Card
        title={t("付款凭证与附件")}
        extra={
          root.canWrite("materials") && !root.salesRole ? (
            <Button
              icon={<UploadOutlined aria-hidden />}
              onClick={() => setUploading(true)}
            >
              {t("上传资料")}
            </Button>
          ) : undefined
        }
      >
        {store.error && (
          <RequestError
            message={store.error}
            action={<Button onClick={refresh}>{t("重试")}</Button>}
          />
        )}
        <Table<Row>
          rowKey="id"
          loading={store.loading}
          dataSource={store.items}
          locale={{ emptyText: t("暂无付款凭证或附件") }}
          pagination={
            store.total > 8
              ? {
                  current: page,
                  pageSize: 8,
                  total: store.total,
                  onChange: changePage,
                  showSizeChanger: false,
                }
              : false
          }
          columns={[
            {
              title: t("文件名称"),
              dataIndex: "title",
              render: (v, row) => (
                <span className="break-all">
                  {v || row.originalName || "—"}
                </span>
              ),
            },
            {
              title: t("上传日期"),
              dataIndex: "createdAt",
              width: 130,
              render: dateText,
            },
            {
              title: t("操作"),
              width: 130,
              render: (_, file) => (
                <Space size={4}>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => setPreview(file)}
                  >
                    {t("预览")}
                  </Button>
                  {file.storageKey && (
                    <Button
                      size="small"
                      type="link"
                      href={`/api/v1/materials/${file.id}/download?download=1`}
                    >
                      {t("下载")}
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>
      {uploading && (
        <MaterialEditor
          owner={{ expenseId: id }}
          onClose={() => setUploading(false)}
          onSaved={() => {
            setUploading(false);
            refresh();
          }}
        />
      )}
      <MediaGalleryModal
        category={
          preview?.storageKey
            ? preview.mimeType?.startsWith("video/")
              ? "VIDEO"
              : "PROJECT_FILE"
            : undefined
        }
        title="付款凭证与附件"
        items={preview ? [preview] : []}
        onClose={() => setPreview(undefined)}
      />
      <Modal
        open={!!preview && !preview.storageKey}
        title={preview?.title || t("资料内容")}
        onCancel={() => setPreview(undefined)}
        footer={
          <Button onClick={() => setPreview(undefined)}>{t("关闭")}</Button>
        }
      >
        <p className="whitespace-pre-wrap break-words">
          {preview?.body || preview?.description || "—"}
        </p>
      </Modal>
    </>
  );
});
