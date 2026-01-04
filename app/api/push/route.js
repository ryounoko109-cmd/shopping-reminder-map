import webpush from "web-push";
import { subscriptions } from "@/app/lib/subscriptions";

export async function POST() {
  webpush.setVapidDetails(
    "mailto:test@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  await Promise.all(
    subscriptions.map(sub =>
      webpush.sendNotification(
        sub,
        JSON.stringify({
          title: "🛒 買い物リマインダー",
          body: "近くに買い物予定の店舗があります"
        })
      )
    )
  );

  return Response.json({ ok: true });
}
