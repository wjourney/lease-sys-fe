import dayjs from "dayjs";

/** Match the first rent bill, including legacy calendar-month agreements. */
export function initialRentAmount(
  rent: string | number | undefined,
  startsOn: string | undefined,
  endsOn: string | undefined,
  agreement: {
    billingVersion?: number;
    paymentIntervalMonths?: number;
    firstPeriodProration?: boolean;
    lastPeriodProration?: boolean;
  } = {},
): string {
  if (!rent || !startsOn || !endsOn) return "0.00";
  const start = dayjs(startsOn).startOf("day");
  const end = dayjs(endsOn).startOf("day");
  if (!start.isValid() || !end.isValid() || end.isBefore(start)) return "0.00";
  const [whole, fraction = ""] = String(rent).split(".");
  if (!/^\d+$/.test(whole) || !/^\d{0,2}$/.test(fraction)) return "0.00";
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  let numerator = 0n,
    denominator = 1n;
  if (agreement.billingVersion !== 1) {
    const next = start.add(1, "month");
    const last = end.isBefore(next) ? end : next.subtract(1, "day");
    const prorate =
      agreement.firstPeriodProration !== false &&
      (last.isBefore(end) || agreement.lastPeriodProration !== false);
    numerator =
      cents *
      BigInt(prorate ? last.diff(start, "day") + 1 : next.diff(start, "day"));
    denominator = BigInt(next.diff(start, "day"));
  } else {
    const next = start.add(agreement.paymentIntervalMonths ?? 1, "month");
    const last = end.isBefore(next) ? end : next.subtract(1, "day");
    let cursor = start;
    while (!cursor.isAfter(last)) {
      const monthEnd = cursor.endOf("month").startOf("day");
      const segmentEnd = last.isBefore(monthEnd) ? last : monthEnd;
      const prorate =
        (!cursor.isSame(start) || agreement.firstPeriodProration !== false) &&
        (!segmentEnd.isSame(end) || agreement.lastPeriodProration !== false);
      const divisor = BigInt(cursor.daysInMonth());
      const days = BigInt(
        prorate ? segmentEnd.diff(cursor, "day") + 1 : cursor.daysInMonth(),
      );
      numerator = numerator * divisor + cents * days * denominator;
      denominator *= divisor;
      cursor = segmentEnd.add(1, "day");
    }
  }
  // Round once, half up, without binary floating-point errors.
  const rounded = (numerator * 2n + denominator) / (denominator * 2n);
  return `${rounded / 100n}.${String(rounded % 100n).padStart(2, "0")}`;
}
