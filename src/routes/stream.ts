import { Hono, type TypedResponse } from "hono";
import getImdb from "../libs/imdb";
import get1337x from "../libs/1337x";
import getPirateBay from "../libs/thePiratesBay";
import getYts from "../libs/yts";
import type { StreamObject } from "../types/stream";
import xbytes from "xbytes";
import { filterTorrents, sortTorrents } from "../utils/torrent";
import getEZTV from "../libs/eztv";

const streamRoute = new Hono<{ Bindings: CloudflareBindings }>();

// http://localhost:8787/stream/movie/tt17526714
streamRoute.get(
  "/movie/:resource",
  async (c): Promise<TypedResponse<{ streams: StreamObject[] }>> => {
    const { resource: imdb } = c.req.param();
    const { errors, data } = await getImdb(imdb.replace(".json", ""));
    if (errors) {
      return c.json(errors as any);
    }
    const [_1337x, piratesBay, yts] = await Promise.all([
      // get1337x({
      //   title: data.title.primary_title,
      //   year: data.title.start_year,
      //   quality: ["2160p", "1080p"],
      //   type: "movie",
      // }),
      Promise.resolve([] as any[]),
      getPirateBay({
        title: data.title.primary_title,
        year: data.title.start_year,
        quality: ["2160p", "1080p"],
        type: "movie",
      }),
      getYts({
        title: data.title.primary_title,
        year: data.title.start_year,
        quality: ["2160p", "1080p"],
        type: "movie",
      }),
    ]);

    const list = filterTorrents(
      _1337x.concat(piratesBay).concat(yts).sort(sortTorrents),
    );
    return c.json({
      streams: list.map((l) => ({
        infoHash: l.infoHash!,
        name: l.quality + (l.isHDR ? " HDR" : ""),
        description: `${l.provider}${l.seeders ? `\r\n🌱: ${l.seeders}` : ""}\r\n${xbytes(l.size ?? 0)}`,
        behaviorHints: {
          filename: l.name,
          videoSize: l.size,
          bingeGroup: l.uploader + "-" + l.quality + "-" + String(l.isHDR),
        },
      })),
    });
  },
);

// http://localhost:8787/stream/series/tt0312172:1:1
streamRoute.get(
  "/series/:resource",
  async (c): Promise<TypedResponse<{ streams: StreamObject[] }>> => {
    const { resource } = c.req.param();
    let [imdb, season, episode] = resource.split(":");
    const { errors, data } = await getImdb(imdb);
    if (errors) {
      return c.json(errors as any);
    }
    episode = episode.replace(".json", "");

    const [_1337x, piratesBay, eztv] = await Promise.all([
      // get1337x({
      //   title: data.title.primary_title,
      //   year: data.title.start_year,
      //   quality: ["2160p", "1080p"],
      //   type: "tvSeries",
      //   season,
      //   episode,
      // }),
      Promise.resolve([] as any[]),
      getPirateBay({
        title: data.title.primary_title,
        year: data.title.start_year,
        quality: ["2160p", "1080p"],
        type: "tvSeries",
        season,
        episode,
      }),
      getEZTV({
        title: data.title.primary_title,
        year: data.title.start_year,
        quality: ["2160p", "1080p"],
        type: "tvSeries",
        season,
        episode,
      }),
    ]);

    const list = filterTorrents(
      _1337x.concat(piratesBay).concat(eztv).sort(sortTorrents),
    );

    return c.json({
      streams: list.map((l) => ({
        infoHash: l.infoHash!,
        name: l.quality + (l.isHDR ? " HDR" : ""),
        description: `${l.provider}${l.seeders ? `\r\n🌱: ${l.seeders}` : ""}\r\n${xbytes(l.size ?? 0)}`,
        behaviorHints: {
          filename: l.name,
          videoSize: l.size,
          bingeGroup: l.uploader + "-" + l.quality + "-" + String(l.isHDR),
        },
      })),
    });
  },
);

export default streamRoute;
