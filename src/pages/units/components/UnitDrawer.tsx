import { RequestError as Alert } from "../../../components/feedback/RequestError";
import { App, Button, Drawer, Form, Spin } from "antd";
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

export function UnitDrawer({
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
  const [unitTypes, setUnitTypes] = useState<Option[]>([]);
  const [media, setMedia] = useState<UnitMedia>(emptyUnitMedia);
  const [loaded, setLoaded] = useState(!row);
  const [saving, setSaving] = useState(false);
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
    Promise.all([
      options("projects"),
      options("settings", { key: "unit_types" }),
      row
        ? row.materials
          ? Promise.resolve(row.materials as Row[])
          : options("materials", { unitId: row.id })
        : Promise.resolve([]),
    ])
      .then(([projectRows, settings, materials]) => {
        if (!active) return;
        setProjects(
          projectRows.map((item) => ({ value: item.id, label: t(item.name) })),
        );
        setUnitTypes(
          (settings[0]?.value ?? [])
            .filter(
              (item: Row) => item.enabled || row?.unitTypeCode === item.code,
            )
            .map((item: Row) => ({ value: item.code, label: t(item.name) })),
        );
        const existing = mediaFromMaterials(materials);
        setMedia(existing);
        for (const category of unitMediaCategories)
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

  const onMediaChange = (category: UnitMediaCategory, files: UploadFile[]) =>
    setMedia((value) => ({ ...value, [category]: files }));

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
      if (Number(values.minRent) > Number(values.maxRent))
        throw new Error("最低价不得高于最高价");
      if (
        Number(values.referenceRent) < Number(values.minRent) ||
        Number(values.referenceRent) > Number(values.maxRent)
      )
        throw new Error("参考月租须介于最低价和最高价之间");
      const payload = unitPayload(values, current.current?.extra);
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
    <Drawer
      open
      title={
        <span className="text-xl font-semibold text-[#243248]">
          {t(row ? "编辑单位" : "新建单位")}
        </span>
      }
      width="min(880px, 100vw)"
      onClose={close}
      closable={!saving}
      maskClosable={!saving}
      destroyOnClose
      classNames={{
        header: "!border-0 !px-6 !py-5 max-[640px]:!px-4",
        body: "!px-6 !pt-0 !pb-6 max-[640px]:!px-4",
        footer: "!border-0 !px-6 !py-3 max-[640px]:!px-4",
      }}
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
        <Alert type="error" showIcon message={t(error)} className="mb-4" />
      )}
      <Spin spinning={!loaded}>
        <Form form={form} layout="vertical" onFinish={save}>
          <UnitFormSections
            projects={projects}
            unitTypes={unitTypes}
            projectLocked={!!(initial.projectId || row)}
            media={media}
            onMediaChange={onMediaChange}
          />
        </Form>
      </Spin>
    </Drawer>
  );
}
