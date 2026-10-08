import { Button, Modal } from "antd";
import { Row, dateText } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";

function value(value: unknown) {
  return value === null || value === undefined || value === ""
    ? "未填写"
    : t(String(value));
}

function InfoGroup({
  title,
  items,
}: {
  title: string;
  items: [string, unknown][];
}) {
  return (
    <section className="rounded-md bg-[#f5f6f8] px-5 py-4 text-[13px] leading-7 text-[#26334a]">
      <h3 className="mb-2 text-[14px] font-semibold">{t(title)}</h3>
      <dl className="m-0 space-y-0.5">
        {items.map(([label, item]) => (
          <div key={label} className="flex gap-1">
            <dt className="shrink-0">{t(label)}：</dt>
            <dd className="m-0 min-w-0 break-words">{value(item)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ProjectBasicModal({
  row,
  open,
  onClose,
  onEdit,
  canEdit,
}: {
  row: Row;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  canEdit: boolean;
}) {
  const extra: Row = row.extra || {};
  return (
    <Modal
      open={open}
      title={`${t("基本资料")} · ${t(row.name)}`}
      width={760}
      onCancel={onClose}
      footer={
        <div className="flex justify-end gap-2">
          {canEdit && <Button onClick={onEdit}>{t("编辑项目")}</Button>}
          <Button onClick={onClose}>{t("关闭")}</Button>
        </div>
      }
    >
      <div className="max-h-[65vh] space-y-3 overflow-y-auto py-2">
        <InfoGroup
          title="基本资料"
          items={[
            ["项目编号", row.code],
            [
              "中文名称 / 英文名称",
              `${row.name || "—"} / ${row.nameEn || "—"}`,
            ],
            [
              "物业名称 / 区域",
              `${row.propertyName || "—"} / ${row.region || "—"}`,
            ],
            ["详细地址", row.address],
            [
              "地图经纬度",
              row.longitude == null || row.latitude == null
                ? "未填写"
                : `${row.longitude}, ${row.latitude}`,
            ],
            ["发展商", row.developer],
            ["楼层数目", extra.floorCount],
            [
              "落成年份",
              extra.completionYear ?? row.completionDate?.slice(0, 4),
            ],
            ["业权", extra.ownership],
            ["停车场", extra.parking],
            ["港铁站", extra.mtrStation],
            ["用途", extra.usage],
          ]}
        />
        <InfoGroup
          title="物业与配套"
          items={[
            [
              "单位总数 / 面积范围",
              `${row.unitCount ?? 0} 套 / ${extra.areaRange || "—"}`,
            ],
            ["单位间隔", extra.unitInterval],
            [
              "管理费 / 地契年期",
              `${extra.managementFee || "—"} / ${dateText(extra.landLeaseEndDate)}`,
            ],
            [
              "律师楼 / 周边学校",
              `${extra.lawyerFirm || "—"} / ${extra.nearbySchools || "—"}`,
            ],
            ["网址", extra.website],
            ["售楼处地址 / 联系电话", extra.salesOffice],
            ["详细资料介绍", row.description],
            ["允许销售查看具体租金", row.salesCanViewExactRent ? "是" : "否"],
          ]}
        />
      </div>
    </Modal>
  );
}
