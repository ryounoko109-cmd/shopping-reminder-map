"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

/* =======================
   react-leaflet dynamic
======================= */
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer   = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker      = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const Popup       = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });
const useMapEvents = dynamic(() => import("react-leaflet").then(m => m.useMapEvents), { ssr: false });

/* =======================
   util
======================= */
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const NOTIFY_DISTANCE = 100;

/* =======================
   地図クリックで店舗追加
======================= */
function AddStoreOnClick({ onAdd }) {
  useMapEvents({
    click(e) {
      onAdd(e.latlng);
    },
  });
  return null;
}

/* =======================
   Main
======================= */
export default function MapPage() {
  const [stores, setStores] = useState([]);
  const [currentPos, setCurrentPos] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [debugLat, setDebugLat] = useState(35.6812);
  const [debugLng, setDebugLng] = useState(139.7671);

  const notifiedRef = useRef(new Set());
  const iconRef = useRef(null);

  /* ===== 現在地アイコン ===== */
  useEffect(() => {
    import("leaflet").then(L => {
      iconRef.current = L.divIcon({
        className: "",
        html: `<div style="
          width:12px;height:12px;
          background:#2979ff;
          border-radius:50%;
          border:2px solid white;"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
    });
  }, []);

  /* ===== PWA ===== */
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  /* ===== GPS ===== */
  useEffect(() => {
    if (debugMode) return;
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(p => {
      setCurrentPos([p.coords.latitude, p.coords.longitude]);
    });

    return () => navigator.geolocation.clearWatch(id);
  }, [debugMode]);

  /* ===== デバッグ位置 ===== */
  useEffect(() => {
    if (debugMode) {
      setCurrentPos([debugLat, debugLng]);
    }
  }, [debugLat, debugLng, debugMode]);

  /* ===== 通知 ===== */
  useEffect(() => {
    if (!currentPos) return;

    stores.forEach(store => {
      if (notifiedRef.current.has(store.id)) return;

      const hasTodo = store.items.some(i => !i.done);
      if (!hasTodo) return;

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
        notifiedRef.current.add(store.id);
      }
    });
  }, [currentPos, stores]);

  /* ===== 店舗追加 ===== */
  const addStore = latlng => {
    const name = prompt("店舗名");
    if (!name) return;

    setStores(s => [
      ...s,
      {
        id: Date.now(),
        name,
        lat: latlng.lat,
        lng: latlng.lng,
        items: [],
      },
    ]);
  };

  /* ===== 店舗更新 ===== */
  const updateStore = (id, data) => {
    setStores(s =>
      s.map(st => (st.id === id ? { ...st, ...data } : st))
    );
  };

  /* ===== 商品操作 ===== */
  const toggleItem = (sid, i) => {
    setStores(s =>
      s.map(st => {
        if (st.id !== sid) return st;
        const items = [...st.items];
        items[i].done = !items[i].done;
        if (items.every(it => it.done)) {
          notifiedRef.current.delete(sid);
        }
        return { ...st, items };
      })
    );
  };

  const addItem = sid => {
    const name = prompt("商品名");
    if (!name) return;
    updateStore(sid, {
      items: [...stores.find(s => s.id === sid).items, { name, done: false }],
    });
  };

  return (
    <>
      {/* ===== Debug UI ===== */}
      <div style={{ padding: 8, background: "#fff" }}>
        <label>
          <input type="checkbox" checked={debugMode}
            onChange={e => setDebugMode(e.target.checked)} />
          デバッグモード（疑似移動）
        </label>
        {debugMode && (
          <>
            <input type="range" min="35.67" max="35.69" step="0.0001"
              value={debugLat} onChange={e => setDebugLat(+e.target.value)} />
            <input type="range" min="139.75" max="139.78" step="0.0001"
              value={debugLng} onChange={e => setDebugLng(+e.target.value)} />
          </>
        )}
      </div>

      {/* ===== MAP ===== */}
      <div style={{ height: "85vh" }}>
        <MapContainer
          center={currentPos || [35.6812, 139.7671]}
          zoom={16}
          style={{ height: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <AddStoreOnClick onAdd={addStore} />

          {stores.map(store => (
            <Marker
              key={store.id}
              position={[store.lat, store.lng]}
              draggable
              eventHandlers={{
                dragend: e => {
                  const p = e.target.getLatLng();
                  updateStore(store.id, { lat: p.lat, lng: p.lng });
                },
              }}
            >
              <Popup>
                <input
                  value={store.name}
                  onChange={e => updateStore(store.id, { name: e.target.value })}
                />
                <hr />
                {store.items.map((it, i) => (
                  <label key={i}>
                    <input type="checkbox"
                      checked={it.done}
                      onChange={() => toggleItem(store.id, i)} />
                    {it.name}
                  </label>
                ))}
                <button onClick={() => addItem(store.id)}>＋商品</button>
              </Popup>
            </Marker>
          ))}

          {currentPos && iconRef.current && (
            <Marker position={currentPos} icon={iconRef.current} />
          )}
        </MapContainer>
      </div>
    </>
  );
}
