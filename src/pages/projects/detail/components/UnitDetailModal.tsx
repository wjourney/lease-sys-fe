import { RequestError } from "../../../../components/feedback/RequestError";
import { EditOutlined } from "@ant-design/icons";
import { Button, Modal, Spin } from "antd";
import { useEffect, useState, type ReactNode } from "react";
import { amount, api, errorMessage, Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { Status } from "../../../../shared/ui";
import { useRoot } from "../../../../stores/root";
import { UnitDetailMedia } from "./UnitDetailMedia";

function display(value: unknown) {
  return value === null || value === undefined || value === ""
    ? "—"
    : t(String(value));
}

function DetailField({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex min-w-0 gap-3 text-[14px] leading-6">
      <dt className="w-[96px] shrink-0 text-[#7d8a9d]">{t(label)}</dt>
      <dd className="m-0 min-w-0 break-words text-[#26334a]">
        {display(value)}
      </dd>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#e0e6ed] bg-white p-4">
      <h3 className="mb-4 mt-0 text-[14px] font-semibold text-[#26334a]">
        {t(title)}
      </h3>
      <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-3 max-[680px]:grid-cols-1">
        {children}
      </dl>
    </section>
  );
}

export function UnitDetailModal({
  unit,
  projectName,
  allowExactRent,
  canEdit,
  onClose,
  onEdit,
}: {
  unit: Row;
  projectName: string;
  allowExactRent: boolean;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (unit: Row) => void;
}) {
  const root = useRoot();
  const [detail, setDetail] = useState<Row>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setDetail(undefined);
    setError("");
    setLoading(true);
    void api
      .get<Row>(`/units/${unit.id}`)
      .then(({ data }) => {
        if (active) setDetail(data);
      })
      .catch((cause) => {
        if (active) setError(errorMessage(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [unit.id, root.epoch]);

  const extra = detail?.extra || {};
  const money = (value: unknown) =>
    value === null || value === undefined || value === ""
      ? undefined
      : amount(value);
  const notes = [
    ["装修情况", detail?.decoration],
    ["现况", extra.currentState],
    ["用途", extra.usage],
    [
      "最短租期",
      detail?.minLeaseMonths != null
        ? `${detail.minLeaseMonths} 个月`
        : undefined,
    ],
    ["租金周期", extra.rentCycle],
    ["佣金说明", detail?.commissionNote],
    ["售楼处 / 物业资料", extra.salesOfficeNote],
    ["开单 / 入票退票方法", extra.signingGuideNote],
  ].filter(
    ([, value]) => value !== null && value !== undefined && value !== "",
  );
  return (
    <Modal
      open
      centered
      width={980}
      title={
        <div className="flex flex-wrap items-center gap-3 pr-8">
          <span>
            {t("单位详情")} · {t(unit.unitNo)}
          </span>
          {detail && <Status value={detail.occupancyStatus || "AVAILABLE"} />}
        </div>
      }
      onCancel={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t("关闭")}</Button>
          {canEdit && detail && (
            <Button
              type="primary"
              icon={<EditOutlined aria-hidden />}
              onClick={() => onEdit(detail)}
            >
              {t("编辑单位")}
            </Button>
          )}
        </div>
      }
    >
      <div className="max-h-[72vh] min-h-40 space-y-4 overflow-y-auto pr-1">
        {error && <RequestError type="error" showIcon message={t(error)} />}
        <Spin spinning={loading}>
          {detail && (
            <div className="space-y-4">
              <DetailSection title="单位资料">
                <DetailField
                  label="所属项目"
                  value={detail.projectName || projectName}
                />
                <DetailField label="单位编号" value={detail.unitNo} />
                <DetailField
                  label="单位类型"
                  value={detail.unitTypeName || detail.unitTypeCode}
                />
                <DetailField
                  label="期 / 座"
                  value={extra.phase || detail.building}
                />
                <DetailField label="楼层" value={detail.floor} />
                <DetailField label="房号" value={detail.roomNo} />
                <DetailField
                  label="实用面积"
                  value={detail.area != null ? `${detail.area} ㎡` : undefined}
                />
                <DetailField label="间隔" value={detail.layout} />
              </DetailSection>
              <DetailSection title="租金信息">
                {allowExactRent && (
                  <DetailField
                    label="月租价格"
                    value={money(detail.referenceRent)}
                  />
                )}
                <DetailField label="最低价" value={money(detail.minRent)} />
                <DetailField label="最高价" value={money(detail.maxRent)} />
              </DetailSection>
              {root.canRead("materials") && (
                <UnitDetailMedia
                  materials={(detail.materials || []).filter(
                    (item: Row) =>
                      item.storageKey &&
                      ["PHOTO", "VIDEO", "PROJECT_FILE"].includes(
                        item.category,
                      ),
                  )}
                />
              )}
              {notes.length > 0 && (
                <DetailSection title="补充说明">
                  {notes.map(([label, value]) => (
                    <DetailField
                      key={label}
                      label={String(label)}
                      value={value}
                    />
                  ))}
                </DetailSection>
              )}
            </div>
          )}
        </Spin>
      </div>
    </Modal>
  );
}
