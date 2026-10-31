import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  schemaFilter: ["public"],
  migrations: {
    schema: "public",
  },
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
