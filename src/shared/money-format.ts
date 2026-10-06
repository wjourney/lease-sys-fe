export const formatMoney = (value: string | number, currency: string) =>
  new Intl.NumberFormat("zh-HK", { style: "currency", currency }).format(
    Number(value),
  );
