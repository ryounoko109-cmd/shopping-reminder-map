"use client";
import { useEffect } from "react";
export default function RootLayout({ children }) {
 useEffect(() => {
   if ("serviceWorker" in navigator) {
     navigator.serviceWorker
       .register("/sw.js")
       .then(() => console.log("Service Worker registered"))
       .catch(err => console.log("SW error", err));
   }
 }, []);
 return (
<html lang="ja">
<head>
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#2979ff" />
</head>
<body>
       {children}
</body>
</html>
 );
}