import { api, Row } from "./api";

export async function registerReceiptWithVoucher(
  path: string,
  values: Row,
  extra: Row,
  file?: File,
) {
  const { data: receipt } = await api.post<Row>(path, { ...values, ...extra });
  if (!file) return { receipt, voucherFailed: false };

  const formData = new FormData();
  formData.append(
    "payload",
    JSON.stringify({
      incomeId: receipt.id,
      category: "VOUCHER",
      title: file.name,
      visibility: "SHARED",
    }),
  );
  formData.append("file", file);
  try {
    await api.post("/materials/upload", formData);
    return { receipt, voucherFailed: false };
  } catch {
    return { receipt, voucherFailed: true };
  }
}
