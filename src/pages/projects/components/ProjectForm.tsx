import { RecordFormPage } from "../../../components/record-editor/RecordFormPage";
import { useUnsavedChanges } from "../../../components/record-editor/useUnsavedChanges";
import { RequestError } from "../../../components/feedback/RequestError";
import { App, Button, Form, Spin } from "antd";
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
import {
  ProjectBasicFields,
  ProjectOptionalFields,
} from "./ProjectBasicFields";
import { ProjectMediaFields } from "./ProjectMediaFields";
import type {
  ProjectUploadCategory,
  ProjectUploads,
} from "./ProjectUploadField";

export function ProjectForm({
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
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const { markDirty, allowLeave } = useUnsavedChanges(saving);
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
    setLoadFailed(false);
    setError("");
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
        if (active) {
          setError(errorMessage(cause));
          setLoadFailed(true);
        }
      });
    return () => {
      active = false;
    };
  }, [row?.id, loadAttempt]);

  const onUploadChange = (
    category: ProjectUploadCategory,
    files: UploadFile[],
  ) => {
    markDirty();
    setUploads((current) => ({ ...current, [category]: files }));
  };

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
      const payload = projectPayload(
        {
          description: current.current?.description,
          salesCanViewExactRent: current.current?.salesCanViewExactRent,
          ...values,
        },
        current.current?.extra,
      );
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
      const imageIds = uploads.PHOTO.map((file) =>
        uploaded.current.get(`PHOTO:${file.uid}`),
      );
      if (imageIds.some((id) => !id)) throw new Error("项目图片上传未完成");
      await api.patch(`/projects/${data.id}/images/order`, { ids: imageIds });
      message.success(row ? "项目修改已保存" : "项目创建成功");
      root.invalidate();
      allowLeave();
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
    <RecordFormPage
      title={row ? "编辑项目" : "新建项目"}
      onBack={close}
      saving={saving}
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
        <RequestError
          type="error"
          showIcon
          message={t(error)}
          className="mb-4"
        />
      )}
      {loadFailed && (
        <Button
          className="mb-4"
          onClick={() => setLoadAttempt((value) => value + 1)}
        >
          {t("重新加载")}
        </Button>
      )}
      <Spin spinning={!loaded && !loadFailed}>
        <Form
          form={form}
          layout="vertical"
          scrollToFirstError={{ block: "center", focus: true }}
          className="space-y-4"
          initialValues={{
            typeConfigs: [
              { code: "LARGE", name: "大单位" },
              { code: "SMALL", name: "小单位" },
            ],
            usage: "住宅",
            salesCanViewExactRent: false,
            ...(row ? projectFormValues(row) : {}),
          }}
          disabled={!loaded || saving}
          onValuesChange={markDirty}
          onFinish={save}
        >
          <ProjectBasicFields />
          <ProjectUnitTypesFields
            usage={row?.unitTypeUsage as Record<string, number> | undefined}
          />
          <ProjectOptionalFields
            isEdit={!!row}
            onLocationChange={markDirty}
          />
          <ProjectMediaFields
            uploads={uploads}
            onUploadChange={onUploadChange}
          />
        </Form>
      </Spin>
    </RecordFormPage>
  );
}
