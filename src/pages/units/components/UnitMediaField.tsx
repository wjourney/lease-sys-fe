import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { App, Button, Form, Upload } from "antd";
import type { UploadFile } from "antd";
import { t } from "../../../shared/i18n";

export type UnitMediaCategory = "PHOTO" | "VIDEO" | "PROJECT_FILE";
export type UnitMedia = Record<UnitMediaCategory, UploadFile[]>;

export function UnitMediaField({
  label,
  prompt,
  category,
  files,
  onChange,
}: {
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
  return (
    <Form.Item label={t(label)} className="min-w-0">
      <div className="rounded-md border border-[#dce2ea] bg-white p-2">
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
                  ? !file.type.startsWith("image/")
                  : file.type === "video/mp4"
            ) {
              message.error(t("文件格式不支持"));
              return Upload.LIST_IGNORE;
            }
            return false;
          }}
          onChange={({ fileList }) => onChange(category, fileList)}
          className="[&_.ant-upload]:!block"
        >
          <Button
            icon={<UploadOutlined aria-hidden />}
            block
            className="!h-10 !border-dashed !text-left"
          >
            {t(prompt)}
          </Button>
        </Upload>
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
