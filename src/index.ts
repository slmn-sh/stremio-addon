import { Hono } from "hono";
import streamRoute from "./routes/stream";
import { cors } from "hono/cors";
import { contextStorage } from "hono/context-storage";
import { cache } from "hono/cache";

export const manifest = {
  version: "0.0.1",
  id: "com.slmn.addon",
  name: "Torrent Thing",
  description: "Powerful featurepack bs",
  logo: "https://www.stremio.com/website/stremio-logo-small.png",
  resources: ["stream"],
  catalogs: [],
  types: ["movie", "series"],
} as const;

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(contextStorage());
// app.use(
//   cache({
//     cacheName: "stremio-cache",
//     cacheControl: "max-age=36000"
//   }),
// );
app.use(
  cors({
    origin: "*",
  }),
);

app.get("/manifest.json", (c) => {
  return c.json(manifest);
});

app.route("/stream", streamRoute);

export default app;
