import { neon, Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleWebSocket } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

let database: ReturnType<typeof drizzleHttp<typeof schema>> | undefined;
let transactionDatabase: ReturnType<typeof drizzleWebSocket<typeof schema>> | undefined;
let pool: Pool | undefined;

export function getDb() {
  if (database) return database;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");

  database = drizzleHttp({ client: neon(databaseUrl), schema });
  return database;
}

export function getTransactionalDb() {
  if (transactionDatabase) return transactionDatabase;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");

  if (!pool) {
    if (typeof WebSocket !== "undefined") neonConfig.webSocketConstructor ??= WebSocket;
    pool = new Pool({ connectionString: databaseUrl });
  }
  transactionDatabase = drizzleWebSocket({ client: pool, schema });
  return transactionDatabase;
}
