"use client";

import { useState, useEffect } from "react";

export default function MemoPage() {
  const [text, setText] = useState("");

  // 初回読み込み時に保存データを取得
  useEffect(() => {
    const saved = localStorage.getItem("memo");
    if (saved) {
      setText(saved);
    }
  }, []);

  // 保存ボタン
  const saveMemo = () => {
    localStorage.setItem("memo", text);
    alert("保存しました");
  };

  return (
    <main>
      <h1>メモ</h1>

      <input
        type="text"
        placeholder="ここにメモを入力"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <br />
      <button onClick={saveMemo}>保存</button>

      <p>現在のメモ：{text}</p>
    </main>
  );
}

