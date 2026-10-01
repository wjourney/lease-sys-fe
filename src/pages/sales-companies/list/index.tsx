import { ResourceList } from "../../../components/resource-list/ResourceList";
import { CreateSalesCompanyDrawer } from "./components/CreateSalesCompanyDrawer";
export default function SalesCompanyListPage() {
  return (
    <ResourceList
      resource="sales-companies"
      renderCreateEditor={({ onClose, onSaved }) => (
        <CreateSalesCompanyDrawer onClose={onClose} onSaved={onSaved} />
      )}
    />
  );
}
