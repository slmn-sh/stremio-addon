import type { Quality } from "../types/stream";
import type { Args } from "../types/libs";
import { formatSeasonEpisode, hdrRegex, qualityRegex } from "../utils/string";
import { getContext } from "hono/context-storage";
import { endTime, startTime } from "hono/timing";

type Response = {
  id: string;
  name: string;
  info_hash: string;
  leechers: string;
  seeders: string;
  num_files: string;
  size: string;
  username: string;
  added: string;
  status: string;
  category: string;
  imdb: string;
};

export default async function getPirateBay(args: Args) {
  startTime(getContext(), "PirateBay", "Torrents from The Pirate Bay");
  let url = "https://apibay.org/q.php";
  let q = `${args.title}+`;

  if (args.type === "tvSeries") {
    q += `${formatSeasonEpisode(args.season, args.episode).join("")}`;
  } else {
    q += args.year;
  }

  const params = {
    q,
    cat: "200",
  };
  url += "?" + new URLSearchParams(params).toString();

  const response = await fetch(url, {
    headers: {
      Origin: "https://thepiratebay.org",
      Referer: "https://thepiratebay.org",
      Priority: "u=5, i",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
    },
  });
  const torrents = await response.json<Response[]>();

  const results = torrents
    .map((torrent) => ({
      name: torrent.name,
      isHDR: hdrRegex.test(torrent.name),
      quality: String(torrent.name.match(qualityRegex)?.[0]),
      seeders: Number(torrent.seeders),
      leechers: Number(torrent.leechers),
      size: Number(torrent.size),
      provider: "The Pirate Bay",
      uploader: torrent.username,
      infoHash: torrent.info_hash,
    }))
    .filter(
      (tor) => tor.quality && args.quality.includes(tor.quality as Quality),
    );

  endTime(getContext(), "PirateBay");
  return results;
}
