import { ResourceList } from "../../../components/resource-list/ResourceList";
import { ProjectDrawer } from "../components/ProjectDrawer";
import { ProjectGrid } from "./components/ProjectGrid";
export default function ProjectListPage() {
  return (
    <ResourceList
      resource="projects"
      pageSize={9}
      renderItems={(props) => <ProjectGrid {...props} />}
      renderCreateEditor={(props) => <ProjectDrawer {...props} />}
    />
  );
}
