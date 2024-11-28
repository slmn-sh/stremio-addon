import * as cheerio from "cheerio";
import type { Args } from "../types/libs";
import { formatSeasonEpisode, hdrRegex, qualityRegex } from "../utils/string";
import xbytes from "xbytes";
import { getInfoHash } from "../utils/torrent";
import { getContext } from "hono/context-storage";
import { endTime, startTime } from "hono/timing";
import { Quality } from "../types/stream";

export default async function getEZTV(args: Args) {
  if (args.type === "movie") {
    return [];
  }
  startTime(getContext(), "EZTV", "Torrents from EZTV");
  const url = `https://eztvx.to/search/${args.title.replaceAll(" ", "-")}-${formatSeasonEpisode(args.season, args.episode).join("")}`;

  const response = await fetch(url, {
    body: "layout=def_wlinks",
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      "Content-Type": "application/x-www-form-urlencoded",
      Pragma: "no-cache",
      Priority: "u=0, i",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1.1 Safari/605.1.15",
    },
    method: "POST",
  });
  const $ = cheerio.load(await response.text());
  const { torrents } = $.extract({
    torrents: [
      {
        selector: 'tbody tr[name="hover"]',
        value: {
          name: {
            selector: "td:nth-of-type(2) a",
            value: (el) => el.attribs.title,
          },
          isHDR: {
            selector: "td:nth-of-type(2) a",
            value: (el) => hdrRegex.test(el.attribs.title),
          },
          quality: {
            selector: "td:nth-of-type(2) a",
            value: (el) => el.attribs.title?.match(qualityRegex)?.[0],
          },
          seeders: {
            selector: "td font",
            value: (el) => +$(el).text() || 0,
          },
          infoHash: {
            selector: "td a.magnet",
            value: (el) => getInfoHash(el.attribs.href),
          },
          size: {
            selector: "td:nth-of-type(4)",
            value: (el) => xbytes.parseSize($(el).text().replace(" ", "")),
          },
        },
      },
    ],
  });

  const processed = torrents.filter(
    (tor) => tor.quality && args.quality.includes(tor.quality as Quality),
  );

  const final = processed.map((tor) => ({
    ...tor,
    name: tor.name!,
    isHDR: Boolean(tor.isHDR),
    seeders: Number(tor.seeders),
    leechers: 0,
    quality: String(tor.quality),
    uploader: "eztv",
    size: Number(tor.size),
    provider: "EZTV",
    infoHash: tor.infoHash!,
  }));

  endTime(getContext(), "EZTV");
  return final;
}
