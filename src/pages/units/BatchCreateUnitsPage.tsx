import {
  typeValue,
  typeFloor,
  unitTypeDetails,
  unitTypeLabel,
  unitTypeProblems,
} from "./unit-type-display";
import {
  App,
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Result,
  Select,
  Spin,
  Table,
  Tabs,
  Tooltip,
} from "antd";
import type { UploadFile } from "antd";
import {
  UnitMediaField,
  type UnitMedia,
  type UnitMediaCategory,
} from "./components/UnitMediaField";
import { emptyUnitMedia } from "./unit-data";
import { BatchUnitEditDrawer } from "./components/BatchUnitEditDrawer";
import {
  batchMediaIndexes,
  collectBatchMedia,
  restoreBatchMedia,
} from "./batch-unit-media";
import { EditOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { RecordFormPage } from "../../components/record-editor/RecordFormPage";
import { useUnsavedChanges } from "../../components/record-editor/useUnsavedChanges";
import { amount, api, errorMessage, type Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";
import { unitListReturnTo } from "./unit-navigation";
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
  rows: { roomNo: string; unitTypeCode: string; mediaIndexes?: number[] }[];
  sharedMediaIndexes?: number[];
  mediaTokens?: string[];
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
  const location = useLocation();
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
  const [inputMode, setInputMode] = useState("generate");
  const [generatedSignature, setGeneratedSignature] = useState<string | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [uncertain, setUncertain] = useState(false);
  const [editingKey, setEditingKey] = useState<string>();
  const [media, setMedia] = useState<UnitMedia>(emptyUnitMedia);
  const uploadedMedia = useRef(new Map<string, string>());
  const [uploadProgress, setUploadProgress] = useState("");
  const attempt = useRef<Attempt | null>(null);
  const storageKey = `unit-batch:${root.user?.id}:${projectId}`;
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
  const disabled = !!busy || uncertain || !!editingKey;
  const mediaEntries = collectBatchMedia(media, rows);
  const sharedCount = Object.values(media).flat().length;
  const editingRow = rows.find((row) => row.key === editingKey);
  const generatedRooms = generateRoomNumbers(
    prefix,
    start ?? -1,
    count ?? 0,
    digits ?? 0,
  );
  const generationSignature = JSON.stringify([
    prefix,
    start,
    count,
    digits,
    typeCode,
  ]);
  const generationChanged =
    generatedSignature !== null && generatedSignature !== generationSignature;
  const errorCount = Object.keys(errors).length;
  const tableRef = useRef<HTMLElement>(null);
  const close = () =>
    navigate(unitListReturnTo(projectId, location.state?.returnTo));

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
        setUncertain(true);
        const savedMedia = JSON.parse(
          sessionStorage.getItem(`${storageKey}:media`) || "[]",
        ) as {
          category: UnitMediaCategory;
          uid: string;
          name: string;
          token: string;
        }[];
        const registry = savedMedia.map((file) => ({
          category: file.category,
          file: { uid: file.uid, name: file.name, status: "done" as const },
        }));
        for (const file of savedMedia)
          uploadedMedia.current.set(`${file.category}:${file.uid}`, file.token);
        setMedia(
          restoreBatchMedia(
            saved.sharedMediaIndexes ?? registry.map((_, i) => i),
            registry,
          ),
        );
        setRows(
          saved.rows.map((row) => ({
            roomNo: row.roomNo,
            unitTypeCode: row.unitTypeCode,
            key: crypto.randomUUID(),
            ...(row.mediaIndexes
              ? { media: restoreBatchMedia(row.mediaIndexes, registry) }
              : {}),
          })),
        );
        markDirty();
      }
    } catch {
      /* Storage is optional; the live attempt is still retained in memory. */
    }
  }, [storageKey, allowed]);

  function changeRows(next: BatchUnitRow[]) {
    markDirty();
    setRows(next);
    setServerErrors({});
    attempt.current = null;
  }
  function changeMedia(category: UnitMediaCategory, files: UploadFile[]) {
    if (disabled) return;
    const next = { ...media, [category]: files };
    if (collectBatchMedia(next, rows).length > 30) {
      message.warning(t("每批最多上传 30 个不同文件"));
      return;
    }
    markDirty();
    setMedia(next);
    attempt.current = null;
  }
  function updateRooms(rooms: string[], replace: boolean) {
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
    if ((replace ? 0 : rows.length) + rooms.length > BATCH_UNIT_LIMIT) {
      message.warning(t("每批最多创建 100 个单位"));
      return;
    }
    changeRows([
      ...(replace ? [] : rows),
      ...rooms.map((roomNo) => ({
        key: crypto.randomUUID(),
        roomNo,
        unitTypeCode: typeCode,
      })),
    ]);
    setGeneratedSignature(replace ? generationSignature : null);
    if (!replace) setRoomText("");
  }
  function patchRow(key: string, patch: Partial<BatchUnitRow>) {
    changeRows(
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }
  async function submit() {
    if (
      busyRef.current ||
      !!editingKey ||
      !project ||
      !rows.length ||
      (!uncertain && (errorCount || generationChanged))
    )
      return;
    busyRef.current = true;
    setBusy(true);
    let submitted = false;
    try {
      const entries = mediaEntries;
      if (!attempt.current) {
        for (const [index, { category, file }] of entries.entries()) {
          const key = `${category}:${file.uid}`;
          setUploadProgress(
            `正在上传单位资料 ${index + 1}/${entries.length}：${file.name}`,
          );
          if (!uploadedMedia.current.has(key)) {
            if (!file.originFileObj)
              throw new Error("请重新选择尚未上传完成的文件");
            const form = new FormData();
            form.append("projectId", projectId);
            form.append("category", category);
            form.append("file", file.originFileObj, file.name);
            const { data } = await api.post<{ token: string }>(
              "/units/batch-media",
              form,
              { timeout: 120000 },
            );
            uploadedMedia.current.set(key, data.token);
          }
        }
      }
      const payload = attempt.current ?? {
        requestId: crypto.randomUUID(),
        projectId,
        rows: rows.map((row) => ({
          roomNo: row.roomNo.trim(),
          unitTypeCode: row.unitTypeCode,
          ...(row.media
            ? { mediaIndexes: batchMediaIndexes(row.media, entries) }
            : {}),
        })),
        ...(entries.length
          ? {
              sharedMediaIndexes: batchMediaIndexes(media, entries),
              mediaTokens: entries.map(({ category, file }) =>
                uploadedMedia.current.get(`${category}:${file.uid}`)!,
              ),
            }
          : {}),
      };
      attempt.current = payload;
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(payload));
        sessionStorage.setItem(
          `${storageKey}:media`,
          JSON.stringify(
            entries.map(({ category, file }) => ({
              category,
              uid: file.uid,
              name: file.name,
              token: uploadedMedia.current.get(`${category}:${file.uid}`),
            })),
          ),
        );
      } catch {
        /* Retry works in memory. */
      }
      setUploadProgress("正在创建单位并关联资料");
      submitted = true;
      const { data } = await api.post<BatchResult>("/units/batch", payload, {
        timeout: 90000,
      });
      if (!data.ok) {
        setUncertain(false);
        attempt.current = null;
        try {
          sessionStorage.removeItem(storageKey);
          sessionStorage.removeItem(`${storageKey}:media`);
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
        tableRef.current?.scrollIntoView({
          block: "start",
          behavior: "smooth",
        });
      } else {
        try {
          sessionStorage.removeItem(storageKey);
          sessionStorage.removeItem(`${storageKey}:media`);
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
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (
        !submitted ||
        (status && status >= 400 && status < 500 && status !== 408)
      ) {
        setUncertain(false);
        attempt.current = null;
        if (submitted && status === 400) uploadedMedia.current.clear();
        try {
          sessionStorage.removeItem(storageKey);
          sessionStorage.removeItem(`${storageKey}:media`);
        } catch {
          /* no-op */
        }
      } else setUncertain(true);
      message.error(t(errorMessage(error)));
    } finally {
      busyRef.current = false;
      setBusy(false);
      setUploadProgress("");
    }
  }
  const roomInputs =
    inputMode === "paste" ? (
      <>
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
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[#73819a]">
            {t(
              `已识别 ${parseRoomNumbers(roomText).length} 个房号，添加后可在列表调整`,
            )}
          </span>
          <Button
            disabled={
              disabled ||
              !selectedType ||
              !!selectedTypeProblems.length ||
              !parseRoomNumbers(roomText).length
            }
            onClick={() => updateRooms(parseRoomNumbers(roomText), false)}
          >
            {t("添加到待创建列表")}
          </Button>
        </div>
      </>
    ) : (
      <>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <label className="flex items-center gap-3">
            <span>{t("房号前缀（选填）")}</span>
            <Input
              aria-label={t("房号前缀")}
              className="!w-32"
              disabled={disabled}
              value={prefix}
              maxLength={80}
              onChange={(e) => {
                markDirty();
                setPrefix(e.target.value);
              }}
            />
          </label>
          {(
            [
              ["起始编号", start, setStart, 0, 99999999],
              ["数量", count, setCount, 1, 100],
              ["编号位数", digits, setDigits, 1, 8],
            ] as const
          ).map(([label, value, setter, min, max]) => (
            <label key={label} className="flex items-center gap-3">
              <span>{t(label)}</span>
              <InputNumber
                aria-label={t(label)}
                className="!w-28"
                disabled={disabled}
                value={value}
                min={min}
                max={max}
                precision={0}
                onChange={(value) => {
                  markDirty();
                  setter(value);
                }}
              />
            </label>
          ))}
          <Button
            className="lg:!ml-auto"
            disabled={
              disabled ||
              !selectedType ||
              !!selectedTypeProblems.length ||
              !generatedRooms.length
            }
            onClick={() => updateRooms(generatedRooms, true)}
          >
            {t(rows.length ? "更新预览" : "生成预览")}
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-[#73819a]">
          <p className="break-words">
            {t("生成预览：")}
            {generatedRooms.length
              ? generatedRooms.length > 4
                ? `${generatedRooms.slice(0, 3).join("、")} … ${generatedRooms.at(-1)}`
                : generatedRooms.join("、")
              : t("请填写有效的生成规则")}
          </p>
          <p
            className={`${generationChanged ? "text-[#ad6800]" : "text-[#73819a]"}`}
            role={generationChanged ? "status" : undefined}
          >
            {t(
              generationChanged
                ? "生成规则已修改，请更新预览后再创建。"
                : "更新预览会替换当前列表，包括单独修改的房号和资料，不会继续追加。",
            )}
          </p>
        </div>
      </>
    );
  return (
    <RecordFormPage
      title={
        project
          ? `批量创建单位 · ${project.name}`
          : `批量创建单位 · ${loading ? "正在加载项目" : "项目资料未加载"}`
      }
      onBack={close}
      saving={busy}
      footer={
        allowed && project ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span>
              {uploadProgress && (
                <span role="status" className="mr-3 text-[#73819a]">
                  {t(uploadProgress)}
                </span>
              )}
              {t(`待创建 ${rows.length} 套`)}
              <span className="ml-3 text-[#73819a]">
                {t(`· 共用资料 ${sharedCount} 个`)}
                {rows.some((row) => row.media) &&
                  t(
                    ` · ${rows.filter((row) => row.media).length} 套单独调整资料`,
                  )}
              </span>
              {errorCount > 0 && (
                <span className="ml-3 text-red-600">
                  {t(`· ${errorCount} 行待修改`)}
                </span>
              )}
              {generationChanged && (
                <span className="ml-3 text-[#ad6800]">{t("· 请更新预览")}</span>
              )}
            </span>
            <div className="flex gap-3">
              <Button disabled={busy} onClick={close}>
                {t("取消")}
              </Button>
              <Button
                type="primary"
                aria-label={t(
                  uncertain ? "重试并确认创建结果" : `创建 ${rows.length} 套`,
                )}
                loading={busy}
                disabled={
                  busy ||
                  !!editingKey ||
                  !rows.length ||
                  (!uncertain && (!!errorCount || generationChanged))
                }
                onClick={() => submit()}
              >
                {t(uncertain ? "重试并确认创建结果" : `创建 ${rows.length} 套`)}
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
        <div className="batch-unit-page space-y-3 text-sm">
          {uncertain && (
            <p role="status" className="rounded-lg bg-[#fffbe6] p-4">
              {t(
                "上次提交结果尚未确认，请点击“重试并确认创建结果”。系统会核对同一次提交，不会重复创建单位。",
              )}
            </p>
          )}
          <section className="rounded-lg border border-[#e0e6ed] bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold">{t("选择单位类型")}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex min-w-0 items-center gap-3">
                <span className="shrink-0">{t("所属项目")}</span>
                <Input
                  aria-label={t("所属项目")}
                  value={project.name}
                  readOnly
                  disabled
                  className="min-w-0 flex-1"
                />
              </label>
              <label className="flex min-w-0 items-center gap-3">
                <span className="shrink-0">
                  <span className="mr-1 text-red-500">*</span>
                  {t("单位类型")}
                </span>
                <Select
                  aria-label={t("单位类型")}
                  className="min-w-0 flex-1"
                  placeholder={t("请选择单位类型")}
                  disabled={disabled || !types.length}
                  value={typeCode}
                  options={typeOptions}
                  onChange={(value) => {
                    markDirty();
                    setTypeCode(value);
                  }}
                />
              </label>
            </div>
            {!types.length ? (
              <Empty
                className="mt-4"
                description={t(
                  "当前项目尚未配置单位类型，请先编辑项目添加类型。",
                )}
              >
                <Button onClick={() => navigate(`/projects/${projectId}/edit`)}>
                  {t("编辑项目")}
                </Button>
              </Empty>
            ) : selectedType ? (
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md bg-[#f5f7fa] px-3 py-2">
                <div className="flex shrink-0 items-center gap-2 font-semibold">
                  {t("类型资料")}
                  <Tooltip
                    title={t(
                      "以上资料由项目的单位类型统一配置，在此不可修改。",
                    )}
                  >
                    {" "}
                    <InfoCircleOutlined
                      tabIndex={0}
                      aria-label={t("类型资料说明")}
                    />
                  </Tooltip>
                </div>
                <dl className="!m-0 flex flex-1 flex-wrap items-center justify-between gap-x-5 gap-y-2">
                  {unitTypeDetails(selectedType).map(([label, value]) => (
                    <div
                      key={label}
                      className="flex min-w-0 items-center gap-2"
                    >
                      <dt className="shrink-0 text-[#73819a]">
                        {t(label === "月租价格（HKD）" ? "月租" : label)}
                      </dt>
                      <dd className="!m-0 break-words">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
            {!!selectedTypeProblems.length && (
              <div className="mt-4 rounded-md bg-[#fffbe6] p-3" role="status">
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
          </section>
          <section className="rounded-lg border border-[#e0e6ed] bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold">{t("添加房号")}</h2>
            <Tabs
              activeKey={inputMode}
              onChange={setInputMode}
              items={[
                {
                  key: "paste",
                  label: t("粘贴房号"),
                  disabled,
                  children: inputMode === "paste" ? roomInputs : null,
                },
                {
                  key: "generate",
                  label: t("连续生成"),
                  disabled,
                  children: inputMode === "generate" ? roomInputs : null,
                },
              ]}
            />
          </section>
          <section
            className="rounded-lg border border-[#e0e6ed] bg-white p-4"
            aria-label={t("共用资料上传")}
          >
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              <h2 className="text-sm font-semibold">
                {t("共用图片、视频和文件（选填）")}
              </h2>
              <span className="text-[#73819a]">
                {t("本批创建的每套单位共用，编辑时可单独调整。")}
              </span>
              <span className="xl:ml-auto text-[#73819a]">
                {t("单个文件不超过 30 MB，每批最多 30 个不同文件。")}
              </span>
            </div>
            <Form layout="vertical" disabled={disabled}>
              <div className="grid min-w-0 gap-4 md:grid-cols-3 md:[&>div+div]:border-l md:[&>div+div]:border-[#e0e6ed] md:[&>div+div]:pl-4">
                <UnitMediaField
                  compact
                  label="单位图片"
                  prompt="添加图片"
                  category="PHOTO"
                  files={media.PHOTO}
                  onChange={changeMedia}
                />
                <UnitMediaField
                  compact
                  label="单位视频"
                  prompt="添加视频"
                  category="VIDEO"
                  files={media.VIDEO}
                  onChange={changeMedia}
                />
                <UnitMediaField
                  compact
                  label="单位文件"
                  prompt="添加文件"
                  category="PROJECT_FILE"
                  files={media.PROJECT_FILE}
                  onChange={changeMedia}
                />
              </div>
            </Form>
          </section>
          <section
            ref={tableRef}
            className="rounded-lg border border-[#e0e6ed] bg-white p-4"
          >
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <h2 className="text-sm font-semibold">
                {t(`待创建列表（${rows.length}）`)}
              </h2>
              <span className="text-[#73819a]">
                {t("每批最多 100 套，月租及类型资料自动带入")}
              </span>
              <Button
                className="!ml-auto"
                type="link"
                danger
                disabled={disabled || !rows.length}
                onClick={() => {
                  changeRows([]);
                  setGeneratedSignature(null);
                }}
              >
                {t("清空列表")}
              </Button>
            </div>
            <Table<BatchUnitRow>
              className="[&_.ant-table-cell]:!py-1"
              rowKey="key"
              size="small"
              dataSource={rows}
              pagination={false}
              scroll={{ x: 1280, y: 360 }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t(
                      "选择单位类型并生成或粘贴房号，预览将在这里展示",
                    )}
                  />
                ),
              }}
              columns={[
                { title: t("序号"), width: 55, render: (_, _row, i) => i + 1 },
                {
                  title: t("房号"),
                  width: 120,
                  render: (_, row, i) => (
                    <Input
                      size="small"
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
                  width: 215,
                  render: (_, row, i) => (
                    <Select
                      size="small"
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
                ...(
                  [
                    ["期 / 座", 85, (type: Row) => typeValue(type.building)],
                    ["楼层", 75, (type: Row) => typeFloor(type.floor)],
                    [
                      "实用面积",
                      95,
                      (type: Row) => typeValue(type.area, " ㎡"),
                    ],
                    ["间隔", 100, (type: Row) => typeValue(type.layout)],
                    [
                      "月租（HKD）",
                      160,
                      (type: Row) =>
                        type.referenceRent == null
                          ? "待完善"
                          : amount(type.referenceRent),
                    ],
                  ] as const
                ).map(([title, width, render]) => ({
                  title: t(title),
                  width,
                  render: (_: unknown, row: BatchUnitRow) => {
                    const type = types.find(
                      (item) => item.code === row.unitTypeCode,
                    );
                    return type ? render(type) : "—";
                  },
                })),
                {
                  title: t("校验结果"),
                  width: 190,
                  render: (_, row) =>
                    errors[row.key] ? (
                      <span role="status" className="text-red-600">
                        {t(errors[row.key])}
                      </span>
                    ) : (
                      <span className="text-green-700">
                        {t("格式正常")}
                        {row.media && (
                          <Tooltip
                            title={t("本单位的图片、视频和文件已单独调整")}
                          >
                            <InfoCircleOutlined
                              className="ml-2 text-[#73819a]"
                              aria-label={t("资料单独调整")}
                            />
                          </Tooltip>
                        )}
                      </span>
                    ),
                },
                {
                  title: t("操作"),
                  width: 135,
                  fixed: "right",
                  render: (_, row, i) => (
                    <div className="flex items-center gap-1">
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        aria-label={t(`编辑第 ${i + 1} 行`)}
                        disabled={disabled}
                        onClick={() => setEditingKey(row.key)}
                      >
                        {t("编辑")}
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        danger
                        aria-label={t(`移除第 ${i + 1} 行`)}
                        disabled={disabled}
                        onClick={() =>
                          changeRows(
                            rows.filter((item) => item.key !== row.key),
                          )
                        }
                      >
                        {t("移除")}
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </section>
        </div>
      )}
      {editingRow && project && (
        <BatchUnitEditDrawer
          key={editingRow.key}
          row={editingRow}
          rows={rows}
          project={project}
          sharedMedia={media}
          onClose={() => setEditingKey(undefined)}
          onSave={(updated) => {
            patchRow(updated.key, updated);
            setEditingKey(undefined);
          }}
        />
      )}
    </RecordFormPage>
  );
});
