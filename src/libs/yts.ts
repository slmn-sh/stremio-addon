import xbytes from "xbytes";
import * as cheerio from "cheerio";
import { getInfoHash } from "../utils/torrent";
import type { Args } from "../types/libs";
import type { Quality } from "../types/stream";

type Response = {
  message: string;
  status: "ok";
  data: {
    img: string;
    title: string;
    url: string;
    year: string;
  }[];
};

export default async function getYts(args: Args) {
  if (args.type === "tvSeries") {
    return [];
  }
  let url = "https://yts.mx/ajax/search?";
  const params = {
    query: args.title,
  };
  url += new URLSearchParams(params).toString();
  const response = await fetch(url);
  const data = await response.json<Response>();
  const movie = data.data.find(
    (d) => d.title === args.title && Number(d.year) === args.year,
  );
  if (!movie) {
    return [];
  }
  const movieResponse = await fetch(movie.url);
  const $ = cheerio.load(await movieResponse.text());
  const { torrents } = $.extract({
    torrents: [
      {
        selector: ".modal-content .modal-torrent",
        value: {
          quality: ".modal-quality span",
          size: {
            selector: "p.quality-size:nth-of-type(3)",
            value: (el) => {
              return xbytes.parseSize($(el).text().replace(" ", ""));
            },
          },
          infoHash: {
            selector: ".magnet-download",
            value: (el) => getInfoHash(el.attribs.href),
          },
        },
      },
    ],
  });
  return torrents
    .filter((torrent) => args.quality.includes(torrent.quality as Quality))
    .map((torrent) => ({
      ...torrent,
      name: $("#movie-info h1").text()!,
      isHDR: false,
      seeders: 0,
      leechers: 0,
      provider: "YTS",
      uploader: "yts",
    }));
}
