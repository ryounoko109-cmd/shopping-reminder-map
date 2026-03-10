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