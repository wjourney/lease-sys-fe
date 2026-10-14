import { ResourceList } from "../../../components/resource-list/ResourceList";
import { useLocation, useNavigate } from "react-router-dom";
import { ProjectGrid } from "./components/ProjectGrid";
import { observer } from "mobx-react-lite";
import { useRoot } from "../../../stores/root";
import { t } from "../../../shared/i18n";
export default observer(function ProjectListPage() {
  const root = useRoot();
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <ResourceList
      resource="projects"
      hideStatus
      fixed={{ status: "" }}
      pageSize={12}
      listToolbar={
        root.salesRole ? (
          <p className="mx-5 mt-4 text-sm text-[#73819a]">
            {t(
              "展示已启用的项目和单位，包含可租与在租单位；请按单位状态查看可租房源。",
            )}
          </p>
        ) : undefined
      }
      renderItems={(props) => <ProjectGrid {...props} />}
      onCreate={() =>
        navigate("/projects/new", {
          state: { returnTo: location.pathname + location.search },
        })
      }
    />
  );
});
