import { RequestError as Alert } from "../../components/feedback/RequestError";
import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Card, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { api, errorMessage, options, Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";
import { UnitTypesTable } from "./components/UnitTypesTable";
const { Paragraph } = Typography;
export const SettingsPage = observer(function SettingsPage() {
  const root = useRoot();
  const { message } = App.useApp();
  const [setting, setSetting] = useState<Row>();
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    options("settings", {
      key: "unit_types",
    })
      .then((data) => {
        setSetting(data[0]);
        setRows(data[0]?.value ?? []);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [root.epoch]);
  async function save() {
    setSaving(true);
    try {
      const { data } = setting
        ? await api.patch("/settings/" + setting.id, {
            revision: setting.revision,
            value: rows,
          })
        : await api.post("/settings", { key: "unit_types", value: rows });
      setSetting(data);
      message.success("设置已保存");
      root.invalidate();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  const addType = () =>
    setRows([
      ...rows,
      {
        code: "",
        name: "",
        sortOrder: rows.length + 1,
        enabled: true,
      },
    ]);
  return (
    <div>
      {error && <Alert message={t(error)} type="error" />}
      <Card
        title={t("单位类型")}
        extra={
          root.canWrite("settings") ? (
            <div className="flex flex-wrap gap-2">
              <Button icon={<PlusOutlined aria-hidden />} onClick={addType}>
                {t("新增类型")}
              </Button>
              <Button type="primary" loading={saving} onClick={save}>
                {t("保存设置")}
              </Button>
            </div>
          ) : undefined
        }
      >
        <Paragraph type="secondary">
          {t("编码用于关联具体单位。已使用的类型可以停用，历史数据仍会保留。")}
        </Paragraph>
        <UnitTypesTable
          rows={rows}
          root={root}
          setting={setting}
          setRows={setRows}
        />
      </Card>
    </div>
  );
});
export default SettingsPage;
