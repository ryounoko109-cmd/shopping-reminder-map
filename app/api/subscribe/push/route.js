import webpush from "web-push";
import { subscriptions } from "../subscribe/route";

webpush.setVapidDetails(
  "mailto:test@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(req) {
  const { title, body } = await req.json();

  await Promise.all(
    subscriptions.map(sub =>
      webpush.sendNotification(
        sub,
        JSON.stringify({ title, body })
      )
    )
  );

  return Response.json({ ok: true });
}
