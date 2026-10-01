import { Button } from "antd";
import { observer } from "mobx-react-lite";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { t } from "../../../../shared/i18n";
export const MaterialActions = observer(function MaterialActions() {
  const { resource, root, setMaterial, setVersion, id } = useRecordDetail();
  return (
    <>
      {resource === "materials" && root.canWrite("materials") && (
        <Button
          onClick={() => {
            setMaterial({});
            setVersion(id);
          }}
        >
          {t("上传新版本")}
        </Button>
      )}
    </>
  );
});
