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
  emptyUnitMedia,
  mediaFromMaterials,
  syncUnitMedia,
  unitMediaCategories,
  unitPayload,
} from "../unit-data";
import { UnitFormSections } from "./UnitFormSections";
import type { UnitMedia, UnitMediaCategory } from "./UnitMediaField";

type Option = { value: string; label: string };

export function UnitForm({
  row,
  initial = {},
  onClose,
  onSaved,
}: {
  row?: Row;
  initial?: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form] = Form.useForm();
  const root = useRoot();
  const { message } = App.useApp();
  const [projects, setProjects] = useState<Option[]>([]);
  const [projectRows, setProjectRows] = useState<Row[]>([]);
  const projectId = Form.useWatch("projectId", form);
  const selectedTypeCode = Form.useWatch("unitTypeCode", form);
  const typeConfigs: Row[] =
    projectRows.find((p) => p.id === projectId)?.typeConfigs ?? [];
  const selectedType = typeConfigs.find(
    (item) => item.code === selectedTypeCode,
  );
  const unitTypes = typeConfigs.map((item) => ({
    value: item.code,
    label: t(item.name || item.code),
  }));
  const [media, setMedia] = useState<UnitMedia>(emptyUnitMedia);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const { markDirty, allowLeave } = useUnsavedChanges(saving);
  const [error, setError] = useState("");
  const current = useRef<Row | null>(row ?? null);
  const uploaded = useRef(new Map<string, string>());
  const removed = useRef(new Set<string>());
  const recordSaved = useRef(false);

  useEffect(() => {
    form.setFieldsValue({
      minLeaseMonths: 12,
      enabled: true,
      ...initial,
      ...row,
      extra: {
        currentState: "可租",
        usage: "住宅",
        rentCycle: "月付",
        ...(row?.extra || {}),
        phase: row?.extra?.phase || row?.building || undefined,
      },
    });
    let active = true;
    setLoadFailed(false);
    setError("");
    Promise.all([
      options("projects"),
      row
        ? row.materials
          ? Promise.resolve(row.materials as Row[])
          : options("materials", { unitId: row.id })
        : Promise.resolve([]),
    ])
      .then(([projectRows, materials]) => {
        if (!active) return;
        setProjects(
          projectRows.map((item) => ({ value: item.id, label: t(item.name) })),
        );
        setProjectRows(projectRows);
        const existing = mediaFromMaterials(materials);
        setMedia(existing);
        for (const category of unitMediaCategories)
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

  const onMediaChange = (category: UnitMediaCategory, files: UploadFile[]) => {
    markDirty();
    setMedia((value) => ({ ...value, [category]: files }));
  };

  function close() {
    if (saving) return;
    if (recordSaved.current) {
      root.invalidate();
      onSaved();
    } else onClose();
  }

  async function save(values: Row) {
    if (!loaded) return;
    setSaving(true);
    setError("");
    try {
      const payload = unitPayload(values);
      const { data } = current.current
        ? await api.patch<Row>(`/units/${current.current.id}`, {
            ...payload,
            revision: current.current.revision,
          })
        : await api.post<Row>("/units", payload);
      current.current = data;
      recordSaved.current = true;
      await syncUnitMedia(data.id, media, uploaded.current, removed.current);
      message.success(t(row ? "单位修改已保存" : "单位创建成功"));
      root.invalidate();
      allowLeave();
      onSaved();
    } catch (cause) {
      setError(
        recordSaved.current
          ? `单位资料已保存，但文件处理未完成：${errorMessage(cause)}。可以再次提交重试。`
          : errorMessage(cause),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <RecordFormPage
      title={row ? "编辑单位" : "新建单位"}
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
            {t("保存单位")}
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
          onFinish={save}
          disabled={!loaded || saving}
          onValuesChange={(changed) => {
            markDirty();
          }}
        >
          {loaded && !typeConfigs.length && (
            <p className="mb-4 text-sm text-[#73819a]">
              {t("当前项目尚未配置单位类型，请先编辑项目添加类型。")}
            </p>
          )}
          <UnitFormSections
            selectedType={selectedType}
            projects={projects}
            unitTypes={unitTypes}
            projectLocked={!!(initial.projectId || row)}
            media={media}
            onMediaChange={onMediaChange}
          />
        </Form>
      </Spin>
    </RecordFormPage>
  );
}
