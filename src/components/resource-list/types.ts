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
  onPageChange?: (page: number) => void;
}
export interface ResourceListProps {
  resource: string;
  fixed?: Row;
  embedded?: boolean;
  pageSize?: number;
  renderItems?: (props: ListViewProps) => ReactNode;
  listToolbar?: ReactNode;
  filterExtras?: ReactNode;
  onResetExtras?: () => void;
  hideCreate?: boolean;
  createDisabledReason?: string;
  hideStatus?: boolean;
  renderRowActions?: (row: Row) => ReactNode;
  onViewRow?: (row: Row) => void;
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
