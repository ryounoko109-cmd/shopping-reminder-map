"use client"
import {useEffect,useState,useRef} from "react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"
let L
if(typeof window!=="undefined"){
 L=require("leaflet")
}
const MapContainer=dynamic(()=>import("react-leaflet").then(m=>m.MapContainer),{ssr:false})
const TileLayer=dynamic(()=>import("react-leaflet").then(m=>m.TileLayer),{ssr:false})
const Marker=dynamic(()=>import("react-leaflet").then(m=>m.Marker),{ssr:false})
const Popup=dynamic(()=>import("react-leaflet").then(m=>m.Popup),{ssr:false})
const useMapEvents=dynamic(()=>import("react-leaflet").then(m=>m.useMapEvents),{ssr:false})
export default function Page(){
const [stores,setStores]=useState([])
const [pos,setPos]=useState(null)
const [showList,setShowList]=useState(false)
const notifyDistance=120
const notifiedRef=useRef({})
function getDistance(lat1,lng1,lat2,lng2){
const R=6371000
const dLat=(lat2-lat1)*Math.PI/180
const dLng=(lng2-lng1)*Math.PI/180
const a=
Math.sin(dLat/2)**2+
Math.cos(lat1*Math.PI/180)*
Math.cos(lat2*Math.PI/180)*
Math.sin(dLng/2)**2
const c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
return R*c
}
useEffect(()=>{
const s=localStorage.getItem("stores")
if(s){
setStores(JSON.parse(s))
}
if("Notification"in window){
Notification.requestPermission()
}
},[])
useEffect(()=>{
localStorage.setItem("stores",JSON.stringify(stores))
},[stores])
useEffect(()=>{
if(!navigator.geolocation)return
const id=navigator.geolocation.watchPosition(p=>{
setPos([p.coords.latitude,p.coords.longitude])
})
return()=>navigator.geolocation.clearWatch(id)
},[])
useEffect(()=>{
if(!pos)return
stores.forEach(st=>{
const d=getDistance(pos[0],pos[1],st.lat,st.lng)
if(d<notifyDistance){
if(!notifiedRef.current[st.id]){
const items=st.items
.filter(i=>!i.done)
.map(i=>i.name)
.slice(0,4)
.join("・")
if(Notification.permission==="granted"){
new Notification("🛒"+st.name,{
body:items||"買い物があります"
})
}
notifiedRef.current[st.id]=true
}
}
})
},[pos,stores])
function MapClick(){
useMapEvents({
click(e){
const name=prompt("店舗名")
if(!name)return
const newStore={
id:Date.now(),
name,
lat:e.latlng.lat,
lng:e.latlng.lng,
items:[]
}
setStores([...stores,newStore])
}
})
return null
}
function addItem(id){
const name=prompt("商品名")
if(!name)return
setStores(stores.map(s=>{
if(s.id!==id)return s
return{
...s,
items:[...s.items,{name,done:false}]
}
}))
}
function toggleItem(storeId,index){
setStores(stores.map(s=>{
if(s.id!==storeId)return s
return{
...s,
items:s.items.map((it,i)=>{
if(i!==index)return it
return{...it,done:!it.done}
})
}
}))
}
function deleteStore(id){
setStores(stores.filter(s=>s.id!==id))
}
return(
<div style={{height:"100vh",position:"relative"}}>
<MapContainer
center={pos||[34.6937,135.5023]}
zoom={15}
style={{height:"100%"}}
>
<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
<MapClick/>
{stores.map(st=>(
<Marker
key={st.id}
position={[st.lat,st.lng]}
>
<Popup>
<div style={{width:200}}>
<input
value={st.name}
onChange={e=>{
setStores(stores.map(s=>{
if(s.id!==st.id)return s
return{...s,name:e.target.value}
}))
}}
style={{width:"100%"}}
/>
<div style={{marginTop:5}}>
{st.items.map((it,i)=>(
<div key={i} style={{display:"flex"}}>
<input
type="checkbox"
checked={it.done}
onChange={()=>toggleItem(st.id,i)}
/>
<span style={{
textDecoration:it.done?"line-through":"none",
flex:1
}}>
{it.name}
</span>
</div>
))}
</div>
<button
onClick={()=>addItem(st.id)}
style={{marginTop:5}}
>
＋商品
</button>
<button
onClick={()=>deleteStore(st.id)}
style={{color:"red",marginLeft:10}}
>
削除
</button>
</div>
</Popup>
</Marker>
))}
</MapContainer>
<button
onClick={()=>setShowList(true)}
style={{
position:"absolute",
left:15,
bottom:15,
zIndex:1000,
padding:"10px 14px",
background:"#2979ff",
color:"#fff",
border:"none",
borderRadius:8
}}
>
店舗一覧
</button>
{showList&&(
<div
onClick={()=>setShowList(false)}
style={{
position:"absolute",
inset:0,
background:"rgba(0,0,0,0.3)"
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
maxHeight:"60%",
overflow:"auto",
padding:15
}}
>
<h3>店舗一覧</h3>
{stores.map(st=>(
<div
key={st.id}
style={{
borderBottom:"1px solid #eee",
padding:10
}}
>
<b>{st.name}</b>
{pos&&(
<div style={{fontSize:12}}>
距離:
{Math.round(
getDistance(
pos[0],
pos[1],
st.lat,
st.lng
)
)}m
</div>
)}
</div>
))}
</div>
</div>
)}
</div>
)
}