export function requestNotificationPermission(){
 if(!("Notification" in window)) return
 if(Notification.permission==="default"){
   Notification.requestPermission()
 }
}
export function sendNotification(title,body){
 if(Notification.permission==="granted"){
   new Notification(title,{body})
 }
}
export function vibrate(){
 if("vibrate" in navigator){
   navigator.vibrate([200,100,200])
 }
}