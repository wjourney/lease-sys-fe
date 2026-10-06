import { RequestError as Alert } from "../../../components/feedback/RequestError";
import { App, Button, Drawer, Form, Spin } from "antd";
import type { UploadFile } from "antd";
import { useEffect, useRef, useState } from "react";
import { api, errorMessage, options, Row } from "../../../shared/api";
import { t } from "../../../shared/i18n";
import { useRoot } from "../../../stores/root";
import {
  emptyProjectUploads,
  projectFormValues,
  projectPayload,
  projectUploadCategories,
  projectUploadsFromMaterials,
  uploadProjectFiles,
} from "../project-data";
import { ProjectUnitTypesFields } from "./ProjectUnitTypesFields";
import { ProjectBasicFields } from "./ProjectBasicFields";
import { ProjectFilesFields } from "./ProjectFilesFields";
import { ProjectPropertyFields } from "./ProjectPropertyFields";
import type {
  ProjectUploadCategory,
  ProjectUploads,
} from "./ProjectUploadField";

export function ProjectDrawer({
  row,
  onClose,
  onSaved,
}: {
  row?: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form] = Form.useForm();
  const root = useRoot();
  const { message } = App.useApp();
  const [uploads, setUploads] = useState<ProjectUploads>(emptyProjectUploads);
  const [loaded, setLoaded] = useState(!row);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState("");
  const current = useRef<Row | null>(row ?? null);
  const saved = useRef(false);
  const uploaded = useRef(new Map<string, string>());
  const removed = useRef(new Set<string>());

  useEffect(() => {
    if (!row) return;
    let active = true;
    (row.materials
      ? Promise.resolve(row.materials as Row[])
      : options("materials", { projectId: row.id })
    )
      .then((materials) => {
        if (!active) return;
        const existing = projectUploadsFromMaterials(materials);
        setUploads(existing);
        for (const category of projectUploadCategories)
          for (const file of existing[category])
            uploaded.current.set(`${category}:${file.uid}`, file.uid);
        setLoaded(true);
      })
      .catch((cause) => {
        if (active) setError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, [row?.id]);

  const onUploadChange = (
    category: ProjectUploadCategory,
    files: UploadFile[],
  ) => setUploads((current) => ({ ...current, [category]: files }));

  function close() {
    if (saving) return;
    if (saved.current) {
      root.invalidate();
      onSaved();
    } else onClose();
  }

  async function save(values: Row) {
    if (!loaded) return;
    setSaving(true);
    setError("");
    let recordSaved = false;
    try {
      const payload = projectPayload(values, current.current?.extra);
      const { data } = current.current
        ? await api.patch<Row>(`/projects/${current.current.id}`, {
            ...payload,
            revision: current.current.revision,
          })
        : await api.post<Row>("/projects", payload);
      current.current = data;
      saved.current = true;
      recordSaved = true;
      const selectedKeys = new Set(
        projectUploadCategories.flatMap((category) =>
          uploads[category].map((file) => `${category}:${file.uid}`),
        ),
      );
      for (const [key, id] of uploaded.current) {
        if (selectedKeys.has(key) || removed.current.has(id)) continue;
        await api.delete(`/materials/${id}`, {
          data: { reason: "项目编辑时移除资料" },
        });
        removed.current.add(id);
      }
      await uploadProjectFiles(
        data.id,
        uploads,
        uploaded.current,
        (completed, total) => setUploadProgress({ completed, total }),
      );
      const logoIds = uploads.LOGO.map((file) =>
        uploaded.current.get(`LOGO:${file.uid}`),
      );
      if (logoIds.some((id) => !id)) throw new Error("Logo 上传未完成");
      await api.patch(`/projects/${data.id}/logos/order`, { ids: logoIds });
      message.success(row ? "项目修改已保存" : "项目创建成功");
      root.invalidate();
      onSaved();
    } catch (cause) {
      setError(
        recordSaved
          ? `项目资料已保存，但文件处理未完成：${errorMessage(cause)}。可再次提交重试。`
          : errorMessage(cause),
      );
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  }

  return (
    <Drawer
      open
      title={
        <span className="text-xl font-semibold text-[#243248]">
          {t(row ? "编辑项目" : "新建项目")}
        </span>
      }
      width="min(880px, 100vw)"
      closable={!saving}
      maskClosable={!saving}
      classNames={{
        header: "!border-0 !px-6 !py-5 max-[640px]:!px-4",
        body: "!px-6 !pt-0 !pb-6 max-[640px]:!px-4",
        footer: "!border-0 !px-6 !py-3 max-[640px]:!px-4",
      }}
      onClose={close}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2.5">
          <Button onClick={close} disabled={saving}>
            {t("取消")}
          </Button>
          <Button
            type="primary"
            loading={saving}
            disabled={!loaded}
            onClick={() => form.submit()}
          >
            {uploadProgress?.total
              ? t(`上传中 ${uploadProgress.completed}/${uploadProgress.total}`)
              : t(row ? "保存修改" : "创建项目")}
          </Button>
        </div>
      }
    >
      {error && (
        <Alert type="error" showIcon message={t(error)} className="mb-4" />
      )}
      <Spin spinning={!loaded}>
        <Form
          form={form}
          layout="vertical"
          className="space-y-4"
          initialValues={{
            typeConfigs: [
              { code: "LARGE", name: "大单位" },
              { code: "SMALL", name: "小单位" },
            ],
            salesStatus: "现售",
            buildingStatus: "现楼",
            usage: "住宅",
            salesCanViewExactRent: false,
            ...(row ? projectFormValues(row) : {}),
          }}
          onFinish={save}
        >
          <ProjectBasicFields
            uploads={uploads}
            onUploadChange={onUploadChange}
            isEdit={!!row}
          />
          <ProjectUnitTypesFields />
          <ProjectPropertyFields unitCount={row?.unitCount} />
          <ProjectFilesFields
            uploads={uploads}
            onUploadChange={onUploadChange}
          />
        </Form>
      </Spin>
    </Drawer>
  );
}
