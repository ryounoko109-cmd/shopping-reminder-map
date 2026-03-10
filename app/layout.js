"use client";
<link rel="manifest" href="/manifest.json" />
import { useEffect } from "react";
export default function RootLayout({ children }) {
 useEffect(() => {
   if ("serviceWorker" in navigator) {
     navigator.serviceWorker
       .register("/sw.js")
       .then(() => console.log("SW registered"));
   }
 }, []);
 return (
<html>
<body>
       {children}
</body>
</html>
 );
}

export const metadata = {
 title: "BuyMind",
 description: "位置連動買い物リマインダー"
}
export default function RootLayout({ children }) {
 return (
<html lang="ja">
<body style={{
       margin:0,
       fontFamily:"sans-serif",
       background:"#f4f6fb"
     }}>
       {children}
</body>
</html>
 )
}