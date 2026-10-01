import { EditOutlined } from "@ant-design/icons";
import { Alert, Button, Modal, Spin } from "antd";
import { useEffect, useState, type ReactNode } from "react";
import {
  amount,
  api,
  errorMessage,
  options,
  Row,
} from "../../../../shared/api";
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
    <div className="flex min-w-0 gap-3 text-[13px] leading-6">
      <dt className="w-[104px] shrink-0 text-[#7d8a9d]">{t(label)}</dt>
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
    <section className="rounded-lg bg-[#f5f6f8] p-5 max-[600px]:p-4">
      <h3 className="mb-4 mt-0 text-sm font-semibold text-[#26334a]">
        {t(title)}
      </h3>
      <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-3 max-[600px]:grid-cols-1">
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
  const [materials, setMaterials] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [error, setError] = useState("");
  const [mediaError, setMediaError] = useState("");

  useEffect(() => {
    let active = true;
    setDetail(undefined);
    setMaterials([]);
    setError("");
    setMediaError("");
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
    if (root.canRead("materials")) {
      setMediaLoading(true);
      void options("materials", { unitId: unit.id })
        .then((rows) => {
          if (active)
            setMaterials(
              rows.filter(
                (item) =>
                  item.storageKey &&
                  ["PHOTO", "VIDEO", "PROJECT_FILE"].includes(item.category),
              ),
            );
        })
        .catch((cause) => {
          if (active) setMediaError(errorMessage(cause));
        })
        .finally(() => {
          if (active) setMediaLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [unit.id, root.epoch]);

  const extra = detail?.extra || {};
  return (
    <Modal
      open
      centered
      width={900}
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
        {error && <Alert type="error" showIcon message={t(error)} />}
        <Spin spinning={loading}>
          {detail && (
            <div className="space-y-4">
              <p className="m-0 text-[13px] text-[#7d8a9d]">
                {t("所属项目")}：{t(detail.projectName || projectName)}
              </p>
              {root.canRead("materials") && (
                <UnitDetailMedia
                  materials={materials}
                  loading={mediaLoading}
                  error={mediaError}
                />
              )}
              <DetailSection title="单位定位">
                <DetailField label="单位名称 / 编号" value={detail.unitNo} />
                <DetailField
                  label="单位类型"
                  value={detail.unitTypeName || detail.unitTypeCode}
                />
                <DetailField
                  label="期 / 座"
                  value={extra.phase || detail.building}
                />
                <DetailField label="楼层" value={detail.floor} />
                <DetailField label="室号" value={detail.roomNo} />
                <DetailField
                  label="启用状态"
                  value={detail.enabled ? "启用" : "停用"}
                />
              </DetailSection>
              <DetailSection title="物业属性">
                <DetailField
                  label="实用面积"
                  value={detail.area != null ? `${detail.area} ㎡` : undefined}
                />
                <DetailField label="间隔" value={detail.layout} />
                <DetailField label="装修情况" value={detail.decoration} />
                <DetailField label="楼龄" value={extra.age} />
                <DetailField label="现况" value={extra.currentState} />
                <DetailField label="用途" value={extra.usage} />
              </DetailSection>
              <DetailSection title="价格与租赁条件">
                {allowExactRent && detail.referenceRent != null && (
                  <DetailField
                    label="具体参考月租"
                    value={amount(detail.referenceRent)}
                  />
                )}
                <DetailField label="最低价" value={amount(detail.minRent)} />
                <DetailField label="最高价" value={amount(detail.maxRent)} />
                {allowExactRent && (
                  <>
                    <DetailField
                      label="定价"
                      value={
                        extra.askingRent != null
                          ? amount(extra.askingRent)
                          : undefined
                      }
                    />
                    <DetailField label="折扣方案一" value={extra.discountOne} />
                    <DetailField label="折扣方案二" value={extra.discountTwo} />
                  </>
                )}
                <DetailField
                  label="最短租期"
                  value={
                    detail.minLeaseMonths != null
                      ? `${detail.minLeaseMonths} 个月`
                      : undefined
                  }
                />
                <DetailField label="租金周期" value={extra.rentCycle} />
                <DetailField label="佣金说明" value={detail.commissionNote} />
              </DetailSection>
              <DetailSection title="媒体与开单资料">
                <DetailField
                  label="售楼处 / 物业资料"
                  value={extra.salesOfficeNote}
                />
                <DetailField
                  label="开单 / 入票退票方法"
                  value={extra.signingGuideNote}
                />
              </DetailSection>
            </div>
          )}
        </Spin>
      </div>
    </Modal>
  );
}
