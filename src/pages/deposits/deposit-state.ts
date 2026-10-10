export const depositStates: Record<string, string> = {
  UNCOLLECTED: "未收取",
  HELD: "持有中",
  REFUND_PENDING: "待退还",
  SETTLED: "已结清",
  NOT_REQUIRED: "无需押金",
};

export const depositColors: Record<string, string> = {
  UNCOLLECTED: "orange",
  HELD: "blue",
  REFUND_PENDING: "gold",
  SETTLED: "green",
};
