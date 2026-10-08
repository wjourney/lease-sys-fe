import { Button, Modal } from "antd";
import { Row, amount } from "../../../../shared/api";
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
  const typeConfigs: Row[] = Array.isArray(row.typeConfigs)
    ? row.typeConfigs
    : [];
  const money = (value: unknown) =>
    value === null || value === undefined || value === ""
      ? undefined
      : amount(value);
  return (
    <Modal
      open={open}
      title={`${t("项目基本资料")} · ${t(row.name)}`}
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
          title="基本资料（必填）"
          items={[
            ["项目中文名称", row.name],
            ["区域", row.region],
            ["详细地址", row.address],
          ]}
        />
        <InfoGroup
          title="补充资料（选填）"
          items={[
            ["项目英文名称", row.nameEn],
            ["物业名称", row.propertyName],
            ["发展商", row.developer],
            ["楼层数目", extra.floorCount],
            [
              "落成年份",
              extra.completionYear ?? row.completionDate?.slice(0, 4),
            ],
            ["业权", extra.ownership],
            ["停车场", extra.parking],
            ["港铁站", extra.mtrStation],
            [
              "项目位置",
              row.longitude == null || row.latitude == null
                ? undefined
                : `${row.latitude}, ${row.longitude}`,
            ],
            ["用途", extra.usage],
            ["项目状态", row.status === "DISABLED" ? "停用" : "启用"],
          ]}
        />
        <section className="rounded-md bg-[#f5f6f8] px-5 py-4 text-[13px] text-[#26334a]">
          <h3 className="mb-2 text-[14px] font-semibold">
            {t("项目单位类型")}
          </h3>
          {typeConfigs.length ? (
            <div className="space-y-3">
              {typeConfigs.map((item, index) => (
                <div
                  key={item.code || index}
                  className="rounded border border-[#e0e6ed] bg-white p-3"
                >
                  <h4 className="mb-2 font-semibold">
                    {t(item.name || `单位类型 ${index + 1}`)}
                  </h4>
                  <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-1 max-[560px]:grid-cols-1">
                    {[
                      ["期 / 座", item.building],
                      ["楼层", item.floor],
                      ["间隔", item.layout],
                      ["实用面积（㎡）", item.area],
                      ["最低价（HKD）", money(item.minRent)],
                      ["最高价（HKD）", money(item.maxRent)],
                      ["月租价格（HKD）", money(item.referenceRent)],
                    ].map(([label, data]) => (
                      <div key={label} className="flex gap-1">
                        <dt className="shrink-0 text-[#73819a]">
                          {t(label)}：
                        </dt>
                        <dd className="m-0 min-w-0 break-words">
                          {value(data)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <p className="m-0 text-[#73819a]">{t("暂无单位类型")}</p>
          )}
        </section>
      </div>
    </Modal>
  );
}
