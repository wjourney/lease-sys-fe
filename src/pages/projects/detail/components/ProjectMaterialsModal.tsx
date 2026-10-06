import { RequestError } from "../../../../components/feedback/RequestError";
import { Button, Empty, Modal, Spin } from "antd";
import { useState } from "react";
import { MaterialEditor } from "../../../../components/forms/MaterialEditor";
import { Page, Row, api, dateText, errorMessage } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { shouldOpenRow } from "../../../../shared/row-navigation";
import { useRoot } from "../../../../stores/root";

export type MaterialSection = "OFFICIAL" | "MARKETING" | "GUIDE";

const sectionNames: Record<MaterialSection, string> = {
  OFFICIAL: "官方文件",
  MARKETING: "营销资料",
  GUIDE: "开单资料",
};

function previewUrl(item: Row) {
  return item.previewUrl || `/api/v1/materials/${item.id}/download`;
}

export function ProjectMaterialsModal({
  projectId,
  materials,
  section,
  onClose,
}: {
  projectId: string;
  materials: Row[];
  section?: MaterialSection;
  onClose: () => void;
}) {
  const root = useRoot();
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<Row>();
  const [versionOf, setVersionOf] = useState<string>();
  const [preview, setPreview] = useState<Row>();
  const [versions, setVersions] = useState<Row[]>();
  const [versionsLoading, setVersionsLoading] = useState(false);

  const shown = materials.filter((item) =>
    section === "GUIDE"
      ? ["GUIDE", "TEMPLATE"].includes(item.category)
      : item.category === section,
  );

  async function showVersions(item: Row) {
    setVersionsLoading(true);
    setError("");
    try {
      const { data } = await api.get<Page>(`/materials/${item.id}/versions`);
      setVersions(data.items);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setVersionsLoading(false);
    }
  }

  function openEditor(item?: Row) {
    setVersionOf(item?.id);
    setEditor(
      item || {
        projectId,
        category: section === "GUIDE" ? "GUIDE" : section,
      },
    );
  }

  return (
    <>
      <Modal
        open={!!section}
        title={section ? t(sectionNames[section]) : ""}
        width={760}
        onCancel={onClose}
        footer={<Button onClick={onClose}>{t("关闭")}</Button>}
      >
        <div className="mb-3 flex justify-end">
          {root.canWrite("materials") && (
            <Button onClick={() => openEditor()}>
              {t(section === "OFFICIAL" ? "上传文件" : "新增资料")}
            </Button>
          )}
        </div>
        {error && (
          <RequestError
            type="error"
            showIcon
            message={t(error)}
            className="mb-3"
          />
        )}
        <Spin spinning={false}>
          <div className="max-h-[60vh] min-h-36 overflow-y-auto rounded-md bg-[#f5f6f8] px-4 py-3">
            {shown.length === 0 ? (
              <Empty description={t("暂无资料")} className="py-6" />
            ) : (
              <div className="divide-y divide-[#e8ebf0]">
                {shown.map((item) => (
                  <div
                    key={item.id}
                    className="flex cursor-pointer flex-wrap items-center justify-between gap-3 py-3 text-[13px]"
                    onClick={(event) => {
                      if (!shouldOpenRow(event)) return;
                      if (item.storageKey)
                        window.open(
                          previewUrl(item),
                          "_blank",
                          "noopener,noreferrer",
                        );
                      else setPreview(item);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 break-words font-medium text-[#26334a]">
                        {t(item.originalName || item.title)}
                      </p>
                      <p className="m-0 text-[11px] text-[#7d889a]">
                        v{item.versionNo || 1} ·{" "}
                        {dateText(item.updatedAt || item.createdAt)} ·{" "}
                        {item.mimeType?.split("/").pop()?.toUpperCase() ||
                          t("文字资料")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2" data-row-action>
                      {item.storageKey ? (
                        <Button
                          size="small"
                          href={previewUrl(item)}
                          target="_blank"
                        >
                          {t(section === "OFFICIAL" ? "预览" : "查看")}
                        </Button>
                      ) : (
                        <Button size="small" onClick={() => setPreview(item)}>
                          {t(section === "OFFICIAL" ? "预览" : "查看")}
                        </Button>
                      )}
                      {section === "OFFICIAL" && (
                        <Button
                          size="small"
                          onClick={() => void showVersions(item)}
                        >
                          {t("版本记录")}
                        </Button>
                      )}
                      {root.canWrite("materials") && (
                        <Button size="small" onClick={() => openEditor(item)}>
                          {t(section === "OFFICIAL" ? "更新版本" : "编辑")}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Spin>
      </Modal>
      <Modal
        open={!!preview}
        title={t(preview?.title || "资料详情")}
        onCancel={() => setPreview(undefined)}
        footer={
          <Button onClick={() => setPreview(undefined)}>{t("关闭")}</Button>
        }
      >
        <p className="whitespace-pre-wrap text-[13px] leading-6">
          {t(preview?.body || preview?.description || "暂无文字内容")}
        </p>
      </Modal>
      <Modal
        open={versions !== undefined}
        title={t("版本记录")}
        onCancel={() => setVersions(undefined)}
        footer={
          <Button onClick={() => setVersions(undefined)}>{t("关闭")}</Button>
        }
      >
        <Spin spinning={versionsLoading}>
          {!versions?.length ? (
            <Empty description={t("暂无历史版本")} />
          ) : (
            <div className="space-y-2">
              {versions.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded border border-[#e4e9f0] px-3 py-2 text-[13px]"
                >
                  <span>
                    v{item.versionNo} · {t(item.originalName || item.title)} ·{" "}
                    {dateText(item.createdAt)}
                  </span>
                  {item.storageKey && (
                    <Button
                      size="small"
                      href={previewUrl(item)}
                      target="_blank"
                    >
                      {t("预览")}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Spin>
      </Modal>
      {editor && (
        <MaterialEditor
          owner={editor}
          versionOf={versionOf}
          onClose={() => {
            setEditor(undefined);
            setVersionOf(undefined);
          }}
          onSaved={() => {
            setEditor(undefined);
            setVersionOf(undefined);
            root.invalidate();
          }}
        />
      )}
    </>
  );
}
