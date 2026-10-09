import dayjs from "dayjs";

export function renewalEndDate(previousEndsOn: string) {
  return dayjs(previousEndsOn).add(1, "year").format("YYYY-MM-DD");
}
