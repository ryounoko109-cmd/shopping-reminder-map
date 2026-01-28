"use client";
import { useMapEvents } from "react-leaflet";

export default function MapClickHandler({ onAddStore }) {
  useMapEvents({
    click(e) {
      onAddStore(e.latlng);
    },
  });
  return null;
}
