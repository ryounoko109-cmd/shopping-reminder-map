"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/* =======================
   react-leaflet（dynamic）
======================= */
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then(m => m.CircleMarker), { ssr: false });

//const LONG_PRESS_MS = 700;
const DEFAULT_NOTIFY_DISTANCE = 120; // m
const DEFAULT_COOLDOWN_MIN = 30; // 分

/* =======================
   距離計算
======================= */
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


/* =======================
   地図ジャンプ
======================= */
function MapJump({ target }) {
  const { useMap } = require("react-leaflet");
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    map.flyTo(target, map.getZoom(), { animate: true, duration: 0.8 });
  }, [target, map]);

  return null;
}

function AddStoreOnClick({ onAdd, isAdding, onFinish }) {
  useMapEvents({
    click(e) {
      if (!isAdding) return;
      onAdd(e.latlng);
      onFinish(); // モード解除
    },
  });

  return null;
}



/* =======================
   現在地ボタン
======================= */
function CurrentLocationButton({ position }) {
  const { useMap } = require("react-leaflet");
  const map = useMap();
  if (!position) return null;

  return (
    <button
      onClick={() => map.flyTo(position, 16, { animate: true })}
      style={{
        position: "absolute",
        bottom: 20,
        right: 20,
        zIndex: 1000,
        width: 48,
        height: 48,
        borderRadius: "50%",
        border: "none",
        background: "#2979ff",
        color: "#fff",
        fontSize: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        cursor: "pointer",
      }}
    >
      📍
    </button>
  );
}

/* =======================
   Main
======================= */
export default function MapPage() {
  const [stores, setStores] = useState([]);
  const [currentPos, setCurrentPos] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [jumpTarget, setJumpTarget] = useState(null);
  const [showList, setShowList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [notifyDistance, setNotifyDistance] = useState(DEFAULT_NOTIFY_DISTANCE);
  const [cooldownMin, setCooldownMin] = useState(DEFAULT_COOLDOWN_MIN);

  // storeId -> lastNotifyTime(ms)
  const notifiedRef = useRef({});

  const isCompletedStore = store =>
    store.items.length > 0 && store.items.every(i => i.done);

  /* localStorage 読み込み */
  useEffect(() => {
    const s = localStorage.getItem("stores");
    if (s) setStores(JSON.parse(s));

    const d = localStorage.getItem("notifyDistance");
    if (d) setNotifyDistance(Number(d));

    const c = localStorage.getItem("cooldownMin");
    if (c) setCooldownMin(Number(c));

    const n = localStorage.getItem("notifiedTimes");
    if (n) notifiedRef.current = JSON.parse(n);
  }, []);

  /* localStorage 保存 */
  useEffect(() => {
    localStorage.setItem("stores", JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem("notifyDistance", notifyDistance);
  }, [notifyDistance]);

  useEffect(() => {
    localStorage.setItem("cooldownMin", cooldownMin);
  }, [cooldownMin]);

  useEffect(() => {
    localStorage.setItem("notifiedTimes", JSON.stringify(notifiedRef.current));
  });

  /* 通知許可 */
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  /* GPS */
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(p => {
      setCurrentPos([p.coords.latitude, p.coords.longitude]);
    });
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  /* ===== 距離 + クールタイム通知 ===== */
  useEffect(() => {
    if (!currentPos) return;

    const now = Date.now();
    const cooldownMs = cooldownMin * 60 * 1000;

    stores.forEach(store => {
      if (isCompletedStore(store)) return;

      const last = notifiedRef.current[store.id];
      if (last && now - last < cooldownMs) return;

      const d = getDistance(
        currentPos[0],
        currentPos[1],
        store.lat,
        store.lng
      );

      if (d < notifyDistance && Notification.permission === "granted") {
        new Notification("🛒 買い物リマインド", {
          body:
            `${store.name}\n` +
            (store.memo ? `📝 ${store.memo}` : "未完了の商品があります"),
        });

        notifiedRef.current[store.id] = now;
      }
    });
  }, [currentPos, stores, notifyDistance, cooldownMin]);

  /* 店舗・商品操作（既存） */
  const addStore = latlng => {
    const name = prompt("店舗名");
    if (!name) return;
    setStores(s => [...s, {
      id: Date.now(),
      name,
      lat: latlng.lat,
      lng: latlng.lng,
      memo: "",
      items: [],
    }]);
  };

  const updateStore = (id, data) =>
    setStores(s => s.map(st => st.id === id ? { ...st, ...data } : st));

  const deleteStore = id => {
    if (!confirm("削除しますか？")) return;
    delete notifiedRef.current[id];
    setStores(s => s.filter(st => st.id !== id));
  };

  const toggleItem = (sid, index) =>
    setStores(s =>
      s.map(st =>
        st.id === sid
          ? {
              ...st,
              items: st.items.map((it, i) =>
                i === index ? { ...it, done: !it.done } : it
              ),
            }
          : st
      )
    );

  const addItem = sid => {
    const name = prompt("商品名");
    if (!name) return;
    setStores(s =>
      s.map(st =>
        st.id === sid
          ? { ...st, items: [...st.items, { name, done: false }] }
          : st
      )
    );
  };

  const deleteItem = (sid, index) =>
    setStores(s =>
      s.map(st =>
        st.id === sid
          ? { ...st, items: st.items.filter((_, i) => i !== index) }
          : st
      )
    );

  return (
    <>
      {/* Header */}
      <div style={{
        height: 52,
        background: "#2979ff",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
      }}>
        <b>買い忘れ防止アプリ『BuyMind』​</b>
        <button onClick={() => setShowSettings(true)} style={{ background: "none", border: "none", color: "#fff", fontSize: 20 }}>
          ⚙️
        </button>
      </div>

      {/* Map */}
      <div style={{ height: "calc(100vh - 52px)", position: "relative" }}>
        <MapContainer center={currentPos || [35.6812, 139.7671]} zoom={16} style={{ height: "100%" }}tap={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapJump target={jumpTarget} />
          <AddStoreOnClick
            onAdd={addStore}
            isAdding={isAdding}
            onFinish={() => setIsAdding(false)}
/>
          <CurrentLocationButton position={currentPos} />

          {stores.map(store => (
            <Marker key={store.id} position={[store.lat, store.lng]}>
              <Popup>
                <div style={{ width: 220 }}>
                  <input
                    value={store.name}
                    onChange={e => updateStore(store.id, { name: e.target.value })}
                    style={{ width: "100%", fontSize: 16 }}
                  />
                  <textarea
                    placeholder="📝 メモ"
                    value={store.memo}
                    onChange={e => updateStore(store.id, { memo: e.target.value })}
                    style={{ width: "100%", marginTop: 6 }}
                  />
                  {store.items.map((it, i) => (
                    <div key={i} style={{ display: "flex" }}>
                      <input type="checkbox" checked={it.done} onChange={() => toggleItem(store.id, i)} />
                      <span style={{ flex: 1 }}>{it.name}</span>
                      <button onClick={() => deleteItem(store.id, i)}>✕</button>
                    </div>
                  ))}
                  <button onClick={() => addItem(store.id)}>＋商品</button>
                  <button style={{ color: "red" }} onClick={() => deleteStore(store.id)}>削除</button>
                </div>
              </Popup>
            </Marker>
          ))}

          {currentPos && <CircleMarker center={currentPos} radius={8} />}

{/* 現在地表示（既存 + パルス追加） */}
{currentPos && (
  <>
    {/* パルス（追加） */}
    <CircleMarker
      center={currentPos}
      radius={32}
      pathOptions={{
        color: "#2979ff",
        fillColor: "#2979ff",
        fillOpacity: 0.4,
      }}
      className="current-location-pulse"
    />

    {/* 中心点（既存・そのまま） */}
    <CircleMarker
      center={currentPos}
      radius={8}
      pathOptions={{
        color: "#2979ff",
        fillColor: "#2979ff",
        fillOpacity: 1,
      }}
    />
  </>
)}

        </MapContainer>

        <button
          onClick={() => setShowList(true)}
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            zIndex: 1000,
            padding: "10px 14px",
            borderRadius: 20,
            border: "none",
            background: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          📋 店舗一覧
        </button>
        <button
  onClick={() => setIsAdding(!isAdding)}
  style={{
    position: "absolute",
    bottom: 80,
    right: 20,
    zIndex: 1000,
    width: 60,
    height: 60,
    borderRadius: "50%",
    border: "none",
    background: isAdding ? "#ff5252" : "#2979ff",
    color: "#fff",
    fontSize: 26,
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
    cursor: "pointer",
  }}
>
  {isAdding ? "×" : "＋"}
</button>
      </div>
{/* 店舗一覧ドロワー */}
{showList && (
  <div
    onClick={() => setShowList(false)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.3)",
      zIndex: 2500,
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: "60%",
        background: "#fff",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 12,
        overflowY: "auto",
      }}
    >
      <b>📋 店舗一覧</b>

      {stores.length === 0 && (
        <div style={{ marginTop: 12, color: "#666" }}>
          店舗がまだありません
        </div>
      )}

      {stores.map(st => (
        <div
          key={st.id}
          onClick={() => {
            setJumpTarget([st.lat, st.lng]);
            setShowList(false);
          }}
          style={{
            padding: 10,
            borderBottom: "1px solid #eee",
            cursor: "pointer",
            color: isCompletedStore(st) ? "#999" : "#000",
          }}
        >
          <b>{st.name}</b>
          <div style={{ fontSize: 12, marginTop: 2 }}>
            未完了：
            {st.items.filter(i => !i.done).length} 件
          </div>
        </div>
      ))}
    </div>
  </div>
)}

      {/* 設定ドロワー */}
      {showSettings && (
        <div onClick={() => setShowSettings(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 3000 }}>
          <div onClick={e => e.stopPropagation()} style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#fff",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 16,
          }}>
            <b>🔔 通知設定</b>

            <div style={{ marginTop: 12 }}>
              <div>通知距離：{notifyDistance}m</div>
              <input type="range" min="50" max="500" step="10"
                value={notifyDistance}
                onChange={e => setNotifyDistance(Number(e.target.value))}
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <div>再通知クールタイム：{cooldownMin}分</div>
              <input type="range" min="5" max="120" step="5"
                value={cooldownMin}
                onChange={e => setCooldownMin(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}