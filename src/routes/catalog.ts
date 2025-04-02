import { Hono, type TypedResponse } from "hono";
import type { CatalogObject } from "../types/catalog"
import { getImdbList } from "../libs/imdb";

const catalogRoute = new Hono<{ Bindings: CloudflareBindings }>();

catalogRoute.get(
  "/movie/wishlist-movies.json",
  async (c): Promise<TypedResponse<{ metas: CatalogObject[] }>> => {
    const url = "https://m.imdb.com/user/ur81129100/watchlist"
    const catalog = await getImdbList(url, "movie")
    return c.json({
      metas: catalog
    })
  },
);

catalogRoute.get(
  "/series/wishlist-series.json",
  async (c): Promise<TypedResponse<{ metas: CatalogObject[] }>> => {
    const url = "https://m.imdb.com/user/ur81129100/watchlist"
    const catalog = await getImdbList(url, "series")
    return c.json({
      metas: catalog
    })
  },
);

export default catalogRoute
