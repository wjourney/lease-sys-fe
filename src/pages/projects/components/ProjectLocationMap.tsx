import { useEffect, useRef } from "react";
import { circleMarker, map as createMap, tileLayer } from "leaflet";
import type { CircleMarker, Map } from "leaflet";
import "leaflet/dist/leaflet.css";

const HONG_KONG_CENTER: [number, number] = [22.3193, 114.1694];

export default function ProjectLocationMap({
  latitude,
  longitude,
  onPick,
}: {
  latitude?: number;
  longitude?: number;
  onPick?: (latitude: number, longitude: number) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const marker = useRef<CircleMarker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!container.current) return;
    const hasLocation = latitude !== undefined && longitude !== undefined;
    const instance = createMap(container.current).setView(
      hasLocation ? [latitude, longitude] : HONG_KONG_CENTER,
      hasLocation ? 16 : 11,
    );
    map.current = instance;
    tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(instance);
    instance.on("click", ({ latlng }) =>
      onPickRef.current?.(
        Number(latlng.lat.toFixed(8)),
        Number(latlng.lng.toFixed(8)),
      ),
    );
    // Ant Design's modal finishes sizing after mount.
    const frame = requestAnimationFrame(() => instance.invalidateSize());
    return () => {
      cancelAnimationFrame(frame);
      instance.remove();
      map.current = null;
      marker.current = null;
    };
    // The modal mounts a fresh map for each opening; selection changes update its marker below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    if (latitude === undefined || longitude === undefined) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    if (marker.current) marker.current.setLatLng([latitude, longitude]);
    else {
      marker.current = circleMarker([latitude, longitude], {
        radius: 9,
        color: "#fff",
        weight: 3,
        fillColor: "#193455",
        fillOpacity: 1,
      }).addTo(instance);
    }
  }, [latitude, longitude]);

  return (
    <div
      ref={container}
      className="h-[min(52vh,420px)] min-h-72 w-full overflow-hidden rounded-md border border-[#dce2ea]"
      aria-label={onPick ? "点击地图选择项目位置" : "项目位置地图"}
    />
  );
}
