export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        {/* PWA設定 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2979ff" />

        {/* iPhone用 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="買い物メモMAP" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
