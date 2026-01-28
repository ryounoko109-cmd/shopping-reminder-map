"use client";
import { Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";
import L from "leaflet";

export default function AddStoreOnClick() {
  const [stores, setStores] = useState([]);

  useMapEvents({
    click(e) {
      const name = prompt("店舗名を入力してください");
      if (!name) return;

      setStores((prev) => [
        ...prev,
        {
          id: Date.now(),
          name,
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        },
      ]);
    },
  });

  return (
    <>
      {stores.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const pos = e.target.getLatLng();
              setStores((prev) =>
                prev.map((p) =>
                  p.id === s.id
                    ? { ...p, lat: pos.lat, lng: pos.lng }
                    : p
                )
              );
            },
          }}
        />
      ))}
    </>
  );
}
