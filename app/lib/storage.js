export function loadStores(){
 if(typeof window==="undefined") return []
 const data = localStorage.getItem("stores")
 if(!data) return []
 return JSON.parse(data)
}
export function saveStores(stores){
 localStorage.setItem(
   "stores",
   JSON.stringify(stores)
 )
}
export function loadSetting(key,def){
 if(typeof window==="undefined") return def
 const v = localStorage.getItem(key)
 if(!v) return def
 return Number(v)
}
export function saveSetting(key,val){
 localStorage.setItem(key,val)
}