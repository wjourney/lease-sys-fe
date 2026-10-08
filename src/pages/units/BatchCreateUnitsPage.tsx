import {
  typeValue,
  typeFloor,
  typePriceRange,
  unitTypeDetails,
  unitTypeLabel,
  unitTypeProblems,
} from "./unit-type-display";
import {
  App,
  Button,
  Descriptions,
  Empty,
  Input,
  InputNumber,
  Result,
  Select,
  Spin,
  Table,
  Tag,
} from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RecordFormPage } from "../../components/record-editor/RecordFormPage";
import { useUnsavedChanges } from "../../components/record-editor/useUnsavedChanges";
import { amount, api, errorMessage, type Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";
import {
  BATCH_UNIT_LIMIT,
  generateRoomNumbers,
  parseRoomNumbers,
  validateBatchRows,
  type BatchUnitRow,
} from "./batch-unit-data";

type Attempt = {
  requestId: string;
  projectId: string;
  rows: Omit<BatchUnitRow, "key">[];
};
type BatchResult = {
  ok: boolean;
  count?: number;
  replayed?: boolean;
  issues?: { row: number; message: string }[];
};
export default function BatchCreateUnitsPage() {
  const { projectId } = useParams();
  return <BatchEditor key={projectId} projectId={projectId!} />;
}
const BatchEditor = observer(function BatchEditor({
  projectId,
}: {
  projectId: string;
}) {
  const root = useRoot();
  const allowed = root.canWrite("units");
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [project, setProject] = useState<Row>();
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [rows, setRows] = useState<BatchUnitRow[]>([]);
  const [typeCode, setTypeCode] = useState<string>();
  const [roomText, setRoomText] = useState("");
  const [prefix, setPrefix] = useState("");
  const [start, setStart] = useState<number | null>(1);
  const [count, setCount] = useState<number | null>(10);
  const [digits, setDigits] = useState<number | null>(2);
  const [busy, setBusy] = useState<"preview" | "create">();
  const busyRef = useRef(false);
  const [uncertain, setUncertain] = useState(false);
  const attempt = useRef<Attempt | null>(null);
  const storageKey = `unit-batch:${root.user?.id}:${projectId}`;
  const [checked, setChecked] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const { markDirty, allowLeave } = useUnsavedChanges(!!busy);
  const types: Row[] = project?.typeConfigs ?? [];
  const selectedType = types.find((type) => type.code === typeCode);
  const selectedTypeProblems = selectedType
    ? unitTypeProblems(selectedType)
    : [];
  const typeOptions = types.map((type) => ({
    value: type.code,
    label: unitTypeLabel(type),
  }));
  const errors = { ...serverErrors, ...validateBatchRows(rows, types) };
  const disabled = !!busy || uncertain;
  const close = () => navigate(`/projects/${projectId}`);

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    setLoading(true);
    api
      .get<Row>(`/projects/${projectId}`)
      .then(({ data }) => {
        if (active) setProject(data);
      })
      .catch((error) => {
        if (active) message.error(t(errorMessage(error)));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [allowed, projectId, reload, message]);
  useEffect(() => {
    if (!allowed) return;
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(storageKey) || "null",
      ) as Attempt | null;
      if (
        saved?.projectId === projectId &&
        saved.requestId &&
        Array.isArray(saved.rows) &&
        saved.rows.length > 0 &&
        saved.rows.length <= BATCH_UNIT_LIMIT
      ) {
        attempt.current = saved;
        setRows(
          saved.rows.map((row) => ({
            roomNo: row.roomNo,
            unitTypeCode: row.unitTypeCode,
            key: crypto.randomUUID(),
          })),
        );
        setUncertain(true);
        markDirty();
      }
    } catch {
      /* Storage is optional; the live attempt is still retained in memory. */
    }
  }, [storageKey, allowed]);

  function changeRows(next: BatchUnitRow[]) {
    markDirty();
    setRows(next);
    setChecked(false);
    setServerErrors({});
    attempt.current = null;
  }
  function addRooms(rooms: string[]) {
    if (!typeCode) {
      message.warning(t("请先选择单位类型"));
      return;
    }
    if (unitTypeProblems(selectedType).length) {
      message.warning(t("请先编辑项目，完善所选单位类型资料"));
      return;
    }
    if (!rooms.length) {
      message.warning(t("请填写房号或有效的连续生成规则"));
      return;
    }
    if (rows.length + rooms.length > BATCH_UNIT_LIMIT) {
      message.warning(t("每批最多创建 100 个单位"));
      return;
    }
    changeRows([
      ...rows,
      ...rooms.map((roomNo) => ({
        key: crypto.randomUUID(),
        roomNo,
        unitTypeCode: typeCode,
      })),
    ]);
    setRoomText("");
  }
  function patchRow(key: string, patch: Partial<BatchUnitRow>) {
    changeRows(
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }
  async function submit(preview: boolean) {
    if (
      busyRef.current ||
      !project ||
      !rows.length ||
      (!uncertain && Object.keys(errors).length)
    )
      return;
    busyRef.current = true;
    setBusy(preview ? "preview" : "create");
    const payload = attempt.current ?? {
      requestId: crypto.randomUUID(),
      projectId,
      rows: rows.map(({ roomNo, unitTypeCode }) => ({
        roomNo: roomNo.trim(),
        unitTypeCode,
      })),
    };
    attempt.current = payload;
    if (!preview) {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(payload));
      } catch {
        /* Retry works in memory. */
      }
    }
    try {
      const { data } = await api.post<BatchResult>(
        preview ? "/units/batch-preview" : "/units/batch",
        payload,
        { timeout: 90000 },
      );
      if (!data.ok) {
        setUncertain(false);
        try {
          sessionStorage.removeItem(storageKey);
        } catch {
          /* no-op */
        }
        setServerErrors(
          Object.fromEntries(
            (data.issues ?? [])
              .filter((issue) => rows[issue.row])
              .map((issue) => [rows[issue.row].key, issue.message]),
          ),
        );
        message.warning(t("请修改表格中标记的错误，本批次尚未创建任何单位"));
      } else if (preview && !data.replayed) {
        setServerErrors({});
        setChecked(true);
        message.success(t("校验通过，可以批量创建"));
      } else {
        try {
          sessionStorage.removeItem(storageKey);
        } catch {
          /* no-op */
        }
        message.success(t(`已成功创建 ${data.count} 个单位`));
        root.invalidate();
        allowLeave();
        close();
      }
    } catch (error) {
      // Keep the exact payload and request ID until a definitive response arrives.
      if (!preview) {
        const status = (error as { response?: { status?: number } }).response
          ?.status;
        if (status && status >= 400 && status < 500 && status !== 408) {
          setUncertain(false);
          attempt.current = null;
          try {
            sessionStorage.removeItem(storageKey);
          } catch {
            /* no-op */
          }
        } else setUncertain(true);
      }
      message.error(t(errorMessage(error)));
    } finally {
      busyRef.current = false;
      setBusy(undefined);
    }
  }
  return (
    <RecordFormPage
      title="批量创建单位"
      onBack={close}
      saving={!!busy}
      footer={
        allowed && project ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-[#73819a]">
              {t(`共 ${rows.length} 个单位`)}
              {Object.keys(errors).length
                ? t(` · ${Object.keys(errors).length} 行待修改`)
                : ""}
            </span>
            <div className="flex gap-3">
              <Button disabled={!!busy} onClick={close}>
                {t("取消")}
              </Button>
              <Button
                disabled={
                  disabled || !rows.length || !!Object.keys(errors).length
                }
                loading={busy === "preview"}
                onClick={() => submit(true)}
              >
                {t("检查房号")}
              </Button>
              <Button
                type="primary"
                loading={busy === "create"}
                disabled={
                  !!busy ||
                  !rows.length ||
                  (!uncertain && !!Object.keys(errors).length)
                }
                onClick={() => submit(false)}
              >
                {t(uncertain ? "重试并确认创建结果" : "确认批量创建")}
              </Button>
            </div>
          </div>
        ) : null
      }
    >
      {!allowed ? (
        <Result status="403" title={t("当前账号没有此操作权限")} />
      ) : loading ? (
        <div className="p-16 text-center">
          <Spin />
        </div>
      ) : !project ? (
        <Button onClick={() => setReload((n) => n + 1)}>{t("重新加载")}</Button>
      ) : (
        <div className="space-y-5">
          {uncertain && (
            <p role="status" className="rounded-lg bg-[#fffbe6] p-4">
              {t(
                "上次提交结果尚未确认，请点击“重试并确认创建结果”。系统会核对同一次提交，不会重复创建单位。",
              )}
            </p>
          )}
          <section className="rounded-lg border border-[#e0e6ed] bg-white p-6">
            <h2 className="mb-5 text-base font-semibold">
              {t(project.name)} · {t("批量规则")}
            </h2>
            {!types.length ? (
              <Empty
                description={t(
                  "当前项目尚未配置单位类型，请先编辑项目添加类型。",
                )}
              >
                <Button onClick={() => navigate(`/projects/${projectId}/edit`)}>
                  {t("编辑项目")}
                </Button>
              </Empty>
            ) : (
              <>
                <div className="mb-5 max-w-[480px]">
                  <label>
                    <span className="mb-2 block">{t("默认单位类型")}</span>
                    <Select
                      aria-label={t("默认单位类型")}
                      className="w-full"
                      disabled={disabled}
                      value={typeCode}
                      options={typeOptions}
                      onChange={(value) => {
                        markDirty();
                        setTypeCode(value);
                      }}
                    />
                  </label>
                </div>
                {selectedType && (
                  <Descriptions
                    size="small"
                    className="mb-4 rounded-md bg-[#f5f7fa] p-4"
                    column={{ xs: 1, sm: 2, md: 3 }}
                    items={unitTypeDetails(selectedType).map(
                      ([label, value]) => ({
                        key: label,
                        label: t(label),
                        children: value,
                      }),
                    )}
                  />
                )}
                {!!selectedTypeProblems.length && (
                  <div
                    className="mb-5 rounded-md bg-[#fffbe6] p-4"
                    role="status"
                  >
                    <p className="mb-2">
                      {t(
                        `所选类型资料未完善：${selectedTypeProblems.join("、")}。请先编辑项目补充后再创建单位。`,
                      )}
                    </p>
                    <Button
                      disabled={disabled}
                      onClick={() => navigate(`/projects/${projectId}/edit`)}
                    >
                      {t("编辑项目，完善类型")}
                    </Button>
                  </div>
                )}
                <label className="mb-2 block" htmlFor="batch-rooms">
                  {t("粘贴房号（换行或逗号分隔）")}
                </label>
                <Input.TextArea
                  id="batch-rooms"
                  disabled={disabled}
                  value={roomText}
                  rows={3}
                  placeholder={"01\n02\n03"}
                  onChange={(event) => {
                    markDirty();
                    setRoomText(event.target.value);
                  }}
                />
                <Button
                  className="mt-3"
                  disabled={disabled || !!selectedTypeProblems.length}
                  onClick={() => addRooms(parseRoomNumbers(roomText))}
                >
                  {t("添加到预览")}
                </Button>
                <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-[#e0e6ed] pt-5">
                  <label>
                    <span className="mb-2 block">{t("房号前缀（选填）")}</span>
                    <Input
                      aria-label={t("房号前缀")}
                      className="!w-36"
                      disabled={disabled}
                      value={prefix}
                      maxLength={80}
                      onChange={(e) => setPrefix(e.target.value)}
                    />
                  </label>
                  {(
                    [
                      ["起始编号", start, setStart, 0, 99999999],
                      ["数量", count, setCount, 1, 100],
                      ["编号位数", digits, setDigits, 1, 8],
                    ] as const
                  ).map(([label, value, setter, min, max]) => (
                    <label key={label}>
                      <span className="mb-2 block">{t(label)}</span>
                      <InputNumber
                        aria-label={t(label)}
                        disabled={disabled}
                        value={value}
                        min={min}
                        max={max}
                        precision={0}
                        onChange={setter}
                      />
                    </label>
                  ))}
                  <Button
                    disabled={disabled || !!selectedTypeProblems.length}
                    onClick={() =>
                      addRooms(
                        generateRoomNumbers(
                          prefix,
                          start ?? -1,
                          count ?? 0,
                          digits ?? 0,
                        ),
                      )
                    }
                  >
                    {t("连续生成并添加")}
                  </Button>
                </div>
              </>
            )}
          </section>
          <section className="rounded-lg border border-[#e0e6ed] bg-white p-6">
            <h2 className="mb-2 text-base font-semibold">{t("单位预览")}</h2>
            <p className="mb-5 text-sm text-[#73819a]">
              {t(
                "每批最多 100 个。类型资料自动带入，不可单独修改；房号与价格可以逐行调整，整批校验通过后统一创建。",
              )}
            </p>
            <Table<BatchUnitRow>
              rowKey="key"
              dataSource={rows}
              pagination={false}
              scroll={{ x: 950 }}
              columns={[
                {
                  title: t("房号"),
                  width: 125,
                  render: (_, row, i) => (
                    <Input
                      aria-label={t(`第 ${i + 1} 行房号`)}
                      disabled={disabled}
                      maxLength={100}
                      value={row.roomNo}
                      status={errors[row.key] ? "error" : undefined}
                      onChange={(e) =>
                        patchRow(row.key, { roomNo: e.target.value })
                      }
                    />
                  ),
                },
                {
                  title: t("单位类型"),
                  width: 210,
                  render: (_, row, i) => (
                    <Select
                      aria-label={t(`第 ${i + 1} 行类型`)}
                      className="w-full"
                      disabled={disabled}
                      value={row.unitTypeCode}
                      options={typeOptions}
                      onChange={(value) =>
                        patchRow(row.key, { unitTypeCode: value })
                      }
                    />
                  ),
                },
                {
                  title: t("类型资料（只读）"),
                  width: 210,
                  render: (_, row) => {
                    const type = types.find(
                      (item) => item.code === row.unitTypeCode,
                    );
                    return type ? (
                      <div className="text-sm">
                        <div>
                          {typeValue(type.building)} / {typeFloor(type.floor)}
                        </div>
                        <div className="text-[#73819a]">
                          {typeValue(type.area, " ㎡")} ·{" "}
                          {typeValue(type.layout)} ·{" "}
                          {typeValue(type.age, " 年")}
                        </div>
                        <div>{typePriceRange(type)}</div>
                      </div>
                    ) : (
                      "—"
                    );
                  },
                },
                {
                  title: t("月租（HKD）"),
                  width: 140,
                  render: (_, row) => {
                    const type = types.find(
                      (item) => item.code === row.unitTypeCode,
                    );
                    return type?.referenceRent == null
                      ? "—"
                      : amount(type.referenceRent);
                  },
                },
                {
                  title: t("校验"),
                  width: 170,
                  render: (_, row) =>
                    errors[row.key] ? (
                      <span className="text-red-600">{t(errors[row.key])}</span>
                    ) : (
                      <Tag color={checked ? "success" : undefined}>
                        {t(checked ? "校验通过" : "待提交校验")}
                      </Tag>
                    ),
                },
                {
                  title: t("操作"),
                  width: 70,
                  render: (_, row, i) => (
                    <Button
                      type="link"
                      danger
                      aria-label={t(`移除第 ${i + 1} 行`)}
                      disabled={disabled}
                      onClick={() =>
                        changeRows(rows.filter((item) => item.key !== row.key))
                      }
                    >
                      {t("移除")}
                    </Button>
                  ),
                },
              ]}
            />
          </section>
        </div>
      )}
    </RecordFormPage>
  );
});
