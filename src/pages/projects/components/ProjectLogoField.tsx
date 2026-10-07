import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { App, Modal, Upload } from "antd";
import type { UploadFile } from "antd";
import { useEffect, useState } from "react";
import { t } from "../../../shared/i18n";

export const MAX_PROJECT_LOGOS = 4;

const imageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export function ProjectLogoField({
  files,
  onChange,
}: {
  files: UploadFile[];
  onChange: (files: UploadFile[]) => void;
}) {
  const { message } = App.useApp();
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    const urls: Record<string, string> = {};
    for (const file of files) {
      if (file.originFileObj) {
        urls[file.uid] = URL.createObjectURL(file.originFileObj);
      }
    }
    setPreviewUrls(urls);
    return () => Object.values(urls).forEach(URL.revokeObjectURL);
  }, [files]);

  const previewFile = files.find((file) => file.uid === previewId);

  return (
    <div className="col-span-full mb-4 min-w-0">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-xs text-[#73819a]">Logo</span>
        <span className="text-xs text-[#8995a6]">
          {t(`最多 ${MAX_PROJECT_LOGOS} 张，支持 PNG / JPG / WebP`)}
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {files.map((file, index) => (
          <div
            key={file.uid}
            className="relative w-28 shrink-0 overflow-hidden rounded-md border border-[#dce2ea] bg-white"
          >
            <button
              type="button"
              className="flex h-20 w-full items-center justify-center bg-[#f9fafc] p-2"
              onClick={() => setPreviewId(file.uid)}
              aria-label={t(`预览 ${file.name}`)}
            >
              {previewUrls[file.uid] || file.url ? (
                <img
                  src={previewUrls[file.uid] || file.url}
                  alt={file.name}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="truncate text-xs text-[#74829a]">
                  {file.name}
                </span>
              )}
            </button>
            <button
              type="button"
              className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-white/95 text-[#52617a] shadow-sm hover:text-[#192d4c]"
              onClick={() => {
                onChange(files.filter((item) => item.uid !== file.uid));
                if (previewId === file.uid) setPreviewId(null);
              }}
              aria-label={t(`删除 ${file.name}`)}
            >
              <CloseOutlined aria-hidden={true} />
            </button>
            {index === 0 ? (
              <div className="flex h-8 items-center px-2 text-xs font-medium text-[#192d4c]">
                {t("主 Logo")}
              </div>
            ) : (
              <button
                type="button"
                className="flex h-8 w-full items-center px-2 text-left text-xs text-[#667894] hover:text-[#192d4c]"
                onClick={() =>
                  onChange([
                    file,
                    ...files.filter((item) => item.uid !== file.uid),
                  ])
                }
              >
                {t("设为主 Logo")}
              </button>
            )}
          </div>
        ))}
        {files.length < MAX_PROJECT_LOGOS && (
          <Upload
            accept=".png,.jpg,.jpeg,.webp"
            multiple
            showUploadList={false}
            beforeUpload={(file) => {
              if (!imageTypes.has(file.type)) {
                message.error(t("Logo 仅支持 PNG、JPG、WebP 图片"));
                return Upload.LIST_IGNORE;
              }
              return false;
            }}
            fileList={files}
            onChange={({ fileList }) => {
              if (fileList.length > MAX_PROJECT_LOGOS)
                message.warning({
                  content: t(`最多上传 ${MAX_PROJECT_LOGOS} 张 Logo`),
                  key: "project-logo-limit",
                });
              onChange(fileList.slice(0, MAX_PROJECT_LOGOS));
            }}
            className="[&_.ant-upload]:!block [&_.ant-upload]:!size-28"
          >
            <div className="flex size-28 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[#bdc9d8] bg-white text-[#72839b] hover:border-[#192d4c] hover:text-[#192d4c]">
              <PlusOutlined className="text-base" aria-hidden={true} />
              <span className="text-xs">{t("添加图片")}</span>
            </div>
          </Upload>
        )}
      </div>
      <Modal
        open={!!previewFile}
        title={previewFile?.name}
        footer={null}
        onCancel={() => setPreviewId(null)}
      >
        {previewFile && (previewUrls[previewFile.uid] || previewFile.url) && (
          <img
            src={previewUrls[previewFile.uid] || previewFile.url}
            alt={previewFile.name}
            className="max-h-[70vh] w-full object-contain"
          />
        )}
      </Modal>
    </div>
  );
}
