import { KVNamespace } from "@cloudflare/workers-types";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { cors } from "hono/cors";
import xss from "xss";

import { comments } from "./schema";

type Bindings = {
  kv_test: KVNamespace;
  DB: D1Database;
};

type Comment = {
  post: string;
  author_name: string;
  content: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  cors({
    origin: [
      "http://localhost:50430",
      ".hoshimurayuto.pages.dev",
      "https://hoshimurayuto.com",
    ],
    allowHeaders: ["Content-Type"],
    allowMethods: ["POST", "GET", "OPTIONS"],
  }),
);

app.get("/comments", async (c) => {
  const postId = c.req.query("post") ?? "";
  try {
    const db = drizzle(c.env.DB);
    const result = await db
      .select()
      .from(comments)
      .where(eq(comments.post_id, postId))
      .execute();

    return c.json(result);
  } catch (error) {
    return c.json({ error: "Failed to retrieve comments" }, 500);
  }
});

app.post("/comments", async (c) => {
  try {
    const { post: postId, ...commentData }: Comment = await c.req.json();

    const db = drizzle(c.env.DB);

    await db.insert(comments).values({
      post_id: postId,
      author_name: xss(commentData.author_name),
      content: xss(commentData.content),
    });

    return c.text("Comment posted successfully");
  } catch (error) {
    return c.json({ error: "Failed to post comment" }, 500);
  }
});

export default app;
