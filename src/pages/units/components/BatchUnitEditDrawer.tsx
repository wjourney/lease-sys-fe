import { App, Button, Drawer, Form } from "antd";
import { useState } from "react";
import type { UploadFile } from "antd";
import type { Row } from "../../../shared/api";
import { t } from "../../../shared/i18n";
import { validateBatchRows, type BatchUnitRow } from "../batch-unit-data";
import { collectBatchMedia } from "../batch-unit-media";
import { unitTypeLabel } from "../unit-type-display";
import { UnitFormSections } from "./UnitFormSections";
import type { UnitMedia, UnitMediaCategory } from "./UnitMediaField";

export function BatchUnitEditDrawer({
  row,
  rows,
  project,
  sharedMedia,
  onSave,
  onClose,
}: {
  row: BatchUnitRow;
  rows: BatchUnitRow[];
  project: Row;
  sharedMedia: UnitMedia;
  onSave: (row: BatchUnitRow) => void;
  onClose: () => void;
}) {
  const [form] = Form.useForm();
  const { modal, message } = App.useApp();
  const [dirty, setDirty] = useState(false);
  const [mediaChanged, setMediaChanged] = useState(false);
  const [media, setMedia] = useState(row.media ?? sharedMedia);
  const selectedCode = Form.useWatch("unitTypeCode", form) ?? row.unitTypeCode;
  const types: Row[] = project.typeConfigs ?? [];
  function close() {
    if (!dirty) return onClose();
    modal.confirm({
      title: t("放弃本单位的修改？"),
      content: t("修改尚未保存到待创建列表。"),
      okText: t("放弃修改"),
      cancelText: t("继续编辑"),
      onOk: onClose,
    });
  }
  function save(values: Row) {
    const next = {
      ...row,
      roomNo: values.roomNo.trim(),
      unitTypeCode: values.unitTypeCode,
      ...(mediaChanged ? { media } : {}),
    };
    const updated = rows.map((item) => (item.key === row.key ? next : item));
    // Validate the edited row last so collisions with any other row are shown here.
    const others = updated.filter((item) => item.key !== row.key);
    let error = validateBatchRows([...others, next], types)[row.key];
    const duplicate = error?.match(/^与第 (\d+) 行房号重复$/);
    if (duplicate) {
      const conflict = others[Number(duplicate[1]) - 1];
      error = `与第 ${rows.findIndex((item) => item.key === conflict.key) + 1} 行房号重复`;
    }
    if (error) {
      form.setFields([{ name: "roomNo", errors: [t(error)] }]);
      return;
    }
    if (collectBatchMedia(sharedMedia, updated).length > 30) {
      message.warning(t("每批最多上传 30 个不同文件"));
      return;
    }
    onSave(next);
  }
  function changeMedia(category: UnitMediaCategory, files: UploadFile[]) {
    setDirty(true);
    setMediaChanged(true);
    setMedia((value) => ({ ...value, [category]: files }));
  }
  return (
    <Drawer
      open
      placement="right"
      width="min(900px, 100vw)"
      title={t(`编辑待创建单位 · ${row.roomNo}`)}
      onClose={close}
      styles={{ body: { background: "#f5f7fa", padding: 16 } }}
      footer={
        <div className="flex justify-end gap-3">
          <Button onClick={close}>{t("取消")}</Button>
          <Button type="primary" onClick={() => form.submit()}>
            {t("保存到待创建列表")}
          </Button>
        </div>
      }
    >
      <p className="mb-3 text-sm text-[#73819a]">
        {t(
          "修改仅保存到这一行，最后点击页面底部的创建按钮统一提交。图片、视频和文件默认共用，可为本单位单独调整。",
        )}
      </p>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          projectId: project.id,
          roomNo: row.roomNo,
          unitTypeCode: row.unitTypeCode,
        }}
        onValuesChange={() => setDirty(true)}
        onFinish={save}
      >
        <UnitFormSections
          projects={[{ value: project.id, label: project.name }]}
          unitTypes={types.map((type) => ({
            value: type.code,
            label: unitTypeLabel(type),
          }))}
          projectLocked
          selectedType={types.find((type) => type.code === selectedCode)}
          media={media}
          onMediaChange={changeMedia}
        />
      </Form>
    </Drawer>
  );
}
