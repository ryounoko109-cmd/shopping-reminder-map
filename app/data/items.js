// app/data/items.js
export const items = [
  {
    id: "item-001",
    name: "牛乳",
    checked: false,
    category: "食品",
    storeIds: ["store-001"],
    createdAt: new Date().toISOString()
  },
  {
    id: "item-002",
    name: "電池",
    checked: false,
    category: "日用品",
    storeIds: ["store-002"],
    createdAt: new Date().toISOString()
  }
];
