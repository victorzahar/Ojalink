import { releaseExpiredStockReservations } from "@/lib/checkout/reservation-cleanup";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const releasedCount = await releaseExpiredStockReservations();
    return Response.json({ releasedCount });
  } catch {
    return Response.json({ error: "Reservation cleanup failed." }, { status: 500 });
  }
}
