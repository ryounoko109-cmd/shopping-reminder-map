"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });

const NOTIFY_DISTANCE = 100;

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapPage() {
  const [currentPos, setCurrentPos] = useState(null);
  const [stores, setStores] = useState([]);
  const [debug, setDebug] = useState(false);
  const notified = useRef(new Set());

  /* 現在地 */
  useEffect(() => {
    if (debug) return;
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(pos => {
      setCurrentPos([pos.coords.latitude, pos.coords.longitude]);
    });

    return () => navigator.geolocation.clearWatch(id);
  }, [debug]);

  /* 通知 */
  useEffect(() => {
    if (!currentPos) return;

    stores.forEach(store => {
      if (notified.current.has(store.id)) return;
      if (store.items.every(i => i.done)) return;

      const d = getDistance(
        currentPos[0],
        currentPos[1],
        store.lat,
        store.lng
      );

      if (d < NOTIFY_DISTANCE && Notification.permission === "granted") {
        new Notification("🛒 買い物忘れ防止", {
          body: `${store.name} に未購入の商品があります`,
        });
        notified.current.add(store.id);
      }
    });
  }, [currentPos, stores]);

  return (
    <>
      <div style={{ padding: 8 }}>
        <label>
          <input
            type="checkbox"
            checked={debug}
            onChange={e => setDebug(e.target.checked)}
          />
          デバッグモード
        </label>
      </div>

      <MapContainer
        center={currentPos ?? [35.681236, 139.767125]}
        zoom={16}
        style={{ height: "80vh" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {stores.map(store => (
          <Marker
            key={store.id}
            position={[store.lat, store.lng]}
            draggable
            eventHandlers={{
              dragend: e => {
                const p = e.target.getLatLng();
                setStores(s =>
                  s.map(x =>
                    x.id === store.id
                      ? { ...x, lat: p.lat, lng: p.lng }
                      : x
                  )
                );
              }
            }}
          >
            <Popup>
              <strong>{store.name}</strong>
              {store.items.map((i, idx) => (
                <div key={idx}>
                  <label>
                    <input
                      type="checkbox"
                      checked={i.done}
                      onChange={() => {
                        setStores(s =>
                          s.map(st =>
                            st.id === store.id
                              ? {
                                  ...st,
                                  items: st.items.map((it, j) =>
                                    j === idx ? { ...it, done: !it.done } : it
                                  )
                                }
                              : st
                          )
                        );
                      }}
                    />
                    {i.name}
                  </label>
                </div>
              ))}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}
