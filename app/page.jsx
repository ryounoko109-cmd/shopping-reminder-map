"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
let L = null;
if (typeof window !== "undefined") {
 L = require("leaflet");
}
/* アイコン修正 */
if (typeof window !== "undefined" && L) {
 delete L.Icon.Default.prototype._getIconUrl;
 L.Icon.Default.mergeOptions({
   iconUrl: "/marker-icon.png",
   iconRetinaUrl: "/marker-icon-2x.png",
   shadowUrl: "/marker-shadow.png",
 });
}
/* =======================
マーカー生成
======================= */
function getStoreIcon(store) {
 if (!L) return null;
 const hasTodo = store.items.some(i => !i.done);
 return new L.DivIcon({
   html: `
<div style="
     background:${hasTodo ? "#ff5252" : "#aaa"};
     color:white;
     width:34px;
     height:34px;
     border-radius:50%;
     display:flex;
     align-items:center;
     justify-content:center;
     font-size:18px;
     box-shadow:0 2px 6px rgba(0,0,0,0.4);
     border:2px solid white;
   ">
     🛒
</div>
   `,
   iconSize: [34, 34],
   iconAnchor: [17, 34],
 });
}
/* =======================
react-leaflet dynamic
======================= */
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
/* =======================
設定
======================= */
const DEFAULT_NOTIFY_DISTANCE = 120;
const DEFAULT_COOLDOWN_MIN = 30;
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
 const map = useMap();
 useEffect(() => {
   if (!target) return;
   map.flyTo(target, map.getZoom(), {
     animate: true,
     duration: 0.8,
   });
 }, [target]);
 return null;
}
/* =======================
店舗追加
======================= */
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
/* =======================
現在地ボタン
======================= */
function CurrentLocationButton({ position }) {
 const map = useMap();
 if (!position) return null;
 return (
<button
     onClick={() => map.flyTo(position, 16)}
     style={{
       position: "absolute",
       bottom: 20,
       right: 20,
       width: 48,
       height: 48,
       borderRadius: "50%",
       border: "none",
       background: "#2979ff",
       color: "#fff",
       fontSize: 20,
       boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
       zIndex: 1000,
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
 const [notifyDistance, setNotifyDistance] = useState(
   DEFAULT_NOTIFY_DISTANCE
 );
 const [cooldownMin, setCooldownMin] = useState(
   DEFAULT_COOLDOWN_MIN
 );
 const notifiedRef = useRef({});
 /* =======================
保存
======================= */
 useEffect(() => {
   const s = localStorage.getItem("stores");
   if (s) setStores(JSON.parse(s));
 }, []);
 useEffect(() => {
   localStorage.setItem("stores", JSON.stringify(stores));
 }, [stores]);
 /* =======================
GPS
======================= */
 useEffect(() => {
   if (!navigator.geolocation) return;
   const id = navigator.geolocation.watchPosition(p => {
     setCurrentPos([
       p.coords.latitude,
       p.coords.longitude,
     ]);
   });
   return () => navigator.geolocation.clearWatch(id);
 }, []);
 /* =======================
通知
======================= */
 useEffect(() => {
   if (!currentPos) return;
   const now = Date.now();
   const cooldownMs = cooldownMin * 60000;
   stores.forEach(store => {
     const last = notifiedRef.current[store.id];
     if (last && now - last < cooldownMs) return;
     const d = getDistance(
       currentPos[0],
       currentPos[1],
       store.lat,
       store.lng
     );
     if (d < notifyDistance && Notification.permission === "granted") {
       const items = store.items
         .filter(i => !i.done)
         .map(i => i.name)
         .slice(0, 4)
         .join("・");
       new Notification("🛒 " + store.name, {
         body: items || "未完了の商品があります",
       });
       notifiedRef.current[store.id] = now;
     }
     if (d > notifyDistance * 2) {
       delete notifiedRef.current[store.id];
     }
   });
 }, [currentPos, stores]);
 /* =======================
店舗操作
======================= */
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
         ? {
             ...st,
             items: [...st.items, { name, done: false }],
           }
         : st
     )
   );
 };
 /* =======================
距離順
======================= */
 const sortedStores = [...stores].sort((a, b) => {
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
 });
 /* =======================
UI
======================= */
 return (
<>
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
<button onClick={() => setShowList(true)}>
         📋
</button>
</div>
<div
       style={{
         height: "calc(100vh - 52px)",
         position: "relative",
       }}
>
<MapContainer
         center={currentPos || [35.6812, 139.7671]}
         zoom={16}
         style={{
           width: "100%",
           height: "100%",
         }}
>
<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
<MapJump target={jumpTarget} />
<AddStoreOnClick
           onAdd={addStore}
           isAdding={isAdding}
           onFinish={() => setIsAdding(false)}
         />
<CurrentLocationButton position={currentPos} />
         {stores.map(store => (
<Marker
             key={store.id}
             position={[store.lat, store.lng]}
             icon={getStoreIcon(store)}
>
<Popup>
<b>{store.name}</b>
               {store.items.map((it, i) => (
<div key={i}>
<input
                     type="checkbox"
                     checked={it.done}
                     onChange={() =>
                       toggleItem(store.id, i)
                     }
                   />
                   {it.name}
</div>
               ))}
<button
                 onClick={() => addItem(store.id)}
>
                 ＋商品
</button>
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
<button
         onClick={() => setIsAdding(!isAdding)}
         style={{
           position: "fixed",
           bottom: 100,
           right: 20,
           width: 60,
           height: 60,
           borderRadius: "50%",
           border: "none",
           background: "#2979ff",
           color: "#fff",
           fontSize: 26,
         }}
>
         ＋
</button>
</div>
     {showList && (
<div
         style={{
           position: "fixed",
           inset: 0,
           background: "rgba(0,0,0,0.3)",
         }}
         onClick={() => setShowList(false)}
>
<div
           style={{
             position: "absolute",
             bottom: 0,
             left: 0,
             right: 0,
             background: "#fff",
             maxHeight: "60%",
             overflow: "auto",
             padding: 12,
           }}
>
<b>店舗一覧</b>
           {sortedStores.map(st => (
<div
               key={st.id}
               onClick={() => {
                 setJumpTarget([st.lat, st.lng]);
                 setShowList(false);
               }}
               style={{
                 padding: 10,
                 borderBottom: "1px solid #eee",
               }}
>
<b>{st.name}</b>
               {currentPos && (
<div style={{ fontSize: 12 }}>
                   {Math.round(
                     getDistance(
                       currentPos[0],
                       currentPos[1],
                       st.lat,
                       st.lng
                     )
                   )}{" "}
                   m
</div>
               )}
</div>
           ))}
</div>
</div>
     )}
</>
 );
}