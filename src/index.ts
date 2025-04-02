import { Hono } from "hono";
import streamRoute from "./routes/stream";
import { cors } from "hono/cors";
import { contextStorage } from "hono/context-storage";
import { cache } from "hono/cache";
import { timing } from "hono/timing";
import catalogRoute from "./routes/catalog";

export const manifest = {
  version: "0.0.1",
  id: "com.slmn.addon",
  name: "Torrent Thing",
  description: "Powerful featurepack bs",
  logo: "https://www.stremio.com/website/stremio-logo-small.png",
  resources: ["stream", "catalog"],
  catalogs: [
    {
      type: "movie",
      id: "wishlist-movies",
      name: "IMDB Wishlist"
    },
    {
      type: "series",
      id: "wishlist-series",
      name: "IMDB Wishlist"
    },
  ],
  types: ["movie", "series"],
} as const;

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(contextStorage());
app.use(
  cache({
    cacheName: "stremio-cache",
    cacheControl: "max-age=3600",
  }),
);
app.use(timing());
app.use(
  cors({
    origin: "*",
  }),
);

app.get(
  "/manifest.json",
  cache({
    cacheName: "stremio-manifest",
    cacheControl: "max-age=360000",
  }),
  (c) => {
    return c.json(manifest);
  },
);

app.route("/stream", streamRoute);
app.route("/catalog", catalogRoute);

export default app;
