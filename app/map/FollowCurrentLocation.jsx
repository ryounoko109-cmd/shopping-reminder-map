"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function FollowCurrentLocation({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;
    map.setView(position);
  }, [position, map]);

  return null;
}
