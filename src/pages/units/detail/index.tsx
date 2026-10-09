import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Result, Spin, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { RecordFormPage } from "../../../components/record-editor/RecordFormPage";
import { RequestError } from "../../../components/feedback/RequestError";
import { UnitDetailMedia } from "../../projects/detail/components/UnitDetailMedia";
import { UnitDeleteModal } from "../../projects/detail/components/UnitDeleteModal";
import { amount, api, errorMessage, type Row } from "../../../shared/api";
import { t } from "../../../shared/i18n";
import { Status } from "../../../shared/ui";
import { useRoot } from "../../../stores/root";
import { unitDetailPath, unitListReturnTo } from "../unit-navigation";

const display = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? "—"
    : t(String(value));
const money = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? undefined
    : amount(value);

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
      <h2 className="mb-4 mt-0 text-[14px] font-semibold text-[#26334a]">
        {t(title)}
      </h2>
      <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-3 max-[680px]:grid-cols-1">
        {children}
      </dl>
    </section>
  );
}

export default observer(function UnitDetailPage() {
  const { projectId = "", id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const root = useRoot();
  const allowed = root.canRead("units");
  const [detail, setDetail] = useState<Row>();
  const [project, setProject] = useState<Row>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const backTo = unitListReturnTo(projectId, location.state?.returnTo);
  const detailPath = unitDetailPath(projectId, id);
  const back = () => navigate(backTo, { replace: true });

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    setDetail(undefined);
    setProject(undefined);
    setLoading(true);
    setError("");
    Promise.all([
      api.get<Row>(`/units/${id}`),
      api.get<Row>(`/projects/${projectId}`),
    ])
      .then(([unitResult, projectResult]) => {
        if (!active) return;
        if (unitResult.data.projectId !== projectId) {
          setError(t("当前单位不属于此项目"));
          return;
        }
        setDetail(unitResult.data);
        setProject(projectResult.data);
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
  }, [allowed, id, projectId, retry, root.epoch]);

  const allowExactRent =
    ["SUPER_ADMIN", "OPERATIONS", "FINANCE"].includes(root.user?.role) ||
    !!project?.salesCanViewExactRent;
  const extra: Row = detail?.extra || {};
  const notes = (
    [
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
    ] as [string, unknown][]
  ).filter(
    ([, value]) => value !== null && value !== undefined && value !== "",
  );
  const materials: Row[] = (detail?.materials || []).filter(
    (item: Row) =>
      item.storageKey &&
      ["PHOTO", "VIDEO", "PROJECT_FILE"].includes(item.category),
  );

  return (
    <RecordFormPage
      title={detail ? `单位详情 · ${detail.unitNo}` : "单位详情"}
      titleExtra={
        detail ? (
          <span className="unit-header-status">
            <Status value={detail.occupancyStatus || "AVAILABLE"} />
          </span>
        ) : undefined
      }
      contentLabel="单位详情"
      onBack={back}
    >
      {!allowed ? (
        <Result
          status="403"
          title={t("当前账号没有查看权限")}
          extra={<Button onClick={back}>{t("返回单位列表")}</Button>}
        />
      ) : loading ? (
        <div className="flex justify-center p-16">
          <Spin />
        </div>
      ) : error || !detail ? (
        <div className="space-y-4">
          <RequestError
            type="error"
            showIcon
            message={t(error || "单位资料暂不可用")}
          />
          <Button onClick={() => setRetry((value) => value + 1)}>
            {t("重新加载")}
          </Button>
        </div>
      ) : (
        <div className="space-y-4 pb-6">
          <div className="flex flex-wrap items-center gap-3">
            {root.canWrite("units") && (
              <>
                <Button
                  icon={<EditOutlined aria-hidden />}
                  onClick={() =>
                    navigate(`${detailPath}/edit`, {
                      state: { returnTo: detailPath, listReturnTo: backTo },
                    })
                  }
                >
                  {t("编辑单位")}
                </Button>
                <Tooltip
                  title={
                    detail.canDelete === false ||
                    (detail.canDelete === undefined &&
                      detail.occupancyStatus === "OCCUPIED")
                      ? t(detail.deleteReason || "已租单位不能删除")
                      : undefined
                  }
                >
                  <span>
                    <Button
                      danger
                      icon={<DeleteOutlined aria-hidden />}
                      disabled={
                        detail.canDelete === false ||
                        (detail.canDelete === undefined &&
                          detail.occupancyStatus === "OCCUPIED")
                      }
                      onClick={() => setShowDelete(true)}
                    >
                      {t("删除单位")}
                    </Button>
                  </span>
                </Tooltip>
              </>
            )}
          </div>
          <div className="grid grid-cols-[minmax(0,0.46fr)_minmax(0,0.54fr)] items-start gap-4 max-[960px]:grid-cols-1">
            <div className="min-w-0">
              {root.canRead("materials") && (
                <UnitDetailMedia materials={materials} />
              )}
            </div>
            <div className="min-w-0 space-y-4">
              <DetailSection title="单位资料">
                <DetailField
                  label="所属项目"
                  value={detail.projectName || project?.name}
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
              {notes.length > 0 && (
                <DetailSection title="补充说明">
                  {notes.map(([label, value]) => (
                    <DetailField key={label} label={label} value={value} />
                  ))}
                </DetailSection>
              )}
            </div>
          </div>
          {showDelete && (
            <UnitDeleteModal
              unit={detail}
              onClose={() => setShowDelete(false)}
              onDeleted={() => {
                setShowDelete(false);
                root.invalidate();
                back();
              }}
            />
          )}
        </div>
      )}
    </RecordFormPage>
  );
});
