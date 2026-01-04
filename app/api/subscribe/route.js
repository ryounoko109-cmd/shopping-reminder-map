import { subscriptions } from "@/app/lib/subscriptions";

export async function POST(req) {
  const sub = await req.json();
  subscriptions.push(sub);
  return Response.json({ ok: true });
}
