"use client";
/**
 * Leaflet Map component — dynamically imported to avoid SSR issues.
 * Uses OpenStreetMap tiles (free, no API key required).
 */
import { useEffect, useRef } from "react";

interface Stop {
  stopId: string;
  name: string;
  latitude: number;
  longitude: number;
  sequenceNumber: number;
}

interface BusLocation {
  latitude: number;
  longitude: number;
  speedKmh: number;
  heading: number;
  nextStopId: string | null;
  progressPercent: number;
  isSimulated: boolean;
}

interface LiveMapProps {
  stops: Stop[];
  location: BusLocation | null;
  userLat?: number;
  userLng?: number;
  height?: number;
}

export function LiveMap({ stops, location, userLat, userLng, height = 400 }: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const busMarkerRef = useRef<unknown>(null);
  const userMarkerRef = useRef<unknown>(null);
  const polylineRef = useRef<unknown>(null);

  useEffect(() => {
    let L: typeof import("leaflet") | null = null;

    const init = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;
      L = (await import("leaflet")).default;
      // Fix default icon
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({ iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png", iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png" });

      const centerLat = location?.latitude ?? stops[0]?.latitude ?? 18.52;
      const centerLng = location?.longitude ?? stops[0]?.longitude ?? 73.86;

      const map = L.map(mapRef.current!).setView([centerLat, centerLng], 10);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Draw route polyline
      if (stops.length >= 2) {
        const coords: [number, number][] = stops.map((s) => [s.latitude, s.longitude]);
        const poly = L.polyline(coords, { color: "#f97316", weight: 4, opacity: 0.7, dashArray: "8 4" }).addTo(map);
        polylineRef.current = poly;
        map.fitBounds(poly.getBounds(), { padding: [30, 30] });
      }

      // Stop markers
      for (const stop of stops) {
        const isNext = location?.nextStopId === stop.stopId;
        const stopIcon = L.divIcon({
          html: `<div style="width:${isNext ? 14 : 10}px;height:${isNext ? 14 : 10}px;border-radius:50%;background:${isNext ? "#f97316" : "#1e40af"};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
          className: "",
          iconSize: [isNext ? 14 : 10, isNext ? 14 : 10],
          iconAnchor: [isNext ? 7 : 5, isNext ? 7 : 5],
        });
        const m = L.marker([stop.latitude, stop.longitude], { icon: stopIcon }).addTo(map);
        m.bindTooltip(stop.name, { permanent: false, direction: "top" });
      }

      // Bus marker
      if (location) {
        const busIcon = L.divIcon({
          html: `<div style="width:32px;height:32px;border-radius:50%;background:#f97316;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(249,115,22,0.5);font-size:16px">🚌</div>`,
          className: "",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        busMarkerRef.current = L.marker([location.latitude, location.longitude], { icon: busIcon, zIndexOffset: 1000 })
          .addTo(map)
          .bindPopup(`<b>Bus</b><br>Speed: ${location.speedKmh.toFixed(0)} km/h<br><em>Simulated GPS</em>`);
      }

      // User marker
      if (userLat && userLng) {
        const userIcon = L.divIcon({
          html: `<div style="width:20px;height:20px;border-radius:50%;background:#1e40af;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
          className: "",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon }).addTo(map).bindPopup("Your Location");
      }
    };

    init();
    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update bus marker position
  useEffect(() => {
    if (!mapInstanceRef.current || !busMarkerRef.current || !location) return;
    const L = require("leaflet");
    (busMarkerRef.current as { setLatLng: (a: [number, number]) => void }).setLatLng([location.latitude, location.longitude]);
  }, [location?.latitude, location?.longitude]);

  return (
    <div style={{ position: "relative" }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ height, borderRadius: 12, overflow: "hidden", border: "1px solid var(--color-border)" }} />
      {location?.isSimulated && (
        <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", color: "white", fontSize: "0.6875rem", padding: "3px 8px", borderRadius: 4, pointerEvents: "none" }}>
          🔴 Simulated GPS
        </div>
      )}
    </div>
  );
}
