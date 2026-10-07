import { Button, Result, Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api, errorMessage, type Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";
import { RequestError } from "../feedback/RequestError";
import { ProjectForm } from "../../pages/projects/components/ProjectForm";
import { UnitForm } from "../../pages/units/components/UnitForm";
import { RecordFormPage } from "./RecordFormPage";

export default function ResourceEditPage({
  resource,
}: {
  resource: "projects" | "units";
}) {
  const { pathname } = useLocation();
  return <EditPage key={pathname} resource={resource} />;
}

const EditPage = observer(function EditPage({
  resource,
}: {
  resource: "projects" | "units";
}) {
  const { id, projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const root = useRoot();
  const allowed = root.canWrite(resource);
  const [row, setRow] = useState<Row>();
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const title = `${id ? "编辑" : "新建"}${resource === "projects" ? "项目" : "单位"}`;
  const fallback = projectId
    ? `/projects/${projectId}`
    : id
      ? `/projects/${id}`
      : "/projects";
  const from = location.state?.returnTo;
  const returnTo =
    typeof from === "string" &&
    /^\/projects(?:\/(?!new(?:\?|$))[^/?#]+)?(?:\?[^#]*)?$/.test(from)
      ? from
      : fallback;
  const close = () => navigate(returnTo, { replace: true });
  useEffect(() => {
    if (!allowed || !id) return;
    let active = true;
    setError("");
    api
      .get<Row>(`/${resource}/${id}`)
      .then(({ data }) => {
        if (!active) return;
        if (resource === "units" && data.projectId !== projectId) {
          setError(t("当前单位不属于此项目"));
          return;
        }
        setRow(data);
      })
      .catch((cause) => {
        if (active) setError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, [allowed, id, projectId, resource, retry]);
  if (!allowed)
    return (
      <RecordFormPage title={title} onBack={close}>
        <Result
          status="403"
          title={t("当前账号没有此操作权限")}
          extra={<Button onClick={close}>{t("返回")}</Button>}
        />
      </RecordFormPage>
    );
  if (id && !row)
    return (
      <RecordFormPage title={title} onBack={close}>
        {error ? (
          <>
            <RequestError message={error} />
            <Button onClick={() => setRetry((value) => value + 1)}>
              {t("重新加载")}
            </Button>
          </>
        ) : (
          <div className="flex justify-center p-16">
            <Spin />
          </div>
        )}
      </RecordFormPage>
    );
  return resource === "projects" ? (
    <ProjectForm row={row} onClose={close} onSaved={close} />
  ) : (
    <UnitForm
      row={row}
      initial={{ projectId }}
      onClose={close}
      onSaved={close}
    />
  );
});
