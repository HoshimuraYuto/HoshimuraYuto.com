import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const comments = sqliteTable("comments", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  post_id: text("post_id").notNull(),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  author_name: text("author_name").notNull(),
  content: text("content").notNull(),
});
