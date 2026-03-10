"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
let L = null;
if (typeof window !== "undefined") {
 L = require("leaflet");
}
if (typeof window !== "undefined" && L) {
 delete L.Icon.Default.prototype._getIconUrl;
 L.Icon.Default.mergeOptions({
   iconUrl: "/marker-icon.png",
   iconRetinaUrl: "/marker-icon-2x.png",
   shadowUrl: "/marker-shadow.png",
 });
}
const DEFAULT_NOTIFY_DISTANCE = 120;
const DEFAULT_COOLDOWN_MIN = 30;
/* =====================
距離計算
===================== */
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
/* =====================
react-leaflet dynamic
===================== */
const MapContainer = dynamic(
 () => import("react-leaflet").then(m => m.MapContainer),
 { ssr: false }
);
const TileLayer = dynamic(
 () => import("react-leaflet").then(m => m.TileLayer),
 { ssr: false }
);
const Marker = dynamic(
 () => import("react-leaflet").then(m => m.Marker),
 { ssr: false }
);
const Popup = dynamic(
 () => import("react-leaflet").then(m => m.Popup),
 { ssr: false }
);
const CircleMarker = dynamic(
 () => import("react-leaflet").then(m => m.CircleMarker),
 { ssr: false }
);
/* =====================
マーカー
===================== */
function getStoreIcon(completed) {
 if (!L) return null;
 return new L.DivIcon({
   className: "store-icon",
   html: completed ? "⚪" : "🔴",
   iconSize: [30, 30],
   iconAnchor: [15, 30],
 });
}
/* =====================
地図ジャンプ
===================== */
function MapJump({ target }) {
 const map = useMap();
 useEffect(() => {
   if (!target) return;
   map.flyTo(target, map.getZoom(), {
     animate: true,
     duration: 0.8,
   });
 }, [target, map]);
 return null;
}
/* =====================
カーソル
===================== */
function ChangeCursor({ isAdding }) {
 const map = useMap();
 useEffect(() => {
   const container = map.getContainer();
   container.style.cursor = isAdding ? "crosshair" : "";
 }, [isAdding, map]);
 return null;
}
/* =====================
店舗追加
===================== */
function AddStoreOnClick({ onAdd, isAdding, onFinish }) {
 useMapEvents({
   click(e) {
     if (!isAdding) return;
     onAdd(e.latlng);
     onFinish();
   },
 });
 return null;
}
/* =====================
現在地ボタン
===================== */
function CurrentLocationButton({ position }) {
 const map = useMap();
 if (!position) return null;
 return (
<button
     onClick={() =>
       map.flyTo(position, 16, { animate: true })
     }
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
/* =====================
メイン
===================== */
export default function MapPage() {
 const [stores, setStores] = useState([]);
 const [currentPos, setCurrentPos] = useState(null);
 const [isAdding, setIsAdding] = useState(false);
 const [jumpTarget, setJumpTarget] = useState(null);
 const [showList, setShowList] = useState(false);
 const [showSettings, setShowSettings] =
   useState(false);
 const [notifyDistance, setNotifyDistance] =
   useState(DEFAULT_NOTIFY_DISTANCE);
 const [cooldownMin, setCooldownMin] =
   useState(DEFAULT_COOLDOWN_MIN);
 const notifiedRef = useRef({});
 const isCompletedStore = store =>
   store.items.length > 0 &&
   store.items.every(i => i.done);
 /* =====================
localStorage 読み込み
===================== */
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
 /* =====================
保存
===================== */
 useEffect(() => {
   localStorage.setItem(
     "stores",
     JSON.stringify(stores)
   );
 }, [stores]);
 useEffect(() => {
   localStorage.setItem(
     "notifyDistance",
     notifyDistance
   );
 }, [notifyDistance]);
 useEffect(() => {
   localStorage.setItem(
     "cooldownMin",
     cooldownMin
   );
 }, [cooldownMin]);
 useEffect(() => {
   localStorage.setItem(
     "notifiedTimes",
     JSON.stringify(notifiedRef.current)
   );
 }, [stores]);
 /* =====================
通知許可
===================== */
 useEffect(() => {
   if (
     "Notification" in window &&
     Notification.permission === "default"
   ) {
     Notification.requestPermission();
   }
 }, []);
 /* =====================
GPS
===================== */
 useEffect(() => {
   if (!navigator.geolocation) return;
   const id = navigator.geolocation.watchPosition(
     p => {
       setCurrentPos([
         p.coords.latitude,
         p.coords.longitude,
       ]);
     }
   );
   return () =>
     navigator.geolocation.clearWatch(id);
 }, []);
 /* =====================
距離通知
===================== */
 useEffect(() => {
   if (!currentPos) return;
   const now = Date.now();
   const cooldownMs = cooldownMin * 60 * 1000;
   stores.forEach(store => {
     if (isCompletedStore(store)) return;
     const last =
       notifiedRef.current[store.id];
     if (last && now - last < cooldownMs)
       return;
     const d = getDistance(
       currentPos[0],
       currentPos[1],
       store.lat,
       store.lng
     );
     if (
       d < notifyDistance &&
       Notification.permission === "granted"
     ) {
       new Notification(
         "🛒 買い物リマインド",
         {
           body:
             store.name +
             "\n未完了の商品があります",
         }
       );
       if ("vibrate" in navigator) {
         navigator.vibrate([150, 80, 150]);
       }
       notifiedRef.current[store.id] = now;
     }
   });
 }, [
   currentPos,
   stores,
   notifyDistance,
   cooldownMin,
 ]);
 /* =====================
店舗追加
===================== */
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
       memo: "",
       items: [],
     },
   ]);
 };
 const updateStore = (id, data) =>
   setStores(s =>
     s.map(st =>
st.id === id
         ? { ...st, ...data }
         : st
     )
   );
 const deleteStore = id => {
   if (!confirm("削除しますか？")) return;
   setStores(s =>
     s.filter(st => st.id !== id)
   );
 };
 /* =====================
距離計算
===================== */
 const getDistanceText = store => {
   if (!currentPos) return "";
   const d = getDistance(
     currentPos[0],
     currentPos[1],
     store.lat,
     store.lng
   );
   return Math.round(d) + "m";
 };
 const sortedStores = [...stores].sort(
   (a, b) => {
     if (!currentPos) return 0;
     const da = getDistance(
       currentPos[0],
       currentPos[1],
       a.lat,
       a.lng
     );
     const db = getDistance(
       currentPos[0],
       currentPos[1],
       b.lat,
       b.lng
     );
     return da - db;
   }
 );
 return (
<>
     {/* header */}
<div
       style={{
         height: 52,
         background: "#2979ff",
         color: "#fff",
         display: "flex",
         alignItems: "center",
         justifyContent: "space-between",
         padding: "0 12px",
       }}
>
<b>BuyMind</b>
<button
         onClick={() =>
           setShowSettings(true)
         }
         style={{
           background: "none",
           border: "none",
           color: "#fff",
           fontSize: 20,
         }}
>
         ⚙️
</button>
</div>
     {/* map */}
<div
       style={{
         height: "calc(100vh - 52px)",
         position: "relative",
       }}
>
<MapContainer
         center={
           currentPos || [35.6812, 139.7671]
         }
         zoom={16}
         style={{
           width: "100%",
           height: "100%",
         }}
>
<TileLayer
           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
         />
<MapJump target={jumpTarget} />
<ChangeCursor isAdding={isAdding} />
<AddStoreOnClick
           onAdd={addStore}
           isAdding={isAdding}
           onFinish={() =>
             setIsAdding(false)
           }
         />
<CurrentLocationButton
           position={currentPos}
         />
         {stores.map(store => (
<Marker
             key={store.id}
             position={[
               store.lat,
               store.lng,
             ]}
             icon={getStoreIcon(
               isCompletedStore(store)
             )}
>
<Popup>
<b>{store.name}</b>
</Popup>
</Marker>
         ))}
         {currentPos && (
<CircleMarker
             center={currentPos}
             radius={8}
           />
         )}
</MapContainer>
       {/* 店舗一覧ボタン */}
<button
         onClick={() =>
           setShowList(true)
         }
         style={{
           position: "fixed",
           bottom: 20,
           left: 20,
           padding: "10px 14px",
           borderRadius: 20,
           border: "none",
           background: "#fff",
           boxShadow:
             "0 2px 6px rgba(0,0,0,0.3)",
         }}
>
         📋 店舗一覧
</button>
</div>
     {/* 店舗一覧 */}
     {showList && (
<div
         onClick={() =>
           setShowList(false)
         }
         style={{
           position: "fixed",
           inset: 0,
           background:
             "rgba(0,0,0,0.3)",
         }}
>
<div
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
           {sortedStores.map(st => (
<div
               key={st.id}
               onClick={() => {
                 setJumpTarget([
                   st.lat,
                   st.lng,
                 ]);
                 setShowList(false);
               }}
               style={{
                 padding: 10,
                 borderBottom:
                   "1px solid #eee",
               }}
>
<b>{st.name}</b>
<div
                 style={{
                   fontSize: 12,
                   color: "#666",
                 }}
>
                 距離：
                 {getDistanceText(st)}
</div>
</div>
           ))}
</div>
</div>
     )}
</>
 );
}