// app/layout.jsx

export const metadata = {
  title: "買い物忘れ防止アプリ",
  description: "近くの店舗で買い物忘れを防ぐPWAアプリ",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
