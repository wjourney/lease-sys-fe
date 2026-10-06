import { App } from "antd";
import { createContext, Dispatch, SetStateAction, useContext } from "react";
import { NavigateFunction } from "react-router-dom";
import { Row } from "../../shared/api";
import { Field } from "../../shared/resource-config";
import { RootStore } from "../../stores/root";
export type DetailContextValue = {
  setTab: (tab: string) => void;
  resource: string;
  id: string;
  row: Row;
  root: RootStore;
  logs: Row[];
  receipts: Row[];
  versions: Row[];
  navigate: NavigateFunction;
  message: ReturnType<typeof App.useApp>["message"];
  modal: ReturnType<typeof App.useApp>["modal"];
  openAction: (
    title: string,
    fields: Field[],
    path: string,
    initial?: Row,
    extra?: Row,
  ) => void;
  openReceiptAction: (
    fields: Field[],
    path: string,
    initial?: Row,
    extra?: Row,
  ) => void;
  run: (path: string, body?: Row) => Promise<void>;
  previewInvoice: () => Promise<void>;
  setMaterial: Dispatch<SetStateAction<Row | undefined>>;
  setVersion: Dispatch<SetStateAction<string | undefined>>;
};
export const DetailContext = createContext<DetailContextValue | null>(null);
export function useRecordDetail() {
  const ctx = useContext(DetailContext);
  if (!ctx)
    throw new Error("Business detail components require ResourceDetail");
  return ctx;
}
