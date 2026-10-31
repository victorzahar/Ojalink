import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

/** TEMPORARY: use the seeded buyer until buyer authentication is ready. */
export async function getCurrentBuyer() {
  const [buyer] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, "buyer@ojalink.test"))
    .limit(1);

  if (!buyer || buyer.role !== "buyer") {
    throw new Error("The seeded buyer account buyer@ojalink.test was not found.");
  }

  return buyer;
}
