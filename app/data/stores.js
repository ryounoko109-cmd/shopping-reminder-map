import { STORE_TYPES } from "../constants/storeTypes";

export const stores = [
  {
   id: 1,
    name: "スーパーA",
    lat: 35.6814,
    lng: 139.767,
    items: ["牛乳", "卵"],
    radius: 100,
  },
  {
    id: 2,
    name: "△△コンビニ",
    type: STORE_TYPES.CONVENIENCE,
    position: [35.6825, 139.768],
    items: ["おにぎり"],
  },
  {
   id: 2,
    name: "ドラッグストアB",
    lat: 35.6809,
    lng: 139.768,
    items: ["マスク"],
    radius: 200,
  },
];
