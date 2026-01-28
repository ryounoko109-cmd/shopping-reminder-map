"use client";

export default function StoreList({ stores }) {
  return (
    <div style={{
      position:"absolute",
      top:10,
      left:10,
      zIndex:1000,
      background:"#fff",
      padding:10,
      borderRadius:8,
      maxWidth:200
    }}>
      <b>登録店舗</b>
      <ul>
        {stores.map(s => (
          <li key={s.id}>{s.name}</li>
        ))}
      </ul>
    </div>
  );
}
