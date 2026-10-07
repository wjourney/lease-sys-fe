import type { Row } from "../../shared/api";

export function saveDownload(data: Blob, name: string) {
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportRows(
  rows: Row[],
  fields: [string, string][],
  name: string,
) {
  const escape = (value: unknown) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const csv = [
    fields.map(([, label]) => label),
    ...rows.map((row) => fields.map(([key]) => row[key])),
  ]
    .map((cells) => cells.map(escape).join(","))
    .join("\r\n");
  saveDownload(
    new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }),
    name,
  );
}
