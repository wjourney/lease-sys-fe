import { Button, Modal, Spin } from "antd";
import { lazy, Suspense, useState } from "react";
import { t } from "../../../shared/i18n";
import type { ProjectLocation } from "../project-location";

const ProjectLocationMap = lazy(() => import("./ProjectLocationMap"));

export function ProjectLocationModal({
  location,
  onClose,
  onSelect,
}: {
  location: ProjectLocation | null;
  onClose: () => void;
  onSelect?: (location: ProjectLocation | null) => void;
}) {
  const [selected, setSelected] = useState<ProjectLocation | null>(location);
  const openStreetMapUrl = selected
    ? `https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=17/${selected.latitude}/${selected.longitude}`
    : undefined;

  return (
    <Modal
      open
      width={780}
      title={t(onSelect ? "地图选点" : "项目位置")}
      onCancel={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {onSelect ? (
            <>
              {selected && (
                <Button
                  onClick={() => {
                    onSelect(null);
                    onClose();
                  }}
                >
                  {t("清除位置")}
                </Button>
              )}
              <Button onClick={onClose}>{t("取消")}</Button>
              <Button
                type="primary"
                disabled={!selected}
                onClick={() => {
                  onSelect(selected);
                  onClose();
                }}
              >
                {t("确定位置")}
              </Button>
            </>
          ) : (
            <>
              {openStreetMapUrl && (
                <Button
                  href={openStreetMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("在 OpenStreetMap 打开")}
                </Button>
              )}
              <Button onClick={onClose}>{t("关闭")}</Button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-3 pt-2">
        <Suspense
          fallback={<Spin className="!flex h-72 items-center justify-center" />}
        >
          <ProjectLocationMap
            latitude={selected?.latitude}
            longitude={selected?.longitude}
            onPick={
              onSelect
                ? (latitude, longitude) => setSelected({ latitude, longitude })
                : undefined
            }
          />
        </Suspense>
        <div className="text-sm text-[#73819a]">
          {selected
            ? `${t("纬度")} ${selected.latitude.toFixed(6)}，${t("经度")} ${selected.longitude.toFixed(6)}`
            : t("点击地图选择项目位置")}
          {onSelect && selected && ` · ${t("点击地图可重新选择")}`}
        </div>
      </div>
    </Modal>
  );
}
