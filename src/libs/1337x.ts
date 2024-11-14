import * as cheerio from "cheerio";
import xbytes from "xbytes";
import { getInfoHash } from "../utils/torrent";
import { formatSeasonEpisode, hdrRegex, qualityRegex } from "../utils/string";
import type { Quality } from "../types/stream";
import type { Args } from "../types/libs";

async function extractHash(url: string) {
  const response = await fetch(url);
  const $ = cheerio.load(await response.text());
  const magnet = getInfoHash($("#openPopup").attr("href"));
  return [url, magnet ?? ""];
}

export default async function get1337x(args: Args) {
  let query: string;

  if (args.type === "movie") {
    query = `${args.title} ${args.year}`;
  } else {
    query = `${args.title} ${formatSeasonEpisode(args.season, args.episode).join("")}`;
  }

  const url = `https://1337x.to/sort-category-search/${query}/${args.type === "movie" ? "Movies" : "TV"}/seeders/desc/1/`;

  console.log({ url })
  const response = await fetch(url);
  const $ = cheerio.load(await response.text());
  console.log($.html())
  const { torrents } = $.extract({
    torrents: [
      {
        selector: "tbody tr",
        value: {
          url: {
            selector: "td.name a:not(.icon)",
            value(el) {
              return "https://1337x.to" + el.attribs.href;
            },
          },
          name: {
            selector: "td.name",
            value: (el) => $(el).text().replaceAll(".", " "),
          },
          isHDR: {
            selector: "td.name",
            value: (el) => hdrRegex.test($(el).text()),
          },
          quality: {
            selector: "td.name",
            value: (el) => $(el).text().match(qualityRegex)?.[0],
          },
          seeders: {
            selector: "td.seeds",
            value: (el) => Number($(el).text()),
          },
          leechers: {
            selector: "td.leeches",
            value: (el) => Number($(el).text()),
          },
          size: {
            selector: "td.size",
            value(el) {
              return xbytes.parseSize(
                $(el)
                  .contents()
                  .filter((_, { nodeType }) => nodeType === 3)
                  .text(),
              );
            },
          },
          uploader: "td.uploader, td.user, td.vip, td.trial-uploader",
        },
      },
    ],
  });

  const processed = torrents
    .filter(
      (tor) => tor.quality && args.quality.includes(tor.quality as Quality),
    )
    .sort((a, b) => (a.seeders! < b.seeders! ? 1 : -1))

  const hashMap = Object.fromEntries(
    await Promise.all(processed.map((tor) => extractHash(tor.url!))),
  );

  const final = processed.map(({ url, ...tor }) => ({
    ...tor,
    name: tor.name!,
    provider: "1337x",
    infoHash: hashMap[url ?? ""],
  }));

  return final;
}
