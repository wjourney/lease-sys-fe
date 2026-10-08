import { CloseOutlined, FileOutlined, UploadOutlined } from "@ant-design/icons";
import { App, Button, Form, Modal, Upload } from "antd";
import type { UploadFile } from "antd";
import { useState } from "react";
import { t } from "../../../shared/i18n";

export type ProjectUploadCategory =
  | "PHOTO"
  | "VIDEO"
  | "PROJECT_FILE"
  | "OFFICIAL"
  | "MARKETING"
  | "GUIDE"
  | "TEMPLATE";

export type ProjectUploads = Record<ProjectUploadCategory, UploadFile[]>;

const MAX_FILE_SIZE = 30 * 1024 * 1024;

function FileRow({
  file,
  onRemove,
}: {
  file: UploadFile;
  onRemove: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md bg-[#f6f8fb] px-2.5 py-2 text-xs text-[#52617a]">
      <FileOutlined className="shrink-0 text-[#8190a6]" aria-hidden={true} />
      <span className="min-w-0 flex-1 truncate" title={file.name}>
        {file.name}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="flex size-5 shrink-0 items-center justify-center rounded text-[#8190a6] hover:bg-[#e9eef5] hover:text-[#192d4c]"
        aria-label={t(`删除 ${file.name}`)}
      >
        <CloseOutlined aria-hidden={true} />
      </button>
    </div>
  );
}

export function ProjectUploadField({
  category,
  label,
  prompt,
  files,
  onChange,
  accept = ".pdf,.png,.jpg,.jpeg,.webp,.mp4",
  allowedTypes,
}: {
  category: ProjectUploadCategory;
  label: string;
  prompt: string;
  files: ProjectUploads;
  onChange: (category: ProjectUploadCategory, files: UploadFile[]) => void;
  accept?: string;
  allowedTypes?: string[];
}) {
  const { message } = App.useApp();
  const [showAll, setShowAll] = useState(false);
  const selected = files[category];
  const remove = (uid: string) =>
    onChange(
      category,
      selected.filter((file) => file.uid !== uid),
    );

  return (
    <Form.Item label={t(label)} className="min-w-0">
      <div className="min-w-0 rounded-md border border-[#dce2ea] bg-white p-2">
        <Upload
          accept={accept}
          multiple
          showUploadList={false}
          beforeUpload={(file) => {
            if (allowedTypes && !allowedTypes.includes(file.type)) {
              message.error(t(`${label}的文件格式不支持`));
              return Upload.LIST_IGNORE;
            }
            if (file.size > MAX_FILE_SIZE) {
              message.error(t("单个文件不能超过 30 MB"));
              return Upload.LIST_IGNORE;
            }
            return false;
          }}
          fileList={selected}
          onChange={({ fileList }) => onChange(category, fileList)}
          className="[&_.ant-upload]:!block [&_.ant-upload]:!w-full"
        >
          <Button
            icon={<UploadOutlined aria-hidden={true} />}
            block
            className="!h-10 !border-dashed !text-left"
          >
            {t(prompt)}
          </Button>
        </Upload>
        {selected.length > 0 && (
          <div className="mt-2">
            <div className="mb-2 flex items-center justify-between text-xs text-[#74829a]">
              <span>{t(`已选择 ${selected.length} 个文件`)}</span>
              {selected.length > 2 && (
                <button
                  type="button"
                  className="text-[#345579] hover:text-[#192d4c]"
                  onClick={() => setShowAll(true)}
                >
                  {t("查看全部")}
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {selected.slice(0, 2).map((file) => (
                <FileRow
                  key={file.uid}
                  file={file}
                  onRemove={() => remove(file.uid)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <Modal
        title={t(`${label}（${selected.length} 个文件）`)}
        open={showAll}
        footer={null}
        onCancel={() => setShowAll(false)}
        width={620}
      >
        <div className="max-h-[55vh] space-y-2 overflow-y-auto py-2">
          {selected.map((file) => (
            <FileRow
              key={file.uid}
              file={file}
              onRemove={() => remove(file.uid)}
            />
          ))}
        </div>
      </Modal>
    </Form.Item>
  );
}
