import { ResourceList } from "../../../components/resource-list/ResourceList";
import { useLocation, useNavigate } from "react-router-dom";
import { ProjectGrid } from "./components/ProjectGrid";
export default function ProjectListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <ResourceList
      resource="projects"
      hideStatus
      fixed={{ status: "" }}
      pageSize={12}
      renderItems={(props) => <ProjectGrid {...props} />}
      onCreate={() =>
        navigate("/projects/new", {
          state: { returnTo: location.pathname + location.search },
        })
      }
    />
  );
}
