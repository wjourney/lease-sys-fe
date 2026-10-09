import {
  DeleteOutlined,
  UploadOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  FileOutlined,
} from "@ant-design/icons";
import { App, Button, Form, Upload } from "antd";
import type { UploadFile } from "antd";
import { useEffect, useState } from "react";
import { t } from "../../../shared/i18n";

export type UnitMediaCategory = "PHOTO" | "VIDEO" | "PROJECT_FILE";
export type UnitMedia = Record<UnitMediaCategory, UploadFile[]>;

export function UnitMediaField({
  label,
  prompt,
  category,
  files,
  onChange,
  compact = false,
}: {
  compact?: boolean;
  label: string;
  prompt: string;
  category: UnitMediaCategory;
  files: UploadFile[];
  onChange: (category: UnitMediaCategory, files: UploadFile[]) => void;
}) {
  const { message } = App.useApp();
  const accept =
    category === "VIDEO"
      ? ".mp4"
      : category === "PHOTO"
        ? ".jpg,.jpeg,.png,.webp"
        : ".pdf,.jpg,.jpeg,.png,.webp";
  const upload = (
    <Upload
      accept={accept}
      multiple
      showUploadList={false}
      fileList={files}
      beforeUpload={(file) => {
        if (file.size > 30 * 1024 * 1024) {
          message.error(t("单个文件不能超过 30 MB"));
          return Upload.LIST_IGNORE;
        }
        if (
          category === "VIDEO"
            ? file.type !== "video/mp4"
            : category === "PHOTO"
              ? !["image/jpeg", "image/png", "image/webp"].includes(file.type)
              : ![
                  "application/pdf",
                  "image/jpeg",
                  "image/png",
                  "image/webp",
                ].includes(file.type)
        ) {
          message.error(t("文件格式不支持"));
          return Upload.LIST_IGNORE;
        }
        return false;
      }}
      onChange={({ fileList }) => onChange(category, fileList)}
      className={compact ? "" : "[&_.ant-upload]:!block"}
    >
      <Button
        icon={<UploadOutlined aria-hidden />}
        block={!compact}
        size={compact ? "small" : "middle"}
        className={compact ? "" : "!h-10 !border-dashed !text-left"}
      >
        {t(prompt)}
      </Button>
    </Upload>
  );
  if (compact)
    return (
      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span>
            {t(label)}（{files.length}）
          </span>
          {upload}
        </div>
        {files.length ? (
          <div
            className={
              category === "PROJECT_FILE"
                ? "max-h-20 space-y-1 overflow-y-auto"
                : "flex gap-2 overflow-x-auto pb-1"
            }
          >
            {files.map((file) => (
              <CompactMediaFile
                key={file.uid}
                file={file}
                category={category}
                onRemove={() =>
                  onChange(
                    category,
                    files.filter((item) => item.uid !== file.uid),
                  )
                }
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  return (
    <Form.Item label={t(label)} className="min-w-0">
      <div className="rounded-md border border-[#dce2ea] bg-white p-2">
        {upload}
        {files.length > 0 && (
          <div className="mt-2 max-h-28 space-y-1 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.uid}
                className="flex min-w-0 items-center gap-2 rounded bg-[#f5f7fa] px-2 py-1 text-xs"
              >
                <span className="min-w-0 flex-1 truncate" title={file.name}>
                  {file.name}
                </span>
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined aria-hidden />}
                  aria-label={t(`删除 ${file.name}`)}
                  onClick={() =>
                    onChange(
                      category,
                      files.filter((item) => item.uid !== file.uid),
                    )
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Form.Item>
  );
}

function CompactMediaFile({
  file,
  category,
  onRemove,
}: {
  file: UploadFile;
  category: UnitMediaCategory;
  onRemove: () => void;
}) {
  const [localUrl, setLocalUrl] = useState<string>();
  useEffect(() => {
    if (!file.originFileObj) return;
    const url = URL.createObjectURL(file.originFileObj);
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file.originFileObj]);
  const src = localUrl ?? file.url ?? file.thumbUrl;
  const remove = (
    <Button
      type="text"
      size="small"
      icon={<DeleteOutlined />}
      aria-label={t(`删除 ${file.name}`)}
      onClick={onRemove}
    />
  );
  if (category === "PROJECT_FILE")
    return (
      <div className="flex min-w-0 items-center gap-2 rounded bg-[#f5f7fa] px-2 text-xs">
        <FileOutlined />
        <span className="min-w-0 flex-1 truncate" title={file.name}>
          {file.name}
        </span>
        {file.size != null && (
          <span className="shrink-0 text-[#73819a]">
            {file.size >= 1024 * 1024
              ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
              : `${Math.ceil(file.size / 1024)} KB`}
          </span>
        )}
        {remove}
      </div>
    );
  return (
    <div
      className="group relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-[#e0e6ed] bg-[#f5f7fa]"
      title={file.name}
    >
      {src ? (
        category === "PHOTO" ? (
          <img
            src={src}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            src={src}
            preload="metadata"
            muted
            className="h-full w-full object-cover"
          />
        )
      ) : (
        <div className="flex h-full items-center justify-center text-xl text-[#73819a]">
          <PictureOutlined />
        </div>
      )}
      {category === "VIDEO" && (
        <PlayCircleOutlined className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white text-xl text-[#16263f]" />
      )}
      <div className="absolute right-0 top-0 rounded-bl bg-white/90">
        {remove}
      </div>
    </div>
  );
}
