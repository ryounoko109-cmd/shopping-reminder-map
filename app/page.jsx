"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
/* marker fix */
if (typeof window !== "undefined") {
 delete L.Icon.Default.prototype._getIconUrl;
 L.Icon.Default.mergeOptions({
   iconUrl: "/marker-icon.png",
   iconRetinaUrl: "/marker-icon-2x.png",
   shadowUrl: "/marker-shadow.png",
 });
}
const storeIcon = new L.DivIcon({
 className: "store-icon",
 html: "🛒",
 iconSize: [30, 30],
 iconAnchor: [15, 30],
});
/* leaflet dynamic */
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr:false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr:false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr:false });
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr:false });
const CircleMarker = dynamic(() => import("react-leaflet").then(m => m.CircleMarker), { ssr:false });
/* 距離計算 */
function getDistance(lat1,lng1,lat2,lng2){
const R=6371000
const dLat=(lat2-lat1)*Math.PI/180
const dLng=(lng2-lng1)*Math.PI/180
const a=
Math.sin(dLat/2)**2+
Math.cos(lat1*Math.PI/180)*
Math.cos(lat2*Math.PI/180)*
Math.sin(dLng/2)**2
return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}
/* 地図タップで店舗追加 */
function AddStoreOnClick({onAdd,isAdding,onFinish}){
useMapEvents({
 click(e){
  if(!isAdding)return
  onAdd(e.latlng)
  onFinish()
 }
})
return null
}
export default function MapPage(){
const [stores,setStores]=useState([])
const [currentPos,setCurrentPos]=useState(null)
const [isAdding,setIsAdding]=useState(false)
const [showList,setShowList]=useState(false)
const [jumpTarget,setJumpTarget]=useState(null)
const notifyDistance=120
const notifiedRef=useRef({})
/* 保存読み込み */
useEffect(()=>{
 const s=localStorage.getItem("stores")
 if(s)setStores(JSON.parse(s))
},[])
useEffect(()=>{
 localStorage.setItem("stores",JSON.stringify(stores))
},[stores])
/* 通知許可 */
useEffect(()=>{
 if("Notification"in window && Notification.permission==="default"){
  Notification.requestPermission()
 }
},[])
/* GPS */
useEffect(()=>{
 if(!navigator.geolocation)return
 const id=navigator.geolocation.watchPosition(p=>{
  setCurrentPos([p.coords.latitude,p.coords.longitude])
 })
 return ()=>navigator.geolocation.clearWatch(id)
},[])
/* 近づいた通知 */
useEffect(()=>{
 if(!currentPos)return
 stores.forEach(store=>{
  const d=getDistance(
   currentPos[0],
   currentPos[1],
   store.lat,
   store.lng
  )
  if(d<notifyDistance){
   const last=notifiedRef.current[store.id]
   if(last && Date.now()-last<1800000)return
   if(Notification.permission==="granted"){
    new Notification("🛒 買い物リマインド",{
     body:store.name+"の買い物があります"
    })
    if("vibrate"in navigator){
     navigator.vibrate([200,100,200])
    }
    notifiedRef.current[store.id]=Date.now()
   }
  }
 })
},[currentPos,stores])
/* 店舗追加 */
const addStore=(latlng)=>{
 const name=prompt("店舗名")
 if(!name)return
 setStores(s=>[
  ...s,
  {
   id:Date.now(),
   name,
   lat:latlng.lat,
   lng:latlng.lng,
   memo:"",
   items:[]
  }
 ])
}
/* 商品追加 */
const addItem=(sid)=>{
 const name=prompt("商品名")
 if(!name)return
 setStores(s=>
  s.map(st=>
   st.id===sid
    ?{...st,items:[...st.items,{name,done:false}]}
    :st
  )
 )
}
const toggleItem=(sid,i)=>{
 setStores(s=>
  s.map(st=>
   st.id===sid
    ?{
      ...st,
      items:st.items.map((it,index)=>
       index===i
       ?{...it,done:!it.done}
       :it
      )
     }
    :st
  )
 )
}
return(
<>
{/* header */}
<div style={{
height:52,
background:"#2979ff",
color:"#fff",
display:"flex",
alignItems:"center",
padding:"0 12px"
}}>
BuyMind
</div>
{/* map */}
<div style={{
height:"calc(100vh - 52px)",
position:"relative"
}}>
<MapContainer
center={currentPos || [35.6812,139.7671]}
zoom={16}
tap={false}
style={{position:"absolute",inset:0}}
>
<TileLayer
url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>
<AddStoreOnClick
onAdd={addStore}
isAdding={isAdding}
onFinish={()=>setIsAdding(false)}
/>
{stores.map(store=>(
<Marker
key={store.id}
position={[store.lat,store.lng]}
icon={storeIcon}
>
<Popup>
<div style={{width:220}}>
<b>{store.name}</b>
{store.items.map((it,i)=>(
<div key={i} style={{display:"flex"}}>
<input
type="checkbox"
checked={it.done}
onChange={()=>toggleItem(store.id,i)}
/>
<span style={{flex:1}}>
{it.name}
</span>
</div>
))}
<button onClick={()=>addItem(store.id)}>
＋商品
</button>
</div>
</Popup>
</Marker>
))}
{currentPos && (
<CircleMarker center={currentPos} radius={8}/>
)}
</MapContainer>
{/* 店舗一覧ボタン */}
<button
onClick={()=>setShowList(true)}
style={{
position:"fixed",
bottom:20,
left:20,
zIndex:9999,
padding:"12px 16px",
borderRadius:20,
border:"none",
background:"#fff"
}}
>
📋 店舗一覧
</button>
{/* 追加ボタン */}
<button
onClick={()=>setIsAdding(!isAdding)}
style={{
position:"fixed",
bottom:20,
right:20,
width:60,
height:60,
borderRadius:"50%",
border:"none",
background:"#2979ff",
color:"#fff",
fontSize:28,
zIndex:9999
}}
>
＋
</button>
</div>
{/* 店舗一覧 */}
{showList && (
<div
onClick={()=>setShowList(false)}
style={{
position:"fixed",
inset:0,
background:"rgba(0,0,0,0.3)",
zIndex:10000
}}
>
<div
onClick={e=>e.stopPropagation()}
style={{
position:"absolute",
bottom:0,
left:0,
right:0,
background:"#fff",
borderTopLeftRadius:16,
borderTopRightRadius:16,
padding:16,
maxHeight:"60%",
overflowY:"auto"
}}
>
<b>店舗一覧</b>
{stores.map(st=>(
<div
key={st.id}
onClick={()=>{
setJumpTarget([st.lat,st.lng])
setShowList(false)
}}
style={{
padding:10,
borderBottom:"1px solid #eee"
}}
>
{st.name}
</div>
))}
</div>
</div>
)}
</>
)
}