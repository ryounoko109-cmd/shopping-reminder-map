import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>はじめてのNext.jsアプリ</h1>
      <p>トップページです</p>

      <Link href="/memo">メモ画面へ</Link>
    </main>
  );
}
