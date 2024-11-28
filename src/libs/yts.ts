import xbytes from "xbytes";
import * as cheerio from "cheerio";
import type { Args } from "../types/libs";
import type { Quality } from "../types/stream";
import { getContext } from "hono/context-storage";
import { endTime, startTime } from "hono/timing";
import { hdrRegex, qualityRegex } from "../utils/string";

export default async function getYts(args: Args) {
  if (args.type === "tvSeries") {
    return [];
  }
  startTime(getContext(), "YTS", "Torrents from The YTS");
  const movieUrl = `https://yts.mx/rss/${args.title}/all/all/0/en`;
  const movieResponse = await fetch(movieUrl);
  let text = await movieResponse.text();
  text = text.replaceAll(/<(.*)><!\[CDATA\[(.*)\]\]><\/\1>/g, "<$1>$2</$1>");
  const $ = cheerio.load(text, { xml: true });
  const { torrents } = $.extract({
    torrents: [
      {
        selector: "item",
        value: {
          title: "title",
          quality: {
            selector: "title",
            value: (el) => {
              return $(el).text().match(qualityRegex)?.[0];
            },
          },
          size: {
            selector: "description",
            value: (el) => {
              let size = $(el)
                .text()
                .replace(/.*Size: (.*)Runtime.*/, "$1")
                .replace(" ", "");
              return xbytes.parseSize(size);
            },
          },
          infoHash: {
            selector: "enclosure",
            value: (el) => el.attribs.url.split("/").at(-1),
          },
        },
      },
    ],
  });
  const results = torrents
    .filter(
      (torrent) =>
        new RegExp(args.title).test(torrent.title!) &&
        args.quality.includes(torrent.quality as Quality),
    )
    .map((torrent) => ({
      ...torrent,
      name: torrent.title!,
      isHDR: hdrRegex.test(torrent.title!),
      seeders: 10,
      leechers: 0,
      title: torrent.title!,
      quality: torrent.quality!,
      size: Number(torrent.size),
      infoHash: torrent.infoHash!,
      provider: "YTS",
      uploader: "yts",
    }));
  endTime(getContext(), "YTS");
  return results;
}
