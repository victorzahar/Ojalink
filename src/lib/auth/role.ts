import { pgEnum } from "drizzle-orm/pg-core";

export const userRoles = ["buyer", "vendor", "rider", "admin"] as const;

export const userRoleEnum = pgEnum("user_role", userRoles);
