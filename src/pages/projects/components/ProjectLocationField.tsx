import { EnvironmentOutlined } from "@ant-design/icons";
import { Button, Form, Input } from "antd";
import { useState } from "react";
import { t } from "../../../shared/i18n";
import { projectLocation } from "../project-location";
import { ProjectLocationModal } from "./ProjectLocationModal";

export function ProjectLocationField({ onChange }: { onChange: () => void }) {
  const form = Form.useFormInstance();
  const latitude = Form.useWatch("latitude", form);
  const longitude = Form.useWatch("longitude", form);
  const [open, setOpen] = useState(false);
  const location = projectLocation(latitude, longitude);

  return (
    <div className="col-span-full">
      <Form.Item name="latitude" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="longitude" hidden>
        <Input />
      </Form.Item>
      <div className="mb-2 text-xs text-[#73819a]">{t("项目位置（可选）")}</div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          icon={<EnvironmentOutlined aria-hidden />}
          onClick={() => setOpen(true)}
        >
          {t(location ? "重新选点" : "地图选点")}
        </Button>
        <span className="text-xs text-[#73819a]">
          {location
            ? `${t("纬度")} ${location.latitude.toFixed(6)}，${t("经度")} ${location.longitude.toFixed(6)}`
            : t("选择后可在项目详情查看地图")}
        </span>
      </div>
      {open && (
        <ProjectLocationModal
          location={location}
          onClose={() => setOpen(false)}
          onSelect={(selected) => {
            form.setFieldsValue({
              latitude: selected?.latitude ?? null,
              longitude: selected?.longitude ?? null,
            });
            onChange();
          }}
        />
      )}
    </div>
  );
}
