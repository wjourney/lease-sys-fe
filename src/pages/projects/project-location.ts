export type ProjectLocation = { latitude: number; longitude: number };

export function projectLocation(
  latitude: unknown,
  longitude: unknown,
): ProjectLocation | null {
  if (latitude === null || latitude === undefined || latitude === "")
    return null;
  if (longitude === null || longitude === undefined || longitude === "")
    return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
    ? { latitude: lat, longitude: lng }
    : null;
}
