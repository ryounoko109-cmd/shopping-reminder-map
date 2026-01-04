"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function FollowCurrentLocation({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !position) return;
    map.setView(position, map.getZoom(), { animate: true });
  }, [position, map]);

  return null;
}
