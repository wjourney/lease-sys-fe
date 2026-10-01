import type { ReactNode } from "react";
import type { NavigateFunction, SetURLSearchParams } from "react-router-dom";
import type { Row } from "../../shared/api";
import type { ListStore } from "../../stores/root";
export interface ListViewProps {
  store: ListStore;
  navigate: NavigateFunction;
  page: number;
  setSearch: SetURLSearchParams;
  query: string;
}
export interface ResourceListProps {
  resource: string;
  fixed?: Row;
  embedded?: boolean;
  pageSize?: number;
  renderItems?: (props: ListViewProps) => ReactNode;
  listToolbar?: ReactNode;
  renderCreateEditor?: (props: {
    onClose: () => void;
    onSaved: () => void;
  }) => ReactNode;
  renderEditor?: (props: {
    row?: Row;
    initial: Row;
    onClose: () => void;
    onSaved: () => void;
  }) => ReactNode;
}
